const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { getCredentials } = require('./test-config');

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
        const { username, password } = getCredentials();
        await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
        await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
        await page.evaluate(() => {
            const btn = document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
            if (btn) btn.click();
        });
        await sleep(6000);
        console.log('Logged in!');

        // Go to Account page
        console.log('Navigating to Account page...');
        await page.goto(ACCOUNT_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(3000);

        // Inject CSS to main page
        console.log('Injecting local CSS...');
        await page.addStyleTag({ content: localCss });
        await sleep(500);

        // Find and click Edit link - try getting element handle
        console.log('Looking for Edit link...');

        // Get all anchor elements and find the one with "Edit" text in the sidebar
        const links = await page.$$('a');
        let clickedEdit = false;

        for (const link of links) {
            const text = await page.evaluate(el => el.textContent?.trim(), link);
            const box = await link.boundingBox();

            if (text === 'Edit' && box && box.x < 200 && box.y > 100 && box.y < 200) {
                console.log(`Found Edit link at (${box.x}, ${box.y}), clicking...`);
                await link.click();
                clickedEdit = true;
                break;
            }
        }

        if (!clickedEdit) {
            // Try clicking any Edit link
            for (const link of links) {
                const text = await page.evaluate(el => el.textContent?.trim(), link);
                const box = await link.boundingBox();

                if (text === 'Edit' && box) {
                    console.log(`Found Edit link at (${box.x}, ${box.y}), clicking...`);
                    await link.click();
                    clickedEdit = true;
                    break;
                }
            }
        }

        if (!clickedEdit) {
            console.log('No Edit link found, trying coordinate click...');
            await page.mouse.click(165, 135);
        }

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

        // Check dialog styling
        const dialogCheck = await page.evaluate(() => {
            const radWindow = document.querySelector('.RadWindow, [class*="RadWindow"]');
            if (radWindow) {
                const titleBar = radWindow.querySelector('.rwTitleBar');
                const titleEl = radWindow.querySelector('.rwTitle, .rwTitleBar em, .rwTitleBar span');
                const titleStyle = titleEl ? getComputedStyle(titleEl) : null;
                const titleBarStyle = titleBar ? getComputedStyle(titleBar) : null;

                return {
                    found: true,
                    titleBarBg: titleBarStyle ? titleBarStyle.backgroundColor : null,
                    titleColor: titleStyle ? titleStyle.color : null,
                    titleFontSize: titleStyle ? titleStyle.fontSize : null
                };
            }
            return { found: false };
        });
        console.log('Dialog check:', JSON.stringify(dialogCheck, null, 2));

        console.log('\n=== WAITING FOR MANUAL INSPECTION ===');
        await sleep(15000);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

testEditDialog();
