const puppeteer = require('puppeteer');

const BASE_URL = 'https://members.phibetasigma1914.org/iMISDEV';
const SCREENSHOTS_DIR = '/Users/markcornelius/projects/claude/pbs-member-portal-theme/automatedTestScreenshots';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--window-size=375,812'],
        defaultViewport: { width: 375, height: 812, isMobile: true },
        protocolTimeout: 120000
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');

    console.log('=== MOBILE TEST ===\n');

    // Login page
    console.log('1. Login page...');
    await page.goto('https://members.phibetasigma1914.org/imisdev/pbsmember', { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(2000);
    await page.screenshot({ path: SCREENSHOTS_DIR + '/mobile-test-1-login.png' });

    // Login
    console.log('2. Logging in...');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'mcornelius');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'gomab95');
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await wait(5000);

    // Home page
    console.log('3. Home page (logged in)...');
    await page.screenshot({ path: SCREENSHOTS_DIR + '/mobile-test-2-home.png' });

    // Check Sign Out visibility
    const signOutCheck = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const signOutLink = links.find(a => a.textContent && a.textContent.toLowerCase().includes('sign out'));
        if (signOutLink) {
            const rect = signOutLink.getBoundingClientRect();
            const style = window.getComputedStyle(signOutLink);
            return {
                found: true,
                visible: rect.width > 0 && rect.height > 0,
                text: signOutLink.textContent.trim(),
                display: style.display,
                visibility: style.visibility
            };
        }
        return { found: false };
    });
    console.log('Sign Out check:', JSON.stringify(signOutCheck, null, 2));

    // Education/Resource Library page
    console.log('4. Education page...');
    await page.goto(BASE_URL + '/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc', { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(2000);
    await page.screenshot({ path: SCREENSHOTS_DIR + '/mobile-test-3-education.png' });

    // Scroll test
    console.log('5. Scroll test...');
    await page.evaluate(() => window.scrollBy(0, 300));
    await wait(1000);
    await page.screenshot({ path: SCREENSHOTS_DIR + '/mobile-test-4-scrolled.png' });

    // Check if Sign Out is still at same position (fixed) or scrolled
    const afterScrollCheck = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const signOutLink = links.find(a => a.textContent && a.textContent.toLowerCase().includes('sign out'));
        if (signOutLink) {
            const rect = signOutLink.getBoundingClientRect();
            return {
                found: true,
                viewportTop: rect.top,
                inViewport: rect.top >= 0 && rect.top < window.innerHeight
            };
        }
        return { found: false };
    });
    console.log('After scroll:', JSON.stringify(afterScrollCheck, null, 2));

    if (afterScrollCheck.found && afterScrollCheck.inViewport) {
        console.log('WARNING: Sign Out still visible after scroll (may be fixed position)');
    } else {
        console.log('GOOD: Sign Out scrolled out of view');
    }

    console.log('\nBrowser open for 10 seconds...');
    await wait(10000);

    await browser.close();
})();
