const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TEST_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

// Font sizes to test (current is 11px)
const FONT_SIZES = [11, 12, 13, 14, 15];

(async () => {
    let baseCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    baseCss = baseCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: false });

    for (const fontSize of FONT_SIZES) {
        console.log(`\n=== Testing font size: ${fontSize}px ===`);

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });

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

        const screenshotPath = path.join(SCREENSHOT_DIR, `nav-font-${fontSize}px.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved: nav-font-${fontSize}px.png`);

        await page.close();
    }

    console.log('\n=== All screenshots saved ===');
    console.log('Compare:');
    FONT_SIZES.forEach(size => console.log(`  - nav-font-${size}px.png`));

    await browser.close();
})();
