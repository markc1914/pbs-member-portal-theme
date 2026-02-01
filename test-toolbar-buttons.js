const puppeteer = require('puppeteer');
const path = require('path');

const RESOURCE_LIB_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc';
const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

(async () => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1280, height: 900 } });
    const page = await browser.newPage();

    // Login as staff
    console.log('=== LOGGING IN AS STAFF ===');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'REDACTED_USER');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'REDACTED_PASSWORD');
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await new Promise(r => setTimeout(r, 5000));

    // Go to Resource Library
    console.log('=== NAVIGATING TO RESOURCE LIBRARY ===');
    await page.goto(RESOURCE_LIB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Analyze toolbar buttons
    console.log('=== ANALYZING TOOLBAR BUTTONS ===');
    const toolbarAnalysis = await page.evaluate(() => {
        const results = [];

        // Look for toolbar area - typically contains Organize, New, Edit, Versions
        const toolbar = document.querySelector('.DocLibToolbar, .Toolbar, [class*="toolbar"], [class*="Toolbar"]');

        // Find all links/buttons that might be the toolbar items
        const possibleButtons = document.querySelectorAll('a, button, span, div');

        possibleButtons.forEach(el => {
            const text = el.textContent.trim();
            if (['Organize', 'New', 'Edit', 'Versions'].includes(text)) {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();

                results.push({
                    text: text,
                    tag: el.tagName,
                    id: el.id,
                    className: el.className,
                    display: style.display,
                    visibility: style.visibility,
                    pointerEvents: style.pointerEvents,
                    opacity: style.opacity,
                    zIndex: style.zIndex,
                    position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
                    isClickable: rect.width > 0 && rect.height > 0 && style.pointerEvents !== 'none' && style.visibility !== 'hidden'
                });
            }
        });

        return results;
    });

    console.log('\nToolbar button analysis:');
    toolbarAnalysis.forEach(btn => {
        console.log(`\n${btn.text}:`);
        console.log(`  Tag: ${btn.tag}, Class: ${btn.className}`);
        console.log(`  Display: ${btn.display}, Visibility: ${btn.visibility}`);
        console.log(`  Pointer-events: ${btn.pointerEvents}, Opacity: ${btn.opacity}`);
        console.log(`  Position: ${JSON.stringify(btn.position)}`);
        console.log(`  Clickable: ${btn.isClickable ? 'YES' : 'NO'}`);
    });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'toolbar-analysis.png'), fullPage: false });
    console.log('\nScreenshot saved: toolbar-analysis.png');

    // Keep browser open to inspect
    console.log('\nBrowser staying open for 15 seconds...');
    await new Promise(r => setTimeout(r, 15000));

    await browser.close();
})();
