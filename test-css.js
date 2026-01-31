const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOTS_DIR = '/Users/markcornelius/Screenshots';
const BASE_URL = 'https://members.phibetasigma1914.org/imisdev';
const LOGIN_URL = 'https://members.phibetasigma1914.org/imisdev/pbsmember';
const COMMUNITY_URL = 'https://members.phibetasigma1914.org/imisdev/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=d2a740ce-8b73-4a54-97a5-990ac2cce029&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140';

const username = process.argv[2];
const password = process.argv[3];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function takeScreenshot(page, name) {
    const filepath = path.join(SCREENSHOTS_DIR, `test-${name}-${Date.now()}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`Screenshot: ${filepath}`);
    return filepath;
}

async function testPages() {
    console.log('Launching Chrome...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    try {
        // Test 1: Login page
        console.log('\n=== Testing Login Page ===');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(2000);
        await takeScreenshot(page, '01-login');

        if (username && password) {
            console.log('\n=== Logging in ===');
            await page.evaluate((user, pass) => {
                const userInput = document.querySelector('input[id*="Username"], input[name*="Username"]');
                const passInput = document.querySelector('input[type="password"]');
                if (userInput) userInput.value = user;
                if (passInput) passInput.value = pass;
            }, username, password);
            await wait(500);
            await page.evaluate(() => {
                const btn = document.querySelector('input[type="submit"], input[value*="SIGN"]');
                if (btn) btn.click();
            });
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
            await wait(3000);

            console.log('\n=== Testing Member Home ===');
            await takeScreenshot(page, '02-home');

            console.log('\n=== Testing Education Material ===');
            await page.goto(`${BASE_URL}/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc`, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(3000);
            await takeScreenshot(page, '03-education');

            console.log('\n=== Testing Community Page ===');
            await page.goto(COMMUNITY_URL, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(3000);
            await takeScreenshot(page, '04-community');

            console.log('\n=== Testing Dropdown ===');
            // Go back to home and hover on menu
            await page.goto(`${BASE_URL}/PBSMember/Home.aspx`, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(2000);
            const menuItems = await page.$$('.rmRootLink');
            if (menuItems.length > 5) {
                await menuItems[5].hover();
                await wait(1500);
                await takeScreenshot(page, '05-dropdown');
            }
        }

        console.log('\n=== Done ===');
    } catch (error) {
        console.error('Error:', error.message);
        await takeScreenshot(page, 'error');
    }

    console.log('\nBrowser open for 15 seconds...');
    await wait(15000);
    await browser.close();
}

testPages();
