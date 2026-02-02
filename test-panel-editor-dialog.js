const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const ACCOUNT_URL = 'https://members.phibetasigma1914.org/iMISdev/iCore/Contacts/MyAccount_DefaultPage.aspx';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

// Get credentials from command line: node test-panel-editor-dialog.js <username> <password>
const USERNAME = process.argv[2] || 'mcornelius';
const PASSWORD = process.argv[3] || '';

if (!PASSWORD) {
    console.error('Usage: node test-panel-editor-dialog.js <username> <password>');
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

    // Go to Account page
    console.log('\n=== NAVIGATING TO ACCOUNT PAGE ===');
    try {
        await page.goto(ACCOUNT_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
        console.log('Navigation note:', e.message);
        await new Promise(r => setTimeout(r, 3000));
    }
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot account page
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'panel-editor-1-account-page.png'), fullPage: true });
    console.log('Screenshot: panel-editor-1-account-page.png');

    // Find and click an "Edit" link for a panel
    console.log('\n=== LOOKING FOR EDIT PANEL LINK ===');
    const editLinks = await page.evaluate(() => {
        const links = [];
        // Look for edit links - they typically have "Edit" text or edit icons
        document.querySelectorAll('a').forEach(a => {
            const text = a.innerText || a.textContent || '';
            const href = a.href || '';
            const onclick = a.getAttribute('onclick') || '';
            if (text.toLowerCase().includes('edit') ||
                href.toLowerCase().includes('edit') ||
                onclick.toLowerCase().includes('edit') ||
                a.className.toLowerCase().includes('edit')) {
                links.push({
                    text: text.substring(0, 50),
                    href: href.substring(0, 100),
                    onclick: onclick.substring(0, 100),
                    className: a.className
                });
            }
        });
        return links;
    });

    console.log('Found edit links:', JSON.stringify(editLinks.slice(0, 10), null, 2));

    // Try to click the first edit link that opens a panel editor
    const clicked = await page.evaluate(() => {
        // Look for panel edit links specifically
        const editLink = document.querySelector('a[onclick*="EditPanel"], a[href*="EditPanel"], .panel-heading-options a, .PanelHeadOptions a');
        if (editLink) {
            editLink.click();
            return { found: true, text: editLink.innerText, onclick: editLink.getAttribute('onclick')?.substring(0, 100) };
        }

        // Try any edit link
        const anyEdit = document.querySelector('a[title="Edit"], a.edit-link, a[onclick*="openWindow"]');
        if (anyEdit) {
            anyEdit.click();
            return { found: true, text: anyEdit.innerText, onclick: anyEdit.getAttribute('onclick')?.substring(0, 100) };
        }

        return { found: false };
    });

    console.log('Click result:', clicked);

    if (clicked.found) {
        // Wait for dialog to open
        await new Promise(r => setTimeout(r, 3000));

        // Screenshot with dialog
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'panel-editor-2-dialog-open.png'), fullPage: true });
        console.log('Screenshot: panel-editor-2-dialog-open.png');

        // Analyze the dialog
        const dialogInfo = await page.evaluate(() => {
            const radWindow = document.querySelector('.RadWindow, [class*="RadWindow"]');
            const rwContent = document.querySelector('.rwContent');
            const rwTable = document.querySelector('.RadWindow table, .rwTable');

            const results = {};

            if (radWindow) {
                const rect = radWindow.getBoundingClientRect();
                const style = getComputedStyle(radWindow);
                results.radWindow = {
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    left: Math.round(rect.left),
                    top: Math.round(rect.top),
                    display: style.display,
                    computedWidth: style.width
                };
            }

            if (rwContent) {
                const rect = rwContent.getBoundingClientRect();
                const style = getComputedStyle(rwContent);
                results.rwContent = {
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    computedWidth: style.width
                };
            }

            if (rwTable) {
                const rect = rwTable.getBoundingClientRect();
                const style = getComputedStyle(rwTable);
                results.rwTable = {
                    width: Math.round(rect.width),
                    computedWidth: style.width,
                    minWidth: style.minWidth
                };
            }

            // Check for any elements with very narrow widths
            const narrowElements = [];
            document.querySelectorAll('.RadWindow *, .rwContent *').forEach(el => {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.width < 50 && el.tagName !== 'TD' && el.tagName !== 'TH') {
                    narrowElements.push({
                        tag: el.tagName,
                        className: el.className.substring(0, 50),
                        width: Math.round(rect.width),
                        computedWidth: style.width
                    });
                }
            });
            results.narrowElements = narrowElements.slice(0, 10);

            return results;
        });

        console.log('\n=== DIALOG ANALYSIS ===');
        console.log(JSON.stringify(dialogInfo, null, 2));

        if (dialogInfo.radWindow) {
            if (dialogInfo.radWindow.width < 400) {
                console.log('\n✗ PROBLEM: Dialog is too narrow (' + dialogInfo.radWindow.width + 'px)');
            } else {
                console.log('\n✓ Dialog width looks OK (' + dialogInfo.radWindow.width + 'px)');
            }
        }
    } else {
        console.log('Could not find edit panel link to click');
    }

    console.log('\nBrowser open for 60 seconds for inspection...');
    await new Promise(r => setTimeout(r, 60000));

    await browser.close();
})();
