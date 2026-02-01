const puppeteer = require('puppeteer');
const path = require('path');

const RESOURCE_LIB_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc';
const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function login(page, username, password) {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');

    // Wait for login to process
    await new Promise(r => setTimeout(r, 6000));
    return page.url();
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,  // Show browser so we can see what's happening
        args: ['--no-sandbox'],
        defaultViewport: { width: 1280, height: 900 }
    });

    const page = await browser.newPage();

    console.log('=== LOGGING IN AS STAFF (REDACTED_USER) ===');
    const afterLoginUrl = await login(page, 'REDACTED_USER', 'REDACTED_PASSWORD');
    console.log('After login URL:', afterLoginUrl);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'staff-after-login.png'), fullPage: true });

    console.log('\n=== NAVIGATING TO RESOURCE LIBRARY ===');
    try {
        await page.goto(RESOURCE_LIB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
        console.log('Navigation note:', e.message);
        await new Promise(r => setTimeout(r, 3000));
    }

    console.log('Current URL:', page.url());

    if (page.url().includes('Sign_In')) {
        console.log('Still on login page - trying direct navigation again');
        await new Promise(r => setTimeout(r, 2000));
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'staff-resource-library.png'), fullPage: true });
    console.log('Screenshot saved: staff-resource-library.png');

    // Keep browser open for 10 seconds to inspect
    console.log('\nBrowser staying open for 10 seconds...');
    await new Promise(r => setTimeout(r, 10000));

    await browser.close();
})();
