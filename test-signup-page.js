const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SIGNUP_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/Sign_up/PBSMember/Sign_Up.aspx?hkey=d494d4ff-019f-4b76-9475-66fc2cd755dc';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testSignupPage() {
    // Load local CSS and fix image paths
    let localCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    localCss = localCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({
        headless: false,
        protocolTimeout: 120000
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Handle dialogs
    page.on('dialog', async dialog => {
        console.log('[DIALOG] Accepting:', dialog.message().substring(0, 50) + '...');
        await dialog.accept();
    });

    try {
        console.log('=== LOADING SIGN UP PAGE ===');
        await page.goto(SIGNUP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);

        // Screenshot BEFORE injecting CSS
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'signup-page-before-css.png'),
            fullPage: false
        });
        console.log('Screenshot saved: signup-page-before-css.png');

        // Inject local CSS
        console.log('Injecting local CSS...');
        await page.addStyleTag({ content: localCss });
        await sleep(1000);

        // Screenshot AFTER injecting CSS
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'signup-page-after-css.png'),
            fullPage: false
        });
        console.log('Screenshot saved: signup-page-after-css.png');

        // Take a full page screenshot too
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'signup-page-full.png'),
            fullPage: true
        });
        console.log('Screenshot saved: signup-page-full.png');

        console.log('\n=== TEST COMPLETE ===');
        await sleep(5000);

    } catch (error) {
        console.error('Error:', error);
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'signup-page-error.png'),
            fullPage: true
        });
    } finally {
        await browser.close();
    }
}

testSignupPage();
