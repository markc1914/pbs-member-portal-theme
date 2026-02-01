const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TEST_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');

async function injectCSS(page) {
    let css = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    css = css.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);
    await page.addStyleTag({ content: css });
}

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await injectCSS(page);
    await new Promise(r => setTimeout(r, 1500));

    const info = await page.evaluate(() => {
        const navbar = document.querySelector('#navbar-collapse');
        const radMenu = document.querySelector('.RadMenu');
        const signUp = document.querySelector('.RadMenu a[href*="Sign_up"]');

        return {
            navbar: navbar ? {
                display: window.getComputedStyle(navbar).display,
                visibility: window.getComputedStyle(navbar).visibility,
                height: navbar.getBoundingClientRect().height,
                overflow: window.getComputedStyle(navbar).overflow
            } : 'not found',
            radMenu: radMenu ? {
                display: window.getComputedStyle(radMenu).display,
                height: radMenu.getBoundingClientRect().height
            } : 'not found',
            signUp: signUp ? {
                visible: signUp.getBoundingClientRect().width > 0,
                y: signUp.getBoundingClientRect().y
            } : 'not found'
        };
    });

    console.log('=== MOBILE MENU DEBUG ===');
    console.log('navbar-collapse:', JSON.stringify(info.navbar, null, 2));
    console.log('RadMenu:', JSON.stringify(info.radMenu, null, 2));
    console.log('SIGN UP:', JSON.stringify(info.signUp, null, 2));

    await browser.close();
})();
