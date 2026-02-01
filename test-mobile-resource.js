const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const RESOURCE_LIB_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc';
const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

(async () => {
    // Load local CSS
    let css = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    css = css.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set mobile viewport
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    // Login as staff
    console.log('=== LOGGING IN AS STAFF (MOBILE) ===');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'mcornelius');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'gomab95');
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await new Promise(r => setTimeout(r, 5000));

    // Go to Resource Library
    console.log('=== GOING TO RESOURCE LIBRARY (MOBILE) ===');
    try {
        await page.goto(RESOURCE_LIB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
        console.log('Navigation timeout, continuing...');
        await new Promise(r => setTimeout(r, 3000));
    }

    // Inject local CSS
    console.log('=== INJECTING LOCAL CSS ===');
    await page.addStyleTag({ content: css });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile-resource-library.png'), fullPage: true });
    console.log('Screenshot saved: mobile-resource-library.png');

    // Check toolbar visibility
    const toolbarCheck = await page.evaluate(() => {
        const toolbar = document.querySelector('.RadMenu');
        const buttons = document.querySelectorAll('.RadMenu a.rmLink');

        return {
            toolbarFound: !!toolbar,
            buttonCount: buttons.length,
            buttons: Array.from(buttons).map(b => ({
                text: b.textContent.trim(),
                visible: b.getBoundingClientRect().width > 0
            }))
        };
    });

    console.log('\n=== MOBILE TOOLBAR CHECK ===');
    console.log('Toolbar found:', toolbarCheck.toolbarFound);
    console.log('Buttons:', toolbarCheck.buttons);

    console.log('\nBrowser staying open for 15 seconds...');
    await new Promise(r => setTimeout(r, 15000));

    await browser.close();
})();
