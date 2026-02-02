const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const COMMUNITY_URL = 'https://members.phibetasigma1914.org/imisdev/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=d2a740ce-8b73-4a54-97a5-990ac2cce029&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testCommunityPage() {
    let localCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    localCss = localCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    page.on('dialog', async d => await d.accept());

    // Login
    console.log('Logging in...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'REDACTED_USER');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'REDACTED_PASSWORD');
    await page.evaluate(() => document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton').click());
    await sleep(6000);

    // Go to Community page
    console.log('Navigating to Community page...');
    await page.goto(COMMUNITY_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);

    // Screenshot BEFORE CSS
    await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'community-before-css.png'),
        fullPage: false
    });
    console.log('Screenshot saved: community-before-css.png');

    // Inject CSS
    await page.addStyleTag({ content: localCss });
    await sleep(1000);

    // Screenshot AFTER CSS
    await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'community-after-css.png'),
        fullPage: false
    });
    console.log('Screenshot saved: community-after-css.png');

    // Check sidebar elements
    const sidebarCheck = await page.evaluate(() => {
        const results = {};

        // Check col-secondary
        const colSecondary = document.querySelector('.col-secondary');
        if (colSecondary) {
            const style = getComputedStyle(colSecondary);
            const rect = colSecondary.getBoundingClientRect();
            results.colSecondary = {
                display: style.display,
                width: rect.width,
                height: rect.height,
                hasLinks: colSecondary.querySelectorAll('a').length,
                hasImages: colSecondary.querySelectorAll('img').length
            };
        }

        // Check SubNavPanel
        const subNav = document.querySelector('#ctl01_SubNavPanel');
        if (subNav) {
            const style = getComputedStyle(subNav);
            const rect = subNav.getBoundingClientRect();
            results.subNavPanel = {
                display: style.display,
                width: rect.width,
                height: rect.height
            };
        }

        return results;
    });
    console.log('Sidebar check:', JSON.stringify(sidebarCheck, null, 2));

    console.log('Waiting for inspection...');
    await sleep(10000);
    await browser.close();
}

testCommunityPage();
