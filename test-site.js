/**
 * PBS Theme CSS Tester
 *
 * This script logs into the iMIS dev site and captures screenshots
 * to verify CSS changes without manual testing.
 *
 * Usage:
 *   1. Install puppeteer: npm install puppeteer
 *   2. Run: node test-site.js <username> <password>
 *
 * Screenshots are saved to testingScreenshots/ folder
 */

const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
    const filepath = path.join(SCREENSHOT_DIR, `auto-${name}-${Date.now()}.png`);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`Screenshot saved: ${filepath}`);
}

async function main() {
    const [,, username, password] = process.argv;

    if (!username || !password) {
        console.log('Usage: node test-site.js <username> <password>');
        process.exit(1);
    }

    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: true,  // Headless mode for automation
        defaultViewport: { width: 1200, height: 900 }
    });

    const page = await browser.newPage();

    try {
        // Go to login page
        console.log('Navigating to login page...');
        await page.goto(BASE_URL + 'PBSMember/Sign_In.aspx', { waitUntil: 'networkidle2' });
        await delay(1000);
        await takeScreenshot(page, '1-login-page');

        // Login
        console.log('Logging in...');
        await page.type('input[id*="UserName"]', username);
        await page.type('input[id*="Password"]', password);
        await page.click('input[type="submit"], button[type="submit"], input[id*="LoginButton"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await delay(2000);
        await takeScreenshot(page, '2-after-login');

        // Test nav menu by hovering
        console.log('Testing nav menu...');
        // Use XPath to find menu items by text content
        const menuItems = await page.$$('a.rmLink.rmRootLink');
        for (const item of menuItems) {
            const text = await item.evaluate(el => el.textContent);
            if (text && text.includes('STAFF')) {
                await item.hover();
                await delay(800);
                await takeScreenshot(page, '3-nav-dropdown-staff');
                break;
            }
        }

        // Navigate to a community page
        console.log('Navigating to community page...');
        // Find and click on a community link in the nav
        const communityLink = await page.$('a[href*="Community"]');
        if (communityLink) {
            await communityLink.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            await delay(1000);
            await takeScreenshot(page, '4-community-page');
        } else {
            console.log('No community link found, skipping...');
        }

        // Go to member home
        console.log('Going to member home...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        await delay(1000);
        await takeScreenshot(page, '5-member-home');

        // Save HTML for offline analysis
        const html = await page.content();
        const fs = require('fs');
        fs.writeFileSync(path.join(SCREENSHOT_DIR, 'captured-page.html'), html);
        console.log('HTML saved to captured-page.html');

        console.log('\nDone! Check testingScreenshots/ for results.');

    } catch (error) {
        console.error('Error:', error.message);
        await takeScreenshot(page, 'error');
    }

    // Keep browser open for manual inspection
    console.log('\nBrowser left open for inspection. Close manually when done.');
}

main();
