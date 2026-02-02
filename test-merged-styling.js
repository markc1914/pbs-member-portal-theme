const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const ACCOUNT_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/My_Account_2/PBSMember/AccountPage.aspx?hkey=53f0d6d1-e7a3-4f97-87b5-d6d0a6a282f0';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testMergedStyling() {
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

        // ========== SCREENSHOT: PROFILE PAGE ==========
        console.log('\n=== TAKING SCREENSHOT OF PROFILE PAGE ===');
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'merged-styling-test.png'),
            fullPage: false
        });
        console.log('Screenshot saved: merged-styling-test.png');

        // Analyze header and navbar styling
        const styleAnalysis = await page.evaluate(() => {
            const results = {};

            // Check header background
            const headerBg = document.querySelector('#masterHeaderBackground');
            if (headerBg) {
                const style = getComputedStyle(headerBg);
                results.headerBackground = {
                    backgroundColor: style.backgroundColor,
                    margin: style.margin,
                    padding: style.padding
                };
            }

            // Check nav menu container
            const navMenu = document.querySelector('#hd .rmRootGroup, #hd .RadMenu .rmRootGroup');
            if (navMenu) {
                const style = getComputedStyle(navMenu);
                results.navMenuContainer = {
                    border: style.border,
                    borderBottom: style.borderBottom,
                    borderTop: style.borderTop,
                    backgroundColor: style.backgroundColor
                };
            }

            // Check nav buttons
            const navButtons = document.querySelectorAll('#hd .RadMenu > .rmRootGroup > .rmItem > a.rmLink');
            results.navButtons = [];
            navButtons.forEach((btn, i) => {
                if (i < 3) {
                    const style = getComputedStyle(btn);
                    results.navButtons.push({
                        text: btn.textContent.trim(),
                        border: style.border,
                        borderTop: style.borderTop,
                        borderBottom: style.borderBottom,
                        backgroundImage: style.backgroundImage,
                        backgroundColor: style.backgroundColor
                    });
                }
            });

            // Check for any light blue lines in header area
            const elementsNearNav = [];
            const allHeaderElements = document.querySelectorAll('#hd *, header *');
            allHeaderElements.forEach(el => {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();

                // Look for light blue borders (around #6a9ac9 or similar)
                const borderBottom = style.borderBottom;
                const borderTop = style.borderTop;

                if ((borderBottom && borderBottom.includes('rgb(106, 154, 201)')) ||
                    (borderTop && borderTop.includes('rgb(106, 154, 201)')) ||
                    (borderBottom && borderBottom.includes('rgb(22, 79, 144)')) ||
                    (borderTop && borderTop.includes('rgb(22, 79, 144)'))) {
                    elementsNearNav.push({
                        tag: el.tagName,
                        id: el.id || 'no-id',
                        className: el.className ? el.className.toString().substring(0, 40) : '',
                        borderBottom,
                        borderTop
                    });
                }
            });
            results.elementsWithBlueLineBorders = elementsNearNav;

            return results;
        });

        console.log('\n=== STYLE ANALYSIS ===');
        console.log('Header Background:', JSON.stringify(styleAnalysis.headerBackground, null, 2));
        console.log('\nNav Menu Container:', JSON.stringify(styleAnalysis.navMenuContainer, null, 2));
        console.log('\nNav Buttons (first 3):', JSON.stringify(styleAnalysis.navButtons, null, 2));
        console.log('\nElements with blue-line borders:', JSON.stringify(styleAnalysis.elementsWithBlueLineBorders, null, 2));

        console.log('\n=== TEST COMPLETE ===');
        console.log('Check merged-styling-test.png for visual confirmation');

        await sleep(5000);

    } catch (error) {
        console.error('Error:', error);
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'merged-styling-error.png'),
            fullPage: true
        });
    } finally {
        await browser.close();
    }
}

testMergedStyling();
