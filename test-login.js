const puppeteer = require('puppeteer');
const path = require('path');
const { getCredentials } = require('./test-config');

(async () => {
    const { username, password } = getCredentials();
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('=== LOGGING IN ===');
    await page.goto('https://members.phibetasigma1914.org/iMISdev/', { waitUntil: 'networkidle2', timeout: 30000 });

    // Fill login form
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);

    // Click sign in
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');

    // Wait for either navigation or page change
    try {
        await page.waitForSelector('#ctl01_LoginStatus1', { timeout: 15000 });
    } catch (e) {
        // Try waiting for URL change
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log('After login URL:', page.url());
    await page.screenshot({ path: path.join(__dirname, 'testingScreenshots', 'login-result.png') });

    // Check if logged in by looking for a logout link or user-specific element
    const loginStatus = await page.evaluate(() => {
        const loginLink = document.querySelector('#ctl01_LoginStatus1');
        const userName = document.querySelector('[id*="UserName"]');
        return {
            loginLinkText: loginLink ? loginLink.textContent.trim() : 'not found',
            hasUserName: userName !== null,
            bodyText: document.body.innerText.substring(0, 500)
        };
    });

    console.log('Login status:', loginStatus.loginLinkText);

    // Now navigate to a page with Resource Library
    console.log('\n=== NAVIGATING TO MEMBER PAGE ===');
    await page.goto('https://members.phibetasigma1914.org/iMISdev/PBSMember/Home.aspx', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Member page URL:', page.url());
    await page.screenshot({ path: path.join(__dirname, 'testingScreenshots', 'member-home.png') });

    // Check nav menu
    const menuItems = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.RadMenu a'));
        return links.map(a => a.textContent.trim()).filter(t => t.length > 0);
    });

    console.log('Nav menu items:', menuItems);

    // Check Resource Library specifically
    const resourceLib = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.RadMenu a'));
        const rl = links.find(a => a.textContent.toLowerCase().includes('resource'));
        if (rl) {
            const style = getComputedStyle(rl);
            const text = rl.querySelector('.rmText');
            const textStyle = text ? getComputedStyle(text) : null;
            return {
                found: true,
                text: rl.textContent.trim(),
                linkColor: style.color,
                textColor: textStyle ? textStyle.color : 'n/a',
                bg: style.backgroundColor
            };
        }
        return { found: false };
    });

    console.log('\n=== RESOURCE LIBRARY CHECK ===');
    console.log(JSON.stringify(resourceLib, null, 2));

    if (resourceLib.found) {
        const isWhite = resourceLib.linkColor.includes('255, 255, 255');
        console.log('\nResource Library text is white:', isWhite ? 'YES (BAD)' : 'NO (GOOD)');
    }

    await browser.close();
})();
