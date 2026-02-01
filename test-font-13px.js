const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

(async () => {
    let baseCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    baseCss = baseCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set up dialog handler for JavaScript alerts
    page.on('dialog', async dialog => {
        console.log('Dialog detected:', dialog.message());
        await dialog.accept();
        console.log('Dialog dismissed');
    });

    // DESKTOP VIEW
    console.log('=== DESKTOP VIEW (1280x800) ===');
    await page.setViewport({ width: 1280, height: 800 });

    // Login as REDACTED_USER
    console.log('Logging in as REDACTED_USER...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'REDACTED_USER');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'REDACTED_PASSWORD');
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await new Promise(r => setTimeout(r, 5000));
    console.log('Logged in! Current URL:', page.url());

    // Inject base CSS + 13px font override
    const fontOverride = `
        #hd .RadMenu a.rmLink.rmRootLink,
        #hd .RadMenu_Austin a.rmLink.rmRootLink,
        #hd .RadMenu a.rmLink.rmRootLink .rmText,
        #hd .RadMenu_Austin a.rmLink.rmRootLink .rmText {
            font-size: 13px !important;
        }
    `;
    await page.addStyleTag({ content: baseCss });
    await page.addStyleTag({ content: fontOverride });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'font-13px-desktop-auth.png') });
    console.log('Screenshot saved: font-13px-desktop-auth.png');

    // MOBILE VIEW
    console.log('\n=== MOBILE VIEW (375x812) ===');
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Re-inject CSS after navigation
    await page.addStyleTag({ content: baseCss });
    await page.addStyleTag({ content: fontOverride });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'font-13px-mobile-auth.png'), fullPage: true });
    console.log('Screenshot saved: font-13px-mobile-auth.png');

    // Also show current 11px on mobile for comparison
    console.log('\n=== MOBILE VIEW - CURRENT 11px for comparison ===');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.addStyleTag({ content: baseCss });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'font-11px-mobile-auth.png'), fullPage: true });
    console.log('Screenshot saved: font-11px-mobile-auth.png');

    console.log('\n=== Done! Compare: ===');
    console.log('  Desktop 13px: font-13px-desktop-auth.png');
    console.log('  Mobile 13px:  font-13px-mobile-auth.png');
    console.log('  Mobile 11px:  font-11px-mobile-auth.png (current)');

    console.log('\nBrowser staying open for 10 seconds...');
    await new Promise(r => setTimeout(r, 10000));

    await browser.close();
})();
