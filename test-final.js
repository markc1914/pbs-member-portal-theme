const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TEST_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function injectCSS(page) {
    let css = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    css = css.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);
    await page.addStyleTag({ content: css });
}

async function runTests() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const results = { passed: 0, failed: 0, tests: [] };

    try {
        // DESKTOP TEST
        console.log('=== DESKTOP TESTS (with CSS injection) ===\n');
        const desktop = await browser.newPage();
        await desktop.setViewport({ width: 1280, height: 800 });
        await desktop.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await injectCSS(desktop);
        await sleep(1500);

        const desktopChecks = await desktop.evaluate(() => {
            const signIn = document.querySelector('#ctl01_LoginStatus1');
            const signUp = document.querySelector('.RadMenu a[href*="Sign_up"], .RadMenu a[href*="Sign_Up"]');
            const panelHead = document.querySelector('[id*="ciNewContactSignInCommon"] .panel-heading');
            const logoArea = document.querySelector('#masterLogoArea');
            const signInDiv = document.querySelector('[id*="signInDiv"]');

            return {
                signInHidden: signIn ? (window.getComputedStyle(signIn).display === 'none') : true,
                signUpVisible: signUp ? (signUp.getBoundingClientRect().width > 0) : false,
                noRectangles: panelHead ? (window.getComputedStyle(panelHead).display === 'none') : true,
                bannerNoMargins: logoArea ? (parseInt(window.getComputedStyle(logoArea).padding) < 5) : true,
                signInDivNoBorder: signInDiv ? (window.getComputedStyle(signInDiv).borderStyle === 'none') : true
            };
        });

        results.tests.push({ name: 'Desktop: SIGN IN hidden', passed: desktopChecks.signInHidden });
        desktopChecks.signInHidden ? results.passed++ : results.failed++;

        results.tests.push({ name: 'Desktop: SIGN UP visible', passed: desktopChecks.signUpVisible });
        desktopChecks.signUpVisible ? results.passed++ : results.failed++;

        results.tests.push({ name: 'Desktop: No rectangles', passed: desktopChecks.noRectangles });
        desktopChecks.noRectangles ? results.passed++ : results.failed++;

        results.tests.push({ name: 'Desktop: Banner no margins', passed: desktopChecks.bannerNoMargins });
        desktopChecks.bannerNoMargins ? results.passed++ : results.failed++;

        results.tests.push({ name: 'Desktop: signInDiv no border', passed: desktopChecks.signInDivNoBorder });
        desktopChecks.signInDivNoBorder ? results.passed++ : results.failed++;

        // MOBILE TEST
        console.log('=== MOBILE TESTS (with CSS injection) ===\n');
        const mobile = await browser.newPage();
        await mobile.setViewport({ width: 375, height: 812, isMobile: true });
        await mobile.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await injectCSS(mobile);
        await sleep(1500);

        const mobileChecks = await mobile.evaluate(() => {
            const radMenu = document.querySelector('.RadMenu');
            const signUp = document.querySelector('.RadMenu a[href*="Sign_up"], .RadMenu a[href*="Sign_Up"]');
            const form = document.querySelector('input[id*="UserName"]');

            return {
                menuExpanded: radMenu ? (window.getComputedStyle(radMenu).display !== 'none' && radMenu.getBoundingClientRect().height > 0) : false,
                signUpVisible: signUp ? (signUp.getBoundingClientRect().width > 0) : false,
                formVisible: form !== null
            };
        });

        results.tests.push({ name: 'Mobile: Menu expanded', passed: mobileChecks.menuExpanded });
        mobileChecks.menuExpanded ? results.passed++ : results.failed++;

        results.tests.push({ name: 'Mobile: SIGN UP visible', passed: mobileChecks.signUpVisible });
        mobileChecks.signUpVisible ? results.passed++ : results.failed++;

        results.tests.push({ name: 'Mobile: Form visible', passed: mobileChecks.formVisible });
        mobileChecks.formVisible ? results.passed++ : results.failed++;

        await browser.close();
        return results;

    } catch (error) {
        console.error('Error:', error.message);
        await browser.close();
        return results;
    }
}

async function main() {
    console.log('=== LOGIN PAGE TESTS WITH CSS INJECTION ===\n');

    const results = await runTests();

    console.log('Test Results:');
    results.tests.forEach(test => {
        const status = test.passed ? '✓ PASS' : '✗ FAIL';
        console.log(`  ${status} - ${test.name}`);
    });

    console.log(`\nTotal: ${results.passed} passed, ${results.failed} failed`);

    if (results.failed === 0) {
        console.log('\n=== ALL TESTS PASSED - SHOWING BROWSER ===\n');

        const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });

        const desktop = await browser.newPage();
        await desktop.setViewport({ width: 1280, height: 800 });
        await desktop.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        let css = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
        css = css.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);
        await desktop.addStyleTag({ content: css });
        await sleep(1000);
        await desktop.screenshot({ path: path.join(SCREENSHOT_DIR, 'FINAL-login-desktop.png') });

        const mobile = await browser.newPage();
        await mobile.setViewport({ width: 375, height: 812, isMobile: true });
        await mobile.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await mobile.addStyleTag({ content: css });
        await sleep(1000);
        await mobile.screenshot({ path: path.join(SCREENSHOT_DIR, 'FINAL-login-mobile.png') });

        console.log('Screenshots: FINAL-login-desktop.png, FINAL-login-mobile.png');
        console.log('Browser open 15 seconds...');
        await sleep(15000);
        await browser.close();
    } else {
        process.exit(1);
    }
}

main();
