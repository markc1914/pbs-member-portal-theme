const puppeteer = require('puppeteer');
const path = require('path');
const { getCredentials } = require('./test-config');

const RESOURCE_LIB_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc';
const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        // Step 1: Go to login page
        console.log('=== STEP 1: Loading login page ===');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '1-login-page.png') });

        // Step 2: Enter credentials
        console.log('=== STEP 2: Entering credentials ===');
        const { username, password } = getCredentials();
        const usernameSelector = '#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName';
        const passwordSelector = '#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword';
        const submitSelector = '#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton';

        await page.waitForSelector(usernameSelector, { timeout: 10000 });
        await page.type(usernameSelector, username);
        await page.type(passwordSelector, password);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '2-credentials-entered.png') });

        // Step 3: Submit and wait for response
        console.log('=== STEP 3: Submitting login ===');

        // Click submit and wait for navigation or network idle
        await Promise.all([
            page.click(submitSelector),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.log('Nav timeout, continuing...'))
        ]);

        // Extra wait for any redirects
        await new Promise(r => setTimeout(r, 3000));

        console.log('After login URL:', page.url());
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '3-after-login.png') });

        // Check if we're logged in
        const isLoggedIn = await page.evaluate(() => {
            const loginStatus = document.querySelector('#ctl01_LoginStatus1');
            if (loginStatus) {
                return loginStatus.textContent.toLowerCase().includes('sign out') ||
                       loginStatus.textContent.toLowerCase().includes('log out');
            }
            // Also check for user-specific content
            return document.body.innerText.includes('Craig') ||
                   document.body.innerText.includes('Welcome');
        });

        console.log('Login successful:', isLoggedIn);

        if (!isLoggedIn) {
            // Check for error message
            const errorMsg = await page.evaluate(() => {
                const error = document.querySelector('.validation-summary-errors, .error, [class*="error"]');
                return error ? error.textContent.trim() : 'No error message found';
            });
            console.log('Error:', errorMsg);

            // Still try to navigate
            console.log('Attempting to navigate anyway...');
        }

        // Step 4: Navigate to Resource Library
        console.log('\n=== STEP 4: Navigating to Resource Library ===');
        await page.goto(RESOURCE_LIB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        console.log('Resource Library URL:', page.url());
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '4-resource-library.png') });

        // Check if we got redirected to login again
        if (page.url().includes('Sign_In')) {
            console.log('\n❌ Still on login page - authentication failed');
            await browser.close();
            return;
        }

        // Step 5: Analyze the Resource Library menu
        console.log('\n=== STEP 5: Analyzing Resource Library menu ===');

        const analysis = await page.evaluate(() => {
            const results = {
                pageTitle: document.title,
                hasResourceLibMenu: false,
                menuItems: []
            };

            // Find all RadMenu elements
            const allMenus = document.querySelectorAll('.RadMenu');
            results.totalMenus = allMenus.length;

            // Look specifically at menus NOT in header
            allMenus.forEach((menu, idx) => {
                const inHeader = menu.closest('#hd') !== null;
                const links = menu.querySelectorAll('a.rmLink');

                links.forEach(link => {
                    const style = getComputedStyle(link);
                    const textEl = link.querySelector('.rmText');
                    const textStyle = textEl ? getComputedStyle(textEl) : null;

                    results.menuItems.push({
                        text: link.textContent.trim().substring(0, 40),
                        location: inHeader ? 'header' : 'content',
                        linkColor: style.color,
                        textColor: textStyle ? textStyle.color : style.color,
                        isReadable: !style.color.includes('255, 255, 255') || inHeader
                    });

                    if (!inHeader) {
                        results.hasResourceLibMenu = true;
                    }
                });
            });

            return results;
        });

        console.log('Page title:', analysis.pageTitle);
        console.log('Total menus found:', analysis.totalMenus);
        console.log('Has content area menu:', analysis.hasResourceLibMenu);

        console.log('\nMenu items:');
        analysis.menuItems.forEach(item => {
            const icon = item.isReadable ? '✓' : '✗';
            console.log(`  ${icon} [${item.location}] "${item.text}" - color: ${item.linkColor}`);
        });

        // Summary
        const contentItems = analysis.menuItems.filter(m => m.location === 'content');
        const allReadable = contentItems.every(m => m.isReadable);

        console.log('\n=== SUMMARY ===');
        if (contentItems.length === 0) {
            console.log('No content area menu items found to test');
        } else {
            console.log(`Content menu items: ${contentItems.length}`);
            console.log(`All readable: ${allReadable ? '✓ PASS' : '✗ FAIL'}`);
        }

    } catch (error) {
        console.error('Error:', error.message);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-state.png') });
    }

    await browser.close();
})();
