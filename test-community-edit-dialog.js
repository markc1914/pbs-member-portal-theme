const puppeteer = require('puppeteer');
const path = require('path');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const COMMUNITY_URL = 'https://members.phibetasigma1914.org/imisdev/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=d2a740ce-8b73-4a54-97a5-990ac2cce029&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

// Get credentials from command line: node test-community-edit-dialog.js <username> <password>
const USERNAME = process.argv[2] || 'mcornelius';
const PASSWORD = process.argv[3] || '';

if (!PASSWORD) {
    console.error('Usage: node test-community-edit-dialog.js <username> <password>');
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        protocolTimeout: 60000
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('dialog', async dialog => {
        console.log('[DIALOG] Accepting...');
        await dialog.accept();
    });

    // Login
    console.log('=== LOGGING IN ===');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', USERNAME);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', PASSWORD);
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await new Promise(r => setTimeout(r, 6000));
    console.log('Logged in!');

    // Go to Community page
    console.log('\n=== NAVIGATING TO COMMUNITY PAGE ===');
    try {
        await page.goto(COMMUNITY_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
        console.log('Navigation note:', e.message);
        await new Promise(r => setTimeout(r, 3000));
    }
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot community page
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'community-edit-1-page.png'), fullPage: true });
    console.log('Screenshot: community-edit-1-page.png');

    // Find edit links
    console.log('\n=== LOOKING FOR EDIT LINKS ===');
    const editLinks = await page.evaluate(() => {
        const links = [];
        document.querySelectorAll('a').forEach(a => {
            const text = a.innerText || a.textContent || '';
            const href = a.href || '';
            const onclick = a.getAttribute('onclick') || '';
            const title = a.getAttribute('title') || '';
            if (text.toLowerCase().includes('edit') ||
                href.toLowerCase().includes('edit') ||
                onclick.toLowerCase().includes('edit') ||
                title.toLowerCase().includes('edit')) {
                links.push({
                    text: text.substring(0, 50).trim(),
                    title: title,
                    href: href.substring(0, 100),
                    onclick: onclick.substring(0, 150),
                    className: a.className.substring(0, 50)
                });
            }
        });
        return links;
    });

    console.log('Found edit links:', JSON.stringify(editLinks, null, 2));

    // Try clicking an edit link
    if (editLinks.length > 0) {
        console.log('\n=== CLICKING FIRST EDIT LINK ===');
        const clicked = await page.evaluate(() => {
            const editLink = document.querySelector('a[onclick*="Edit"], a[href*="Edit"], a[title*="Edit"]');
            if (editLink) {
                console.log('Clicking:', editLink.outerHTML.substring(0, 200));
                editLink.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            await new Promise(r => setTimeout(r, 3000));

            // Screenshot with dialog
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'community-edit-2-dialog.png'), fullPage: true });
            console.log('Screenshot: community-edit-2-dialog.png');

            // Analyze the dialog
            const dialogInfo = await page.evaluate(() => {
                const radWindow = document.querySelector('.RadWindow, [class*="RadWindow"]');
                const rwContent = document.querySelector('.rwContent');
                const iframe = document.querySelector('.RadWindow iframe, .rwContent iframe');

                const results = {};

                if (radWindow) {
                    const rect = radWindow.getBoundingClientRect();
                    const style = getComputedStyle(radWindow);
                    results.radWindow = {
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        left: Math.round(rect.left),
                        computedWidth: style.width,
                        computedMinWidth: style.minWidth
                    };
                }

                if (rwContent) {
                    const rect = rwContent.getBoundingClientRect();
                    const style = getComputedStyle(rwContent);
                    results.rwContent = {
                        width: Math.round(rect.width),
                        computedWidth: style.width
                    };
                }

                if (iframe) {
                    const rect = iframe.getBoundingClientRect();
                    results.iframe = {
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        src: iframe.src?.substring(0, 100)
                    };
                }

                // Check all tables in the dialog
                const tables = [];
                document.querySelectorAll('.RadWindow table').forEach((t, i) => {
                    if (i < 5) {
                        const rect = t.getBoundingClientRect();
                        const style = getComputedStyle(t);
                        tables.push({
                            width: Math.round(rect.width),
                            computedWidth: style.width,
                            className: t.className.substring(0, 50)
                        });
                    }
                });
                results.tables = tables;

                return results;
            });

            console.log('\n=== DIALOG ANALYSIS ===');
            console.log(JSON.stringify(dialogInfo, null, 2));

            if (dialogInfo.radWindow && dialogInfo.radWindow.width < 400) {
                console.log('\n✗ PROBLEM: Dialog is too narrow (' + dialogInfo.radWindow.width + 'px)');
            } else if (dialogInfo.radWindow) {
                console.log('\n✓ Dialog width: ' + dialogInfo.radWindow.width + 'px');
            }
        }
    }

    console.log('\nBrowser open for 60 seconds for inspection...');
    await new Promise(r => setTimeout(r, 60000));

    await browser.close();
})();
