/**
 * Cross-browser dialog testing with Playwright
 * Tests Chrome, Safari (WebKit), and Firefox
 *
 * Usage: node test-dialog-cross-browser.js <username> <password> [browser]
 *   browser: chromium, webkit, firefox, or all (default: all)
 */

const { chromium, webkit, firefox } = require('playwright');
const path = require('path');
const fs = require('fs');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const ACCOUNT_URL = 'https://members.phibetasigma1914.org/iMISdev/iCore/Contacts/MyAccount_DefaultPage.aspx';
const COMMUNITY_URL = 'https://members.phibetasigma1914.org/imisdev/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=d2a740ce-8b73-4a54-97a5-990ac2cce029&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

const USERNAME = process.argv[2];
const PASSWORD = process.argv[3];
const BROWSER_ARG = process.argv[4] || 'all';

if (!USERNAME || !PASSWORD) {
    console.error('Usage: node test-dialog-cross-browser.js <username> <password> [browser]');
    console.error('  browser: chromium, webkit, firefox, or all (default: all)');
    process.exit(1);
}

const browsers = {
    chromium: { name: 'Chrome', engine: chromium },
    webkit: { name: 'Safari', engine: webkit },
    firefox: { name: 'Firefox', engine: firefox }
};

async function testBrowser(browserType, browserName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TESTING: ${browserName}`);
    console.log('='.repeat(60));

    const browser = await browserType.launch({
        headless: false,
        slowMo: 100
    });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    // Handle dialogs
    page.on('dialog', async dialog => {
        console.log(`[${browserName}] Dialog: ${dialog.message()}`);
        await dialog.accept();
    });

    try {
        // Login
        console.log(`[${browserName}] Logging in...`);
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
        await page.fill('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', USERNAME);
        await page.fill('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', PASSWORD);
        await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
        await page.waitForTimeout(5000);
        console.log(`[${browserName}] Logged in!`);

        // Test 1: Account Page Panel Editor
        console.log(`\n[${browserName}] --- Test 1: Account Page Panel Editor ---`);
        try {
            await page.goto(ACCOUNT_URL, { waitUntil: 'networkidle', timeout: 30000 });
        } catch (e) {
            console.log(`[${browserName}] Navigation timeout, continuing...`);
        }
        await page.waitForTimeout(2000);

        // Find and click edit link
        const editLink = await page.$('a[onclick*="EditPanel"], a[href*="EditPanel"], .panel-heading-options a, .PanelHeadOptions a, a[title*="Edit"]');
        if (editLink) {
            await editLink.click();
            await page.waitForTimeout(3000);

            // Take screenshot
            const screenshotPath = path.join(SCREENSHOT_DIR, `dialog-${browserName.toLowerCase()}-panel-editor.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`[${browserName}] Screenshot: ${screenshotPath}`);

            // Analyze dialog
            const dialogInfo = await page.evaluate(() => {
                const radWindow = document.querySelector('.RadWindow, [class*="RadWindow"]');
                if (!radWindow) return { found: false };

                const rect = radWindow.getBoundingClientRect();
                const style = getComputedStyle(radWindow);
                return {
                    found: true,
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    left: Math.round(rect.left),
                    top: Math.round(rect.top),
                    display: style.display,
                    maxWidth: style.maxWidth
                };
            });

            if (dialogInfo.found) {
                console.log(`[${browserName}] Panel Editor Dialog: ${dialogInfo.width}x${dialogInfo.height}px at (${dialogInfo.left}, ${dialogInfo.top})`);
                if (dialogInfo.width < 500) {
                    console.log(`[${browserName}] ✗ PROBLEM: Dialog too narrow (${dialogInfo.width}px < 500px)`);
                } else {
                    console.log(`[${browserName}] ✓ Dialog width OK`);
                }
            } else {
                console.log(`[${browserName}] ✗ Dialog not found`);
            }

            // Close dialog if open
            const closeBtn = await page.$('.RadWindow .rwControlButtons a, .rwCloseButton');
            if (closeBtn) await closeBtn.click();
            await page.waitForTimeout(1000);
        } else {
            console.log(`[${browserName}] Could not find edit panel link`);
        }

        // Test 2: Community Page Edit Dialog
        console.log(`\n[${browserName}] --- Test 2: Community Page Edit Dialog ---`);
        try {
            await page.goto(COMMUNITY_URL, { waitUntil: 'networkidle', timeout: 30000 });
        } catch (e) {
            console.log(`[${browserName}] Navigation timeout, continuing...`);
        }
        await page.waitForTimeout(2000);

        // Find and click edit link on community page
        const communityEditLink = await page.$('a[onclick*="Edit"], a[href*="Edit"], a[title*="Edit"]');
        if (communityEditLink) {
            await communityEditLink.click();
            await page.waitForTimeout(3000);

            // Take screenshot
            const screenshotPath = path.join(SCREENSHOT_DIR, `dialog-${browserName.toLowerCase()}-community-edit.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`[${browserName}] Screenshot: ${screenshotPath}`);

            // Analyze dialog
            const dialogInfo = await page.evaluate(() => {
                const radWindow = document.querySelector('.RadWindow, [class*="RadWindow"]');
                if (!radWindow) return { found: false };

                const rect = radWindow.getBoundingClientRect();
                const rwContent = radWindow.querySelector('.rwContent');
                const iframe = radWindow.querySelector('iframe');

                return {
                    found: true,
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    hasContent: rwContent ? rwContent.innerHTML.length > 100 : false,
                    hasIframe: !!iframe,
                    iframeWidth: iframe ? Math.round(iframe.getBoundingClientRect().width) : 0
                };
            });

            if (dialogInfo.found) {
                console.log(`[${browserName}] Community Edit Dialog: ${dialogInfo.width}x${dialogInfo.height}px`);
                console.log(`[${browserName}]   Has content: ${dialogInfo.hasContent}, Has iframe: ${dialogInfo.hasIframe}`);
                if (dialogInfo.hasIframe) {
                    console.log(`[${browserName}]   Iframe width: ${dialogInfo.iframeWidth}px`);
                }
                if (dialogInfo.width < 400) {
                    console.log(`[${browserName}] ✗ PROBLEM: Dialog too narrow`);
                } else if (!dialogInfo.hasContent && !dialogInfo.hasIframe) {
                    console.log(`[${browserName}] ✗ PROBLEM: Dialog appears empty`);
                } else {
                    console.log(`[${browserName}] ✓ Dialog looks OK`);
                }
            } else {
                console.log(`[${browserName}] Dialog not found (may not have edit permissions)`);
            }
        } else {
            console.log(`[${browserName}] Could not find community edit link`);
        }

        console.log(`\n[${browserName}] Keeping browser open for 30 seconds...`);
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error(`[${browserName}] Error:`, error.message);
    } finally {
        await browser.close();
    }
}

async function main() {
    console.log('Cross-Browser Dialog Testing');
    console.log('============================');
    console.log(`Username: ${USERNAME}`);
    console.log(`Browser: ${BROWSER_ARG}`);

    if (BROWSER_ARG === 'all') {
        for (const [key, { name, engine }] of Object.entries(browsers)) {
            await testBrowser(engine, name);
        }
    } else if (browsers[BROWSER_ARG]) {
        const { name, engine } = browsers[BROWSER_ARG];
        await testBrowser(engine, name);
    } else {
        console.error(`Unknown browser: ${BROWSER_ARG}`);
        console.error('Available: chromium, webkit, firefox, all');
        process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('TESTING COMPLETE');
    console.log('='.repeat(60));
}

main().catch(console.error);
