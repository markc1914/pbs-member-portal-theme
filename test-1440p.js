const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOTS_DIR = './automatedTestScreenshots';
const BASE_URL = 'https://members.phibetasigma1914.org/iMISDEV';

const username = process.argv[2];
const password = process.argv[3];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function test1440p() {
    if (!username || !password) {
        console.log('Usage: node test-1440p.js <username> <password>');
        process.exit(1);
    }

    console.log('Testing at 1440p (2560x1440) resolution...');
    console.log('This tests the banner image visibility on wide monitors.\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 2560, height: 1440 }
    });

    const page = await browser.newPage();

    // Handle dialogs
    page.on('dialog', async dialog => {
        await dialog.accept();
    });

    try {
        // Login
        console.log('1. Navigating to login page...');
        await page.goto(`${BASE_URL}/PBSMember/Sign_In.aspx`, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(1000);

        // Screenshot login page at 1440p
        const loginScreenshot = path.join(SCREENSHOTS_DIR, `1440p-login-${Date.now()}.png`);
        await page.screenshot({ path: loginScreenshot });
        console.log(`   Screenshot: ${loginScreenshot}`);

        console.log('2. Logging in...');
        await page.type('input[id*="UserName"]', username);
        await page.type('input[id*="Password"]', password);
        await page.click('input[type="submit"], button[type="submit"], input[id*="LoginButton"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
        await wait(2000);

        // Screenshot home page at 1440p - this should show the banner issue
        console.log('3. Capturing home page at 1440p...');
        const homeScreenshot = path.join(SCREENSHOTS_DIR, `1440p-home-banner-${Date.now()}.png`);
        await page.screenshot({ path: homeScreenshot });
        console.log(`   Screenshot: ${homeScreenshot}`);
        console.log('   ^ Check this screenshot for "Membership Database" text being cut off');

        // Also capture just the header area
        console.log('4. Capturing header close-up...');
        const headerElement = await page.$('#hd, header, #masterHeaderBackground');
        if (headerElement) {
            const headerScreenshot = path.join(SCREENSHOTS_DIR, `1440p-header-closeup-${Date.now()}.png`);
            await headerElement.screenshot({ path: headerScreenshot });
            console.log(`   Screenshot: ${headerScreenshot}`);
        }

        // Navigate to another page to confirm issue persists
        console.log('5. Testing on profile page...');
        await page.goto(`${BASE_URL}/PBSMember/My_Account_2/PBSMember/AccountPage.aspx`, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(1000);
        const profileScreenshot = path.join(SCREENSHOTS_DIR, `1440p-profile-${Date.now()}.png`);
        await page.screenshot({ path: profileScreenshot });
        console.log(`   Screenshot: ${profileScreenshot}`);

        console.log('\n✓ Test complete! Check automatedTestScreenshots/ for 1440p screenshots.');
        console.log('Look for the banner image - "Membership Database" text should be visible.');

    } catch (error) {
        console.error('Error:', error.message);
        const errorScreenshot = path.join(SCREENSHOTS_DIR, `1440p-error-${Date.now()}.png`);
        await page.screenshot({ path: errorScreenshot });
        console.log(`Error screenshot: ${errorScreenshot}`);
    }

    // Keep browser open for inspection
    console.log('\nBrowser left open for manual inspection. Close when done.');
}

test1440p();
