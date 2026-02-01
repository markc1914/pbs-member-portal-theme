const puppeteer = require('puppeteer');
const path = require('path');

const RESOURCE_LIB_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc';
const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

// Staff user credentials
const USERNAME = 'mcornelius';
const PASSWORD = 'gomab95';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('=== LOGIN WITH STAFF ACCOUNT ===');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Enter credentials
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', USERNAME);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', PASSWORD);

    // Submit
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');

    // Wait for page to settle
    await new Promise(r => setTimeout(r, 5000));
    console.log('After login:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'staff-login-result.png') });

    // Try to go to Resource Library
    console.log('\n=== NAVIGATING TO RESOURCE LIBRARY ===');
    try {
        await page.goto(RESOURCE_LIB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
        console.log('Navigation issue:', e.message);
        await new Promise(r => setTimeout(r, 3000));
    }

    console.log('Final URL:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'resource-library-final.png') });

    // Check if on login page
    if (page.url().includes('Sign_In')) {
        console.log('❌ Redirected to login - auth failed');
    } else {
        console.log('✓ On Resource Library page');

        // Analyze menu colors
        const menuAnalysis = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('.RadMenu a.rmLink').forEach(link => {
                const inHeader = link.closest('#hd') !== null;
                const style = getComputedStyle(link);
                items.push({
                    text: link.textContent.trim().substring(0, 30),
                    location: inHeader ? 'HEADER' : 'CONTENT',
                    color: style.color
                });
            });
            return items;
        });

        console.log('\nMenu items found:');
        menuAnalysis.forEach(item => {
            const isWhite = item.color.includes('255, 255, 255');
            const status = (item.location === 'HEADER' && isWhite) || (item.location === 'CONTENT' && !isWhite) ? '✓' : '✗';
            console.log(`  ${status} [${item.location}] "${item.text}" - ${item.color}`);
        });

        // Check content area specifically
        const contentItems = menuAnalysis.filter(m => m.location === 'CONTENT');
        if (contentItems.length > 0) {
            const allDark = contentItems.every(m => !m.color.includes('255, 255, 255'));
            console.log('\n=== RESULT ===');
            console.log('Content menu items:', contentItems.length);
            console.log('All have dark text:', allDark ? '✓ PASS - Fix working!' : '✗ FAIL - Still white text');
        }
    }

    await browser.close();
})();
