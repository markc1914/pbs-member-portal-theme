const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = './automatedTestScreenshots';
const BASE_URL = 'https://members.phibetasigma1914.org/iMISDEV';

const username = process.argv[2];
const password = process.argv[3];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Read our local CSS fix to inject
const cssFixPath = path.join(__dirname, 'package', 'pbs-theme.css');
const localCSS = fs.readFileSync(cssFixPath, 'utf8');

async function testResourceCollapse() {
    if (!username || !password) {
        console.log('Usage: node test-resource-collapse.js <username> <password>');
        process.exit(1);
    }

    console.log('Testing Resource Library folder collapse fix...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    page.on('dialog', async dialog => {
        await dialog.accept();
    });

    try {
        // Login
        console.log('1. Logging in...');
        await page.goto(`${BASE_URL}/PBSMember/Sign_In.aspx`, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.type('input[id*="UserName"]', username);
        await page.type('input[id*="Password"]', password);
        await page.click('input[type="submit"], button[type="submit"], input[id*="LoginButton"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
        await wait(2000);

        // Navigate to Resource Library / Documents page
        console.log('2. Navigating to Resource Library...');
        await page.goto(`${BASE_URL}/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc`, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(2000);

        // Inject our local CSS fix
        console.log('3. Injecting local CSS fix...');
        await page.addStyleTag({ content: localCSS });
        await wait(500);

        // Screenshot before expanding
        const beforeScreenshot = path.join(SCREENSHOTS_DIR, `resource-1-before-expand-${Date.now()}.png`);
        await page.screenshot({ path: beforeScreenshot });
        console.log(`   Screenshot: ${beforeScreenshot}`);

        // Find and click a plus icon to expand a folder
        console.log('4. Looking for expand (+) buttons...');
        const plusButtons = await page.$$('.rtPlus');
        console.log(`   Found ${plusButtons.length} plus buttons`);

        if (plusButtons.length > 0) {
            // Click first plus button to expand
            console.log('5. Clicking plus to EXPAND folder...');
            await plusButtons[0].click();
            await wait(1000);

            const expandedScreenshot = path.join(SCREENSHOTS_DIR, `resource-2-expanded-${Date.now()}.png`);
            await page.screenshot({ path: expandedScreenshot });
            console.log(`   Screenshot: ${expandedScreenshot}`);

            // Now find the minus button (should have replaced the plus)
            console.log('6. Looking for collapse (-) button...');
            const minusButtons = await page.$$('.rtMinus');
            console.log(`   Found ${minusButtons.length} minus buttons`);

            if (minusButtons.length > 0) {
                // Click minus button to collapse
                console.log('7. Clicking minus to COLLAPSE folder...');
                await minusButtons[0].click();
                await wait(1000);

                const collapsedScreenshot = path.join(SCREENSHOTS_DIR, `resource-3-collapsed-${Date.now()}.png`);
                await page.screenshot({ path: collapsedScreenshot });
                console.log(`   Screenshot: ${collapsedScreenshot}`);

                // Check if the folder actually collapsed
                const collapsedNodes = await page.$$('.rtCollapsed');
                console.log(`\n   Found ${collapsedNodes.length} collapsed nodes`);

                // Check computed style of collapsed elements
                const isHidden = await page.evaluate(() => {
                    const collapsed = document.querySelector('.rtCollapsed');
                    if (collapsed) {
                        const style = window.getComputedStyle(collapsed);
                        return {
                            display: style.display,
                            visibility: style.visibility,
                            height: style.height
                        };
                    }
                    return null;
                });

                if (isHidden) {
                    console.log(`   Collapsed element styles: display=${isHidden.display}, visibility=${isHidden.visibility}, height=${isHidden.height}`);
                    if (isHidden.display === 'none' || isHidden.visibility === 'hidden') {
                        console.log('\n✅ SUCCESS: Collapsed folders are properly hidden!');
                    } else {
                        console.log('\n❌ ISSUE: Collapsed folders may still be visible');
                    }
                }
            } else {
                console.log('   No minus buttons found after expanding');
            }
        } else {
            console.log('   No plus buttons found - page may not have expandable folders');
            const pageScreenshot = path.join(SCREENSHOTS_DIR, `resource-no-folders-${Date.now()}.png`);
            await page.screenshot({ path: pageScreenshot, fullPage: true });
            console.log(`   Full page screenshot: ${pageScreenshot}`);
        }

        console.log('\n✓ Test complete! Check automatedTestScreenshots/ for results.');

    } catch (error) {
        console.error('Error:', error.message);
        const errorScreenshot = path.join(SCREENSHOTS_DIR, `resource-error-${Date.now()}.png`);
        await page.screenshot({ path: errorScreenshot });
        console.log(`Error screenshot: ${errorScreenshot}`);
    }

    console.log('\nBrowser left open for manual inspection. Close when done.');
}

testResourceCollapse();
