const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { getCredentials } = require('./test-config');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const DIRECTORY_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/Membership/Directory/PBSMember/Directory.aspx?hkey=dedd1298-4a4a-4e0a-a0a8-e4bcc640c2cc';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testDirectoryPage() {
    let localCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    localCss = localCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    page.on('dialog', async d => await d.accept());

    // Login
    console.log('Logging in...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    const { username, password } = getCredentials();
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
    await page.evaluate(() => document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton').click());
    await sleep(6000);

    // Go to Directory page
    console.log('Navigating to Directory page...');
    await page.goto(DIRECTORY_URL, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Screenshot BEFORE CSS
    await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'directory-before-css.png'),
        fullPage: false
    });
    console.log('Screenshot saved: directory-before-css.png');

    // Inject CSS
    await page.addStyleTag({ content: localCss });
    await sleep(1000);

    // Screenshot AFTER CSS
    await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'directory-after-css.png'),
        fullPage: false
    });
    console.log('Screenshot saved: directory-after-css.png');

    console.log('Waiting for inspection...');
    await sleep(15000);
    await browser.close();
}

testDirectoryPage();
