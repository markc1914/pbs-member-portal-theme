const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const ACCOUNT_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/My_Account_2/PBSMember/AccountPage.aspx?hkey=53f0d6d1-e7a3-4f97-87b5-d6d0a6a282f0';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testEditDialog() {
    let localCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    localCss = localCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({
        headless: false,
        protocolTimeout: 120000
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    page.on('dialog', async dialog => {
        console.log('[DIALOG] Accepting:', dialog.message().substring(0, 50) + '...');
        await dialog.accept();
    });

    try {
        // Login
        console.log('=== LOGGING IN ===');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'REDACTED_USER');
        await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'REDACTED_PASSWORD');
        await page.evaluate(() => {
            const btn = document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
            if (btn) btn.click();
        });
        await sleep(6000);
        console.log('Logged in!');

        // Go to Account page
        console.log('Navigating to Account page...');
        await page.goto(ACCOUNT_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(3000); // Wait longer for dynamic content

        // Inject CSS to main page
        console.log('Injecting local CSS...');
        await page.addStyleTag({ content: localCss });
        await sleep(500);

        // Find ALL links and look for Edit - case insensitive, check innerText
        const allLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            return links.map((a, i) => ({
                index: i,
                text: a.innerText?.trim() || a.textContent?.trim() || '',
                id: a.id,
                className: a.className,
                visible: a.offsetParent !== null,
                rect: a.getBoundingClientRect()
            })).filter(l => l.text.toLowerCase().includes('edit'));
        });
        console.log('Edit links found:', JSON.stringify(allLinks, null, 2));

        // Click the first visible Edit link (above the name)
        console.log('Clicking Edit link above name...');
        const clicked = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            for (const link of links) {
                const text = (link.innerText || link.textContent || '').trim().toLowerCase();
                if (text === 'edit' && link.offsetParent !== null) {
                    const rect = link.getBoundingClientRect();
                    // The first Edit link should be in the upper left area (sidebar)
                    if (rect.top > 100 && rect.top < 300 && rect.left < 200) {
                        link.click();
                        return { clicked: true, rect, text: link.innerText };
                    }
                }
            }
            // If not found by position, just click the first visible Edit
            for (const link of links) {
                const text = (link.innerText || link.textContent || '').trim().toLowerCase();
                if (text === 'edit' && link.offsetParent !== null) {
                    link.click();
                    return { clicked: true, fallback: true, text: link.innerText };
                }
            }
            return { clicked: false };
        });
        console.log('Click result:', clicked);
        await sleep(4000);

        // Inject CSS again after dialog opens
        await page.addStyleTag({ content: localCss });
        await sleep(1000);

        // Screenshot
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'edit-dialog-test.png'),
            fullPage: false
        });
        console.log('Screenshot saved: edit-dialog-test.png');

        // Check if RadWindow appeared
        const dialogCheck = await page.evaluate(() => {
            const radWindow = document.querySelector('.RadWindow, [class*="RadWindow"]');
            if (radWindow) {
                const titleRow = radWindow.querySelector('.rwTitleRow, .rwTitleBar');
                const style = titleRow ? getComputedStyle(titleRow) : null;
                return {
                    found: true,
                    className: radWindow.className,
                    titleRowBg: style ? style.backgroundImage : null,
                    titleRowBgColor: style ? style.backgroundColor : null
                };
            }
            return { found: false };
        });
        console.log('Dialog check:', JSON.stringify(dialogCheck, null, 2));

        console.log('\n=== WAITING FOR MANUAL INSPECTION ===');
        await sleep(10000);

    } catch (error) {
        console.error('Error:', error);
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'edit-dialog-error.png'),
            fullPage: true
        });
    } finally {
        await browser.close();
    }
}

testEditDialog();
