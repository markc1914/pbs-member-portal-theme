const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOTS_DIR = './automatedTestScreenshots';
const BASE_URL = 'https://members.phibetasigma1914.org/iMISDEV';

// Correct page URLs
const PAGES = {
    login: 'https://members.phibetasigma1914.org/imisdev/pbsmember',
    profile: `${BASE_URL}/PBSMember/My_Account_2/PBSMember/AccountPage.aspx?hkey=53f0d6d1-e7a3-4f97-87b5-d6d0a6a282f0`,
    education: `${BASE_URL}/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc`,
    directory: `${BASE_URL}/PBSMember/Membership/Directory/PBSMember/Directory.aspx?hkey=dedd1298-4a4a-4e0a-a0a8-e4bcc640c2cc`,
    community: `${BASE_URL}/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=d2a740ce-8b73-4a54-97a5-990ac2cce029&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140`
};

// Viewport sizes for testing
const VIEWPORTS = {
    desktop: { width: 1400, height: 900, name: 'desktop' },
    tablet: { width: 768, height: 1024, name: 'tablet' },
    mobile: { width: 375, height: 812, name: 'mobile' }
};

const username = process.argv[2];
const password = process.argv[3];
const testMobile = process.argv.includes('--mobile');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function takeScreenshot(page, name, viewport = 'desktop') {
    const filepath = path.join(SCREENSHOTS_DIR, `test-${viewport}-${name}-${Date.now()}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`  Screenshot: ${filepath}`);
    return filepath;
}

async function testAtViewport(page, viewportName, viewportConfig, isLoggedIn) {
    console.log(`\n========== Testing at ${viewportName.toUpperCase()} (${viewportConfig.width}x${viewportConfig.height}) ==========`);

    await page.setViewport(viewportConfig);
    await wait(1000);

    if (!isLoggedIn) {
        // Test login page
        console.log(`\n[${viewportName}] Login Page`);
        await page.goto(PAGES.login, { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(2000);
        await takeScreenshot(page, '01-login', viewportName);
    } else {
        // Test logged-in pages
        console.log(`\n[${viewportName}] Member Home`);
        await page.goto(`${BASE_URL}/PBSMember/Home.aspx`, { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(2000);
        await takeScreenshot(page, '02-home', viewportName);

        console.log(`\n[${viewportName}] Education Material`);
        await page.goto(PAGES.education, { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(2000);
        await takeScreenshot(page, '03-education', viewportName);

        console.log(`\n[${viewportName}] Community`);
        await page.goto(PAGES.community, { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(2000);
        await takeScreenshot(page, '04-community', viewportName);
    }
}

async function testPages() {
    console.log('Launching Chrome...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: VIEWPORTS.desktop
    });

    const page = await browser.newPage();

    // Handle JavaScript dialogs
    page.on('dialog', async dialog => {
        console.log(`  Dialog: ${dialog.type()} - "${dialog.message().substring(0, 50)}..."`);
        await dialog.accept();
    });

    try {
        // DESKTOP TESTING
        console.log('\n' + '='.repeat(60));
        console.log('DESKTOP TESTING');
        console.log('='.repeat(60));

        // Test login page at desktop
        console.log('\n=== Testing Login Page (Desktop) ===');
        await page.goto(PAGES.login, { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(2000);
        await takeScreenshot(page, '01-login', 'desktop');

        if (username && password) {
            console.log('\n=== Logging in ===');
            await page.evaluate((user, pass) => {
                const usernameField = document.querySelector('input[id*="signInUserName"]') ||
                                      document.querySelector('input[name*="signInUserName"]');
                const passwordField = document.querySelector('input[id*="signInPassword"]') ||
                                      document.querySelector('input[type="password"]');
                if (usernameField) usernameField.value = user;
                if (passwordField) passwordField.value = pass;
            }, username, password);

            await wait(500);
            await page.evaluate(() => {
                const btn = document.querySelector('input[type="submit"]') ||
                            document.querySelector('input[value*="SIGN"]');
                if (btn) btn.click();
            });

            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
            await wait(3000);

            // Desktop pages after login
            console.log('\n=== Testing Member Home (Desktop) ===');
            await takeScreenshot(page, '02-home', 'desktop');

            console.log('\n=== Testing Profile (Desktop) ===');
            await page.goto(PAGES.profile, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(2000);
            await takeScreenshot(page, '03-profile', 'desktop');

            console.log('\n=== Testing Education Material (Desktop) ===');
            await page.goto(PAGES.education, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(2000);
            await takeScreenshot(page, '04-education', 'desktop');

            console.log('\n=== Testing Directory (Desktop) ===');
            await page.goto(PAGES.directory, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(2000);
            await takeScreenshot(page, '05-directory', 'desktop');

            console.log('\n=== Testing Community (Desktop) ===');
            await page.goto(PAGES.community, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(2000);
            await takeScreenshot(page, '06-community', 'desktop');

            // MOBILE TESTING
            if (testMobile) {
                console.log('\n' + '='.repeat(60));
                console.log('MOBILE TESTING (375px)');
                console.log('='.repeat(60));

                await page.setViewport(VIEWPORTS.mobile);
                await wait(1000);

                console.log('\n=== Testing Member Home (Mobile) ===');
                await page.goto(`${BASE_URL}/PBSMember/Home.aspx`, { waitUntil: 'networkidle2', timeout: 30000 });
                await wait(2000);
                await takeScreenshot(page, '02-home', 'mobile');

                console.log('\n=== Testing Education Material (Mobile) ===');
                await page.goto(PAGES.education, { waitUntil: 'networkidle2', timeout: 30000 });
                await wait(2000);
                await takeScreenshot(page, '04-education', 'mobile');

                console.log('\n=== Testing Community (Mobile) ===');
                await page.goto(PAGES.community, { waitUntil: 'networkidle2', timeout: 30000 });
                await wait(2000);
                await takeScreenshot(page, '06-community', 'mobile');

                // TABLET TESTING
                console.log('\n' + '='.repeat(60));
                console.log('TABLET TESTING (768px)');
                console.log('='.repeat(60));

                await page.setViewport(VIEWPORTS.tablet);
                await wait(1000);

                console.log('\n=== Testing Member Home (Tablet) ===');
                await page.goto(`${BASE_URL}/PBSMember/Home.aspx`, { waitUntil: 'networkidle2', timeout: 30000 });
                await wait(2000);
                await takeScreenshot(page, '02-home', 'tablet');

                console.log('\n=== Testing Education Material (Tablet) ===');
                await page.goto(PAGES.education, { waitUntil: 'networkidle2', timeout: 30000 });
                await wait(2000);
                await takeScreenshot(page, '04-education', 'tablet');
            }
        } else {
            console.log('Usage: node test-css.js <username> <password> [--mobile]');
        }

        console.log('\n' + '='.repeat(60));
        console.log('TESTING COMPLETE');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Error:', error.message);
        await takeScreenshot(page, 'error', 'desktop');
    }

    console.log('\nBrowser open for 15 seconds...');
    await wait(15000);
    await browser.close();
}

testPages();
