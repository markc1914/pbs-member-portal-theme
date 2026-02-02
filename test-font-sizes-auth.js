const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { getCredentials } = require('./test-config');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

// Font sizes to test (current is 11px)
const FONT_SIZES = [11, 12, 13, 14, 15];

(async () => {
    let baseCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    baseCss = baseCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Login
    const { username, password } = getCredentials();
    console.log('Logging in...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await new Promise(r => setTimeout(r, 5000));
    console.log('Logged in! Current URL:', page.url());

    for (const fontSize of FONT_SIZES) {
        console.log(`\n=== Testing font size: ${fontSize}px (AUTHENTICATED) ===`);

        // Navigate to home to reset styles
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 1000));

        // Inject base CSS
        await page.addStyleTag({ content: baseCss });

        // Override font size for nav menu
        const fontOverride = `
            #hd .RadMenu a.rmLink.rmRootLink,
            #hd .RadMenu_Austin a.rmLink.rmRootLink,
            #hd .RadMenu a.rmLink.rmRootLink .rmText,
            #hd .RadMenu_Austin a.rmLink.rmRootLink .rmText {
                font-size: ${fontSize}px !important;
            }
        `;
        await page.addStyleTag({ content: fontOverride });

        await new Promise(r => setTimeout(r, 500));

        const screenshotPath = path.join(SCREENSHOT_DIR, `nav-font-auth-${fontSize}px.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved: nav-font-auth-${fontSize}px.png`);
    }

    console.log('\n=== All authenticated screenshots saved ===');
    console.log('Compare:');
    FONT_SIZES.forEach(size => console.log(`  - nav-font-auth-${size}px.png`));

    await browser.close();
})();
