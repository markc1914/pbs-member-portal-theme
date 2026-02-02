const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = './automatedTestScreenshots';
const BASE_URL = 'https://members.phibetasigma1914.org/iMISDEV';

// Load local CSS to inject
const localCSS = fs.readFileSync(path.join(__dirname, 'package', 'pbs-theme.css'), 'utf8');

const username = process.argv[2];
const password = process.argv[3];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testSignInButton() {
    console.log('Testing SIGN IN button visibility on login page...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    try {
        // Go to login page
        console.log('1. Navigating to login page...');
        await page.goto(`${BASE_URL}/PBSMember/Sign_In.aspx`, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(2000);

        // Screenshot BEFORE CSS injection
        const beforeScreenshot = path.join(SCREENSHOTS_DIR, `signin-1-before-css-${Date.now()}.png`);
        await page.screenshot({ path: beforeScreenshot });
        console.log(`   Screenshot (before CSS): ${beforeScreenshot}`);

        // Debug: Find all potential Sign In buttons/links
        console.log('\n2. Inspecting DOM for Sign In elements...');
        const signInElements = await page.evaluate(() => {
            const results = [];

            // Find all links/buttons with Sign In or LoginStatus
            const selectors = [
                'a[id*="LoginStatus"]',
                'a[id*="SignIn"]',
                'a[href*="Sign_In"]',
                'a:contains("SIGN IN")',
                '[id*="LoginStatus"]',
                '.TextButton',
                '#hd a',
                '.auth-link',
                'a.TextButton'
            ];

            // Check all links in header
            const headerLinks = document.querySelectorAll('#hd a, .header-top-container a, [class*="header"] a');
            headerLinks.forEach(el => {
                const text = el.textContent.trim();
                if (text.toLowerCase().includes('sign') || el.id.toLowerCase().includes('login') || el.id.toLowerCase().includes('sign')) {
                    results.push({
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        href: el.href,
                        text: text,
                        parentId: el.parentElement?.id,
                        parentClass: el.parentElement?.className,
                        display: window.getComputedStyle(el).display,
                        visibility: window.getComputedStyle(el).visibility
                    });
                }
            });

            // Also find anything with SIGN IN text
            const allElements = document.querySelectorAll('a, button, input[type="submit"]');
            allElements.forEach(el => {
                const text = el.textContent?.trim() || el.value?.trim() || '';
                if (text.toUpperCase() === 'SIGN IN' && !results.find(r => r.id === el.id)) {
                    results.push({
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        href: el.href || '',
                        text: text,
                        parentId: el.parentElement?.id,
                        parentClass: el.parentElement?.className,
                        display: window.getComputedStyle(el).display,
                        visibility: window.getComputedStyle(el).visibility
                    });
                }
            });

            return results;
        });

        console.log('\n   Found Sign In related elements:');
        signInElements.forEach((el, i) => {
            console.log(`\n   [${i + 1}] ${el.tag} - "${el.text}"`);
            console.log(`       id: ${el.id}`);
            console.log(`       class: ${el.className}`);
            console.log(`       href: ${el.href}`);
            console.log(`       parent id: ${el.parentId}`);
            console.log(`       parent class: ${el.parentClass}`);
            console.log(`       display: ${el.display}, visibility: ${el.visibility}`);
        });

        // Check for :has() selector support
        console.log('\n3. Checking :has() selector support...');
        const hasSupport = await page.evaluate(() => {
            try {
                document.querySelector(':has(*)');
                return true;
            } catch (e) {
                return false;
            }
        });
        console.log(`   :has() selector supported: ${hasSupport}`);

        // Check if sign-in form identifiers exist
        console.log('\n4. Checking for login page identifiers...');
        const loginIdentifiers = await page.evaluate(() => {
            return {
                ciNewContactSignInCommon: !!document.querySelector('[id*="ciNewContactSignInCommon"]'),
                signInDiv: !!document.querySelector('[id*="signInDiv"]'),
                signInPanel: !!document.querySelector('[id*="SignInPanel"]'),
                signInUserName: !!document.querySelector('[id*="signInUserName"]'),
                allSignInIds: [...document.querySelectorAll('[id*="signIn"], [id*="SignIn"]')].map(el => el.id).slice(0, 10)
            };
        });
        console.log(`   ciNewContactSignInCommon: ${loginIdentifiers.ciNewContactSignInCommon}`);
        console.log(`   signInDiv: ${loginIdentifiers.signInDiv}`);
        console.log(`   signInPanel: ${loginIdentifiers.signInPanel}`);
        console.log(`   signInUserName: ${loginIdentifiers.signInUserName}`);
        console.log(`   Sample IDs: ${loginIdentifiers.allSignInIds.join(', ')}`);

        // Inject local CSS
        console.log('\n5. Injecting local CSS...');
        await page.addStyleTag({ content: localCSS });
        await wait(1000);

        // Screenshot AFTER CSS injection
        const afterScreenshot = path.join(SCREENSHOTS_DIR, `signin-2-after-css-${Date.now()}.png`);
        await page.screenshot({ path: afterScreenshot });
        console.log(`   Screenshot (after CSS): ${afterScreenshot}`);

        // Check if Sign In button is now hidden
        console.log('\n6. Checking Sign In button visibility after CSS...');
        const afterCSSCheck = await page.evaluate(() => {
            const results = [];
            const headerLinks = document.querySelectorAll('#hd a, .header-top-container a');
            headerLinks.forEach(el => {
                const text = el.textContent.trim();
                if (text.toUpperCase().includes('SIGN')) {
                    const style = window.getComputedStyle(el);
                    results.push({
                        text: text,
                        id: el.id,
                        display: style.display,
                        visibility: style.visibility,
                        width: style.width,
                        height: style.height,
                        isHidden: style.display === 'none' || style.visibility === 'hidden'
                    });
                }
            });
            return results;
        });

        afterCSSCheck.forEach(el => {
            const status = el.isHidden ? '✅ HIDDEN' : '❌ VISIBLE';
            console.log(`   ${status}: "${el.text}" (id=${el.id}, display=${el.display}, visibility=${el.visibility})`);
        });

        // Now login and check SIGN OUT is visible
        if (username && password) {
            console.log('\n7. Logging in to verify SIGN OUT remains visible...');
            await page.type('input[id*="UserName"]', username);
            await page.type('input[id*="Password"]', password);
            await page.click('input[type="submit"], button[type="submit"], input[id*="LoginButton"]');
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
            await wait(2000);

            // Screenshot authenticated page
            const authScreenshot = path.join(SCREENSHOTS_DIR, `signin-3-authenticated-${Date.now()}.png`);
            await page.screenshot({ path: authScreenshot });
            console.log(`   Screenshot (authenticated): ${authScreenshot}`);

            // Check SIGN OUT is visible
            console.log('\n8. Checking SIGN OUT button visibility...');
            const signOutCheck = await page.evaluate(() => {
                const results = [];
                const allLinks = document.querySelectorAll('a');
                allLinks.forEach(el => {
                    const text = el.textContent.trim();
                    if (text.toUpperCase().includes('SIGN OUT') || text.toUpperCase().includes('LOGOUT') || el.id.toLowerCase().includes('logout') || el.id.toLowerCase().includes('signout')) {
                        const style = window.getComputedStyle(el);
                        results.push({
                            text: text,
                            id: el.id,
                            display: style.display,
                            visibility: style.visibility,
                            isVisible: style.display !== 'none' && style.visibility !== 'hidden'
                        });
                    }
                });
                return results;
            });

            signOutCheck.forEach(el => {
                const status = el.isVisible ? '✅ VISIBLE' : '❌ HIDDEN';
                console.log(`   ${status}: "${el.text}" (id=${el.id}, display=${el.display})`);
            });
        }

        console.log('\n✓ Test complete! Check automatedTestScreenshots/ for results.');
        console.log('Browser left open for inspection.');

    } catch (error) {
        console.error('Error:', error.message);
        const errorScreenshot = path.join(SCREENSHOTS_DIR, `signin-error-${Date.now()}.png`);
        await page.screenshot({ path: errorScreenshot });
    }
}

testSignInButton();
