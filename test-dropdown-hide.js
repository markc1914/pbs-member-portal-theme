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
    console.log('=== GOING TO RESOURCE LIBRARY ===');
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

    // Check dropdown visibility
    console.log('=== CHECKING DROPDOWN VISIBILITY ===');
    const results = await page.evaluate(() => {
        const checks = [];

        // Find toolbar menu items
        const allItems = document.querySelectorAll('.RadMenu .rmItem');

        allItems.forEach(item => {
            const link = item.querySelector('a.rmLink');
            if (!link) return;

            const text = link.textContent.trim();
            if (!['Organize', 'New', 'Edit', 'Versions'].includes(text)) return;

            // Find dropdown
            const dropdown = item.querySelector('.rmSlide') || item.querySelector('.rmGroup:not(.rmRootGroup)');

            if (dropdown) {
                const style = getComputedStyle(dropdown);
                checks.push({
                    button: text,
                    display: style.display,
                    visibility: style.visibility,
                    isHidden: style.display === 'none' || style.visibility === 'hidden'
                });
            } else {
                checks.push({ button: text, noDropdown: true });
            }
        });

        return checks;
    });

    console.log('\nDropdown status (should be HIDDEN by default):');
    results.forEach(r => {
        if (r.noDropdown) {
            console.log(`  ${r.button}: No dropdown (OK for Edit/Versions)`);
        } else {
            const status = r.isHidden ? '✓ HIDDEN (correct)' : '✗ VISIBLE (bug!)';
            console.log(`  ${r.button}: ${status} (display: ${r.display}, visibility: ${r.visibility})`);
        }
    });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'local-css-dropdown-test.png') });
    console.log('\nScreenshot saved: local-css-dropdown-test.png');

    // Test hover behavior
    console.log('\n=== TESTING HOVER BEHAVIOR ===');
    const organizeLink = await page.$('.RadMenu a.rmLink');
    if (organizeLink) {
        await organizeLink.hover();
        await new Promise(r => setTimeout(r, 500));

        const afterHover = await page.evaluate(() => {
            const item = document.querySelector('.RadMenu .rmItem');
            const dropdown = item ? item.querySelector('.rmSlide, .rmGroup:not(.rmRootGroup)') : null;
            if (dropdown) {
                const style = getComputedStyle(dropdown);
                return { display: style.display, visibility: style.visibility };
            }
            return null;
        });

        if (afterHover) {
            const visible = afterHover.display !== 'none' && afterHover.visibility !== 'hidden';
            console.log(`After hover: ${visible ? '✓ VISIBLE (correct)' : '✗ STILL HIDDEN (bug!)'}`);
        }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'local-css-hover-test.png') });
    console.log('Screenshot saved: local-css-hover-test.png');

    console.log('\nBrowser staying open for 10 seconds...');
    await new Promise(r => setTimeout(r, 10000));

    await browser.close();
})();
