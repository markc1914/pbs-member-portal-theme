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

async function debugResourceLibrary() {
    if (!username || !password) {
        console.log('Usage: node test-resource-debug.js <username> <password>');
        process.exit(1);
    }

    console.log('Debugging Resource Library tree structure...\n');

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

        // Navigate to Resource Library
        console.log('2. Navigating to Resource Library...');
        await page.goto(`${BASE_URL}/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc`, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(1000);

        // Inject local CSS fix
        console.log('   Injecting local CSS fix...');
        await page.addStyleTag({ content: localCSS });
        await wait(1000);

        // Debug: Get tree structure BEFORE expanding
        console.log('\n=== BEFORE EXPANDING ===');
        const beforeState = await page.evaluate(() => {
            const treeView = document.querySelector('.RadTreeView, [class*="RadTreeView"]');
            const firstFolder = document.querySelector('.rtPlus');
            const folderParent = firstFolder ? firstFolder.closest('li, .rtLI') : null;

            return {
                treeViewClass: treeView ? treeView.className : 'NOT FOUND',
                firstFolderParentClass: folderParent ? folderParent.className : 'NOT FOUND',
                firstFolderParentHTML: folderParent ? folderParent.innerHTML.substring(0, 500) : 'NOT FOUND',
                allClasses: [...new Set([...document.querySelectorAll('[class*="rt"]')].map(el => el.className))].slice(0, 20)
            };
        });
        console.log('Tree view class:', beforeState.treeViewClass);
        console.log('First folder parent class:', beforeState.firstFolderParentClass);
        console.log('Classes with "rt":', beforeState.allClasses);

        // Click plus to expand
        console.log('\n3. Clicking PLUS to expand...');
        const plusButton = await page.$('.rtPlus');
        if (plusButton) {
            await plusButton.click();
            await wait(1500);

            // Debug: Get tree structure AFTER expanding
            console.log('\n=== AFTER EXPANDING ===');
            const afterExpandState = await page.evaluate(() => {
                const firstMinus = document.querySelector('.rtMinus');
                const folderParent = firstMinus ? firstMinus.closest('li, .rtLI') : null;
                const childUL = folderParent ? folderParent.querySelector('ul, .rtUL') : null;

                return {
                    minusFound: !!firstMinus,
                    folderParentClass: folderParent ? folderParent.className : 'NOT FOUND',
                    childULClass: childUL ? childUL.className : 'NOT FOUND',
                    childULStyle: childUL ? childUL.getAttribute('style') : 'NO STYLE',
                    childULDisplay: childUL ? window.getComputedStyle(childUL).display : 'N/A'
                };
            });
            console.log('Minus button found:', afterExpandState.minusFound);
            console.log('Folder parent class:', afterExpandState.folderParentClass);
            console.log('Child UL class:', afterExpandState.childULClass);
            console.log('Child UL inline style:', afterExpandState.childULStyle);
            console.log('Child UL computed display:', afterExpandState.childULDisplay);

            // Screenshot expanded
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `debug-expanded-${Date.now()}.png`) });

            // Click minus to collapse
            console.log('\n4. Clicking MINUS to collapse...');
            const minusButton = await page.$('.rtMinus');
            if (minusButton) {
                await minusButton.click();
                await wait(1500);

                // Debug: Get tree structure AFTER collapsing
                console.log('\n=== AFTER COLLAPSING ===');
                const afterCollapseState = await page.evaluate(() => {
                    // Find the folder we just collapsed (should now have plus again)
                    const folders = document.querySelectorAll('.rtPlus, .rtMinus');
                    const firstFolder = folders[0];
                    const folderParent = firstFolder ? firstFolder.closest('li, .rtLI') : null;
                    const childUL = folderParent ? folderParent.querySelector('ul, .rtUL') : null;

                    return {
                        toggleButtonClass: firstFolder ? firstFolder.className : 'NOT FOUND',
                        folderParentClass: folderParent ? folderParent.className : 'NOT FOUND',
                        childULExists: !!childUL,
                        childULClass: childUL ? childUL.className : 'NOT FOUND',
                        childULStyle: childUL ? childUL.getAttribute('style') : 'NO STYLE',
                        childULDisplay: childUL ? window.getComputedStyle(childUL).display : 'N/A',
                        childULVisibility: childUL ? window.getComputedStyle(childUL).visibility : 'N/A',
                        childULHeight: childUL ? window.getComputedStyle(childUL).height : 'N/A'
                    };
                });
                console.log('Toggle button class:', afterCollapseState.toggleButtonClass);
                console.log('Folder parent class:', afterCollapseState.folderParentClass);
                console.log('Child UL exists:', afterCollapseState.childULExists);
                console.log('Child UL class:', afterCollapseState.childULClass);
                console.log('Child UL inline style:', afterCollapseState.childULStyle);
                console.log('Child UL computed display:', afterCollapseState.childULDisplay);
                console.log('Child UL visibility:', afterCollapseState.childULVisibility);
                console.log('Child UL height:', afterCollapseState.childULHeight);

                // Screenshot collapsed
                await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `debug-collapsed-${Date.now()}.png`) });
            }
        }

        console.log('\n✓ Debug complete! Browser left open for inspection.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugResourceLibrary();
