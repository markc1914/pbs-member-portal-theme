const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TEST_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');

(async () => {
    let css = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    css = css.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.addStyleTag({ content: css });
    await new Promise(r => setTimeout(r, 1000));

    const results = await page.evaluate(() => {
        // Try masterContentArea since login page doesn't have #bd
        const content = document.querySelector('#masterContentArea');
        if (content === null) return { error: 'No #masterContentArea found' };

        // Create test menu simulating Resource Library
        const div = document.createElement('div');
        div.className = 'RadMenu RadMenu_Austin';
        div.style.cssText = 'position: relative; padding: 10px; margin: 10px; border: 2px solid blue; background: #f5f5f5;';
        div.innerHTML = '<ul class="rmRootGroup"><li class="rmItem"><a class="rmLink rmRootLink" href="#"><span class="rmText">RESOURCE LIBRARY TEST</span></a></li></ul>';
        content.insertBefore(div, content.firstChild);

        void div.offsetHeight;

        const testLink = div.querySelector('a.rmLink');
        const testText = div.querySelector('.rmText');

        const debug = {
            contentFound: true,
            testLinkFound: testLink !== null,
            testTextFound: testText !== null
        };

        if (testLink) {
            const linkStyle = getComputedStyle(testLink);
            debug.linkColor = linkStyle.color;
            debug.linkBg = linkStyle.backgroundColor;
            debug.linkWebkitFill = linkStyle.webkitTextFillColor;
        }

        if (testText) {
            const textStyle = getComputedStyle(testText);
            debug.textColor = textStyle.color;
            debug.textWebkitFill = textStyle.webkitTextFillColor;
        }

        return debug;
    });

    console.log('=== CONTENT AREA MENU TEST (masterContentArea) ===');
    console.log(JSON.stringify(results, null, 2));

    if (results.linkColor) {
        const isWhite = results.linkColor.includes('255, 255, 255');
        console.log('\nLink color is white:', isWhite ? 'YES (BAD)' : 'NO (GOOD)');
        console.log('Text color:', results.textColor);
    }

    // Also test header nav is still white
    const headerResults = await page.evaluate(() => {
        const headerLink = document.querySelector('#hd .RadMenu a.rmLink');
        if (headerLink === null) return { error: 'No header nav found' };

        const style = getComputedStyle(headerLink);
        return {
            color: style.color,
            isWhite: style.color.includes('255')
        };
    });

    console.log('\n=== HEADER NAV TEST ===');
    console.log('Header nav color:', headerResults.color);
    console.log('Header nav is white:', headerResults.isWhite ? '✓ PASS' : '✗ FAIL');

    await page.screenshot({ path: 'testingScreenshots/resource-menu-test.png' });
    console.log('\nScreenshot saved: resource-menu-test.png');

    await browser.close();

    // Summary
    console.log('\n=== SUMMARY ===');
    const contentIsDark = results.linkColor && results.linkColor.indexOf('255, 255, 255') === -1;
    const headerIsWhite = headerResults.isWhite;

    console.log('Content menu has dark text:', contentIsDark ? '✓ PASS' : '✗ FAIL');
    console.log('Header nav has white text:', headerIsWhite ? '✓ PASS' : '✗ FAIL');
    console.log('\nOverall:', (contentIsDark && headerIsWhite) ? '✓ Ready to deploy' : '✗ Needs more work');
})();
