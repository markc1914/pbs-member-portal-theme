const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const ACCOUNT_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/My_Account_2/PBSMember/AccountPage.aspx?hkey=53f0d6d1-e7a3-4f97-87b5-d6d0a6a282f0';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testDialogAndTabs() {
    // Load local CSS and fix image paths
    let localCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    localCss = localCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({
        headless: false,
        protocolTimeout: 120000
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Handle dialogs
    page.on('dialog', async dialog => {
        console.log('[DIALOG] Accepting:', dialog.message().substring(0, 50) + '...');
        await dialog.accept();
    });

    try {
        // ========== LOGIN ==========
        console.log('=== LOGGING IN ===');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'REDACTED_USER');
        await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'REDACTED_PASSWORD');

        // JavaScript click for login
        await page.evaluate(() => {
            const btn = document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
            if (btn) btn.click();
        });
        await sleep(6000);
        console.log('Logged in! Current URL:', page.url());

        // Navigate to Account page
        console.log('Navigating to Account page...');
        await page.goto(ACCOUNT_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);

        // Inject local CSS
        console.log('Injecting local CSS...');
        await page.addStyleTag({ content: localCss });
        await sleep(1000);

        // ========== SCREENSHOT: PROFILE PAGE WITH TABS ==========
        console.log('\n=== ANALYZING PROFILE PAGE ===');
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'issue19-profile-page.png'),
            fullPage: false
        });
        console.log('Screenshot saved: issue19-profile-page.png');

        // Analyze tab styling - using RadTabStrip_Default
        const tabAnalysis = await page.evaluate(() => {
            const results = { tabs: [], tabContainer: null };

            // Find the tab container
            const tabContainer = document.querySelector('.RadTabStrip, [class*="RadTabStrip"]');
            if (tabContainer) {
                const style = getComputedStyle(tabContainer);
                results.tabContainer = {
                    className: tabContainer.className,
                    background: style.backgroundColor
                };
            }

            // Find all tab links
            const tabs = document.querySelectorAll('.rtsLink, .RadTabStrip a');
            tabs.forEach((tab, i) => {
                const style = getComputedStyle(tab);
                const li = tab.closest('.rtsLI, li');
                const liStyle = li ? getComputedStyle(li) : null;

                // Get the rtsOut/rtsIn spans
                const rtsOut = tab.querySelector('.rtsOut');
                const rtsIn = tab.querySelector('.rtsIn');
                const rtsOutStyle = rtsOut ? getComputedStyle(rtsOut) : null;
                const rtsInStyle = rtsIn ? getComputedStyle(rtsIn) : null;

                results.tabs.push({
                    text: tab.textContent.trim(),
                    isSelected: tab.classList.contains('rtsSelected') || (li && li.classList.contains('rtsSelected')),
                    linkBackground: style.backgroundColor,
                    linkBorder: style.border,
                    linkBorderRadius: style.borderRadius,
                    liBorderRadius: liStyle ? liStyle.borderRadius : null,
                    liBackground: liStyle ? liStyle.backgroundImage : null,
                    rtsOutBackground: rtsOutStyle ? rtsOutStyle.backgroundImage : null,
                    rtsInBackground: rtsInStyle ? rtsInStyle.backgroundImage : null
                });
            });
            return results;
        });
        console.log('Tab analysis:', JSON.stringify(tabAnalysis, null, 2));

        // ========== CLICK EDIT LINK TO OPEN DIALOG ==========
        console.log('\n=== OPENING EDIT DIALOG ===');

        // Find the "Edit" link in the sidebar (near the name or photo)
        const editClicked = await page.evaluate(() => {
            // Look for edit links with specific patterns
            const selectors = [
                'a[id*="EditLink"]',
                'a[id*="lnkEdit"]',
                'a[onclick*="ShowDialog"]',
                '#masterSideBarPanel a',
                '.col-sm-3 a'
            ];

            for (const selector of selectors) {
                const links = document.querySelectorAll(selector);
                for (const link of links) {
                    const text = link.textContent.trim().toLowerCase();
                    if (text === 'edit' && link.offsetParent !== null) {
                        const rect = link.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0 && rect.top > 100) {
                            link.click();
                            return { clicked: true, text: link.textContent.trim(), id: link.id, selector };
                        }
                    }
                }
            }
            return { clicked: false };
        });
        console.log('Edit link clicked:', editClicked);
        await sleep(3000);

        // Re-inject CSS after dialog opens (dialogs may load in iframes or new DOM)
        await page.addStyleTag({ content: localCss });
        await sleep(500);

        // Screenshot the dialog
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'issue19-edit-dialog.png'),
            fullPage: false
        });
        console.log('Screenshot saved: issue19-edit-dialog.png');

        // Analyze dialog/modal styling
        const dialogAnalysis = await page.evaluate(() => {
            const results = { radWindows: [], panelHeadings: [], modals: [] };

            // Check for RadWindow (Telerik dialogs)
            const radWindows = document.querySelectorAll('.RadWindow, [class*="RadWindow"]');
            radWindows.forEach(win => {
                const titleBar = win.querySelector('.rwTitleBar, .rwTitle, [class*="rwTitle"]');
                const titleBarStyle = titleBar ? getComputedStyle(titleBar) : null;
                results.radWindows.push({
                    className: win.className,
                    titleBarClass: titleBar ? titleBar.className : null,
                    titleBarBg: titleBarStyle ? titleBarStyle.backgroundColor : null,
                    titleBarBorder: titleBarStyle ? titleBarStyle.border : null
                });
            });

            // Check for panel-heading elements
            const panelHeadings = document.querySelectorAll('.panel-heading');
            panelHeadings.forEach(heading => {
                const style = getComputedStyle(heading);
                if (style.display !== 'none') {
                    results.panelHeadings.push({
                        text: heading.textContent.trim().substring(0, 30),
                        background: style.backgroundColor,
                        border: style.border
                    });
                }
            });

            return results;
        });
        console.log('Dialog analysis:', JSON.stringify(dialogAnalysis, null, 2));

        // Close the dialog
        await page.keyboard.press('Escape');
        await sleep(1000);

        // ========== TRY TO OPEN PHOTO CHANGE DIALOG ==========
        console.log('\n=== ATTEMPTING TO OPEN CHANGE PICTURE DIALOG ===');

        // Click on the profile photo area
        const photoClicked = await page.evaluate(() => {
            // Look for image elements or "Change" links
            const changeLinks = document.querySelectorAll('a[id*="Picture"], a[id*="Photo"], a[id*="Image"], [class*="photo"] a, [class*="picture"] a');
            for (const link of changeLinks) {
                if (link.offsetParent !== null) {
                    link.click();
                    return { clicked: true, id: link.id };
                }
            }
            // Try clicking on profile image
            const imgs = document.querySelectorAll('img[id*="Photo"], img[id*="Picture"], img[id*="profile"]');
            for (const img of imgs) {
                if (img.offsetParent !== null) {
                    img.click();
                    return { clicked: true, type: 'image', id: img.id };
                }
            }
            return { clicked: false };
        });
        console.log('Photo element clicked:', photoClicked);
        await sleep(2000);

        // Screenshot
        await page.addStyleTag({ content: localCss });
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'issue19-photo-dialog.png'),
            fullPage: false
        });
        console.log('Screenshot saved: issue19-photo-dialog.png');

        // Analyze buttons in any visible dialogs
        const buttonAnalysis = await page.evaluate(() => {
            const results = [];
            // Look for RadUpload buttons and select buttons
            const buttons = document.querySelectorAll('.ruButton, .ruBrowse, input[type="file"] + *, [class*="select"], [class*="Select"], .TextButton');
            buttons.forEach(btn => {
                const style = getComputedStyle(btn);
                if (style.display !== 'none' && btn.offsetParent !== null) {
                    results.push({
                        tag: btn.tagName,
                        className: btn.className,
                        text: btn.textContent?.trim() || btn.value,
                        background: style.backgroundColor,
                        color: style.color,
                        border: style.border
                    });
                }
            });
            return results;
        });
        console.log('Button analysis:', JSON.stringify(buttonAnalysis, null, 2));

        console.log('\n=== TEST COMPLETE ===');
        console.log('Screenshots saved:');
        console.log('  - issue19-profile-page.png');
        console.log('  - issue19-edit-dialog.png');
        console.log('  - issue19-photo-dialog.png');

        await sleep(3000);

    } catch (error) {
        console.error('Error:', error);
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'issue19-error.png'),
            fullPage: true
        });
    } finally {
        await browser.close();
    }
}

testDialogAndTabs();
