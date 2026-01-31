const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOTS_DIR = '/Users/markcornelius/Screenshots';
const BASE_URL = 'https://members.phibetasigma1914.org/iMISDEV';

// Correct page URLs
const PAGES = {
    login: 'https://members.phibetasigma1914.org/imisdev/pbsmember',
    profile: `${BASE_URL}/PBSMember/My_Account_2/PBSMember/AccountPage.aspx?hkey=53f0d6d1-e7a3-4f97-87b5-d6d0a6a282f0`,
    education: `${BASE_URL}/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc`,
    directory: `${BASE_URL}/PBSMember/Membership/Directory/PBSMember/Directory.aspx?hkey=dedd1298-4a4a-4e0a-a0a8-e4bcc640c2cc`,
    community: `${BASE_URL}/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=d2a740ce-8b73-4a54-97a5-990ac2cce029&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140`
};

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

    // Handle JavaScript dialogs (alerts, confirms, prompts)
    page.on('dialog', async dialog => {
        console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`);
        await dialog.accept();
    });

    try {
        // Test 1: Login page
        console.log('\n=== Testing Login Page ===');
        await page.goto(PAGES.login, { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(2000);
        await takeScreenshot(page, '01-login');

        if (username && password) {
            console.log('\n=== Logging in ===');

            // Fill username using the exact field name from iMIS
            // Username: ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName
            await page.evaluate((user, pass) => {
                // Find username field by partial ID match
                const usernameField = document.querySelector('input[id*="signInUserName"]') ||
                                      document.querySelector('input[name*="signInUserName"]') ||
                                      document.querySelector('input[id*="Username"]');

                // Find password field
                const passwordField = document.querySelector('input[id*="signInPassword"]') ||
                                      document.querySelector('input[name*="signInPassword"]') ||
                                      document.querySelector('input[type="password"]');

                if (usernameField) {
                    usernameField.value = user;
                    console.log('Username field found and filled');
                }
                if (passwordField) {
                    passwordField.value = pass;
                    console.log('Password field found and filled');
                }
            }, username, password);

            await wait(500);
            await takeScreenshot(page, '01b-login-filled');

            // Click submit
            await page.evaluate(() => {
                const btn = document.querySelector('input[type="submit"]') ||
                            document.querySelector('input[value*="SIGN"]') ||
                            document.querySelector('button[type="submit"]');
                if (btn) btn.click();
            });

            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
            await wait(3000);

            // Test 2: After login (Member Home)
            console.log('\n=== Testing Member Home ===');
            await takeScreenshot(page, '02-home');

            // Test 3: Profile page
            console.log('\n=== Testing Profile Page ===');
            await page.goto(PAGES.profile, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(2000);
            await takeScreenshot(page, '03-profile');

            // Test 4: Education Material
            console.log('\n=== Testing Education Material ===');
            await page.goto(PAGES.education, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(2000);
            await takeScreenshot(page, '04-education');

            // Test 5: Directory
            console.log('\n=== Testing Directory ===');
            await page.goto(PAGES.directory, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(2000);
            await takeScreenshot(page, '05-directory');

            // Test 6: Community
            console.log('\n=== Testing Community ===');
            await page.goto(PAGES.community, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(2000);
            await takeScreenshot(page, '06-community');

            // Test 7: Dropdown menu
            console.log('\n=== Testing Dropdown ===');
            const menuItems = await page.$$('.rmRootLink');
            if (menuItems.length > 3) {
                await menuItems[3].hover();
                await wait(1500);
                await takeScreenshot(page, '07-dropdown');
            }
        } else {
            console.log('Usage: node test-css.js <username> <password>');
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
