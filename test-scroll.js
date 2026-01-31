const puppeteer = require('puppeteer');

const BASE_URL = 'https://members.phibetasigma1914.org/iMISDEV';
const SCREENSHOTS_DIR = '/Users/markcornelius/projects/claude/pbs-member-portal-theme/automatedTestScreenshots';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--window-size=1920,1080'],
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    console.log('Navigating to login page...');
    await page.goto('https://members.phibetasigma1914.org/imisdev/pbsmember', { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(3000);

    // Login using exact iMIS selectors
    console.log('Logging in...');

    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'mcornelius');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'gomab95');
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');

    await wait(5000);
    console.log('Login complete, current URL:', page.url());

    // Navigate to Education page (has scrollable content)
    console.log('Going to Education page...');
    await page.goto(BASE_URL + '/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc', { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(2000);

    // Get Sign Out button position function
    const getSignOutInfo = async () => {
        return await page.evaluate(() => {
            const signOut = document.querySelector('a[id*="SignOut"]');
            if (signOut) {
                const rect = signOut.getBoundingClientRect();
                const styles = window.getComputedStyle(signOut);
                return {
                    viewportTop: rect.top,
                    position: styles.position,
                    text: signOut.textContent.trim()
                };
            }
            return null;
        });
    };

    console.log('\n=== BEFORE SCROLL ===');
    const before = await getSignOutInfo();
    console.log('Sign Out button:', JSON.stringify(before, null, 2));
    await page.screenshot({ path: SCREENSHOTS_DIR + '/scroll-test-1-top.png' });

    // Scroll down
    console.log('\nScrolling down 500px...');
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(1000);

    console.log('\n=== AFTER SCROLL 500px ===');
    const mid = await getSignOutInfo();
    console.log('Sign Out button:', JSON.stringify(mid, null, 2));
    await page.screenshot({ path: SCREENSHOTS_DIR + '/scroll-test-2-mid.png' });

    // Scroll more
    console.log('\nScrolling down another 500px...');
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(1000);

    console.log('\n=== AFTER SCROLL 1000px ===');
    const bottom = await getSignOutInfo();
    console.log('Sign Out button:', JSON.stringify(bottom, null, 2));
    await page.screenshot({ path: SCREENSHOTS_DIR + '/scroll-test-3-bottom.png' });

    // Analysis
    console.log('\n=== SCROLL ANALYSIS ===');
    if (before && mid && bottom) {
        console.log('Position CSS property: ' + before.position);
        if (before.viewportTop === mid.viewportTop && mid.viewportTop === bottom.viewportTop) {
            console.log('PROBLEM: Button stays at same viewport position (fixed behavior)');
        } else {
            console.log('GOOD: Button scrolls with page (not fixed)');
        }
        console.log('Viewport top positions: before=' + before.viewportTop + ', mid=' + mid.viewportTop + ', bottom=' + bottom.viewportTop);
    }

    // Check Resource Library menu
    console.log('\n=== RESOURCE LIBRARY MENU CHECK ===');
    const resourceMenuCheck = await page.evaluate(() => {
        // Find the Resource Library toolbar menu
        const organizeMenu = document.querySelector('.ObjectBrowserWrapper .RadMenu, .RAD_SPLITTER .RadMenu, #bd .RadMenu');
        if (!organizeMenu) return { found: false };

        // Check if any submenus are visible when they shouldn't be
        const submenus = organizeMenu.querySelectorAll('.rmSlide, .rmGroup:not(.rmRootGroup)');
        const visibleSubmenus = Array.from(submenus).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });

        return {
            found: true,
            totalSubmenus: submenus.length,
            visibleSubmenus: visibleSubmenus.length,
            problem: visibleSubmenus.length > 0
        };
    });
    console.log('Resource Library menu:', JSON.stringify(resourceMenuCheck, null, 2));
    if (resourceMenuCheck.problem) {
        console.log('PROBLEM: Submenus are visible without hover!');
    } else {
        console.log('GOOD: Submenus hidden until hovered');
    }

    // Test Sign Out
    console.log('\n=== SIGN OUT TEST ===');
    // Scroll back to top to see Sign Out button
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(1000);

    // Find and click Sign Out
    const signOutBtn = await page.$('a[id*="SignOut"]');
    if (signOutBtn) {
        console.log('Found Sign Out button by ID, clicking...');
        await signOutBtn.click();
    } else {
        // Try text-based search
        console.log('Searching for Sign Out link by text...');
        const clicked = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            for (const link of links) {
                if (link.textContent && link.textContent.toLowerCase().includes('sign out')) {
                    link.click();
                    return true;
                }
            }
            return false;
        });
        if (clicked) {
            console.log('Clicked Sign Out link');
        } else {
            console.log('Could not find Sign Out link');
        }
    }

    await wait(3000);

    // Check if we're logged out
    const currentUrl = page.url();
    console.log('After Sign Out, URL:', currentUrl);

    // Check for login form or sign in link (without :contains pseudo-selector)
    const pageState = await page.evaluate(() => {
        const signInBtn = document.querySelector('a[id*="SignIn"], input[id*="signIn"]');
        const loginForm = document.querySelector('input[type="password"]');
        const signOutBtn = document.querySelector('a[id*="SignOut"]');

        // Also check text content
        const allLinks = Array.from(document.querySelectorAll('a'));
        const hasSignIn = allLinks.some(a => a.textContent && a.textContent.toLowerCase().includes('sign in'));
        const hasSignOut = allLinks.some(a => a.textContent && a.textContent.toLowerCase().includes('sign out'));

        return {
            hasSignInElement: !!(signInBtn || loginForm || hasSignIn),
            hasSignOutElement: !!(signOutBtn || hasSignOut),
            hasPasswordField: !!loginForm
        };
    });
    console.log('Page state:', JSON.stringify(pageState, null, 2));

    if (pageState.hasSignInElement && !pageState.hasSignOutElement) {
        console.log('GOOD: Successfully logged out (Sign In visible, Sign Out gone)');
    } else if (pageState.hasSignOutElement) {
        console.log('WARNING: Sign Out still visible - may not have logged out');
    } else {
        console.log('Uncertain state');
    }

    await page.screenshot({ path: SCREENSHOTS_DIR + '/scroll-test-4-after-signout.png' });

    console.log('\nBrowser open for 5 seconds...');
    await wait(5000);

    await browser.close();
})();
