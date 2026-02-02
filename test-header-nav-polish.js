const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function testHeaderNavPolish() {
    // Load local CSS and fix image paths
    let localCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    localCss = localCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({
        headless: false,
        protocolTimeout: 60000
    });

    const page = await browser.newPage();

    // Handle dialogs
    page.on('dialog', async dialog => {
        console.log('[DIALOG] Accepting...');
        await dialog.accept();
    });

    try {
        // ========== DESKTOP TEST ==========
        console.log('\n=== DESKTOP TEST (1280x900) ===');
        await page.setViewport({ width: 1280, height: 900 });

        // Login
        console.log('Logging in...');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'REDACTED_USER');
        await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'REDACTED_PASSWORD');

        // Use JavaScript click for more reliable login
        await page.evaluate(() => {
            const btn = document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 5000));
        console.log('Logged in!');

        // Inject local CSS
        console.log('Injecting local CSS...');
        await page.addStyleTag({ content: localCss });

        // Screenshot desktop header area
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'issue17-desktop-header.png'),
            fullPage: false
        });
        console.log('Screenshot saved: issue17-desktop-header.png');

        // Analyze header/nav structure
        console.log('\n=== ANALYZING HEADER/NAV ===');
        const desktopAnalysis = await page.evaluate(() => {
            const results = {
                headerBg: null,
                bannerBg: null,
                navBg: null,
                lastNavItemBorder: null,
                gapBetweenBannerAndNav: null
            };

            // Check #hd background
            const hd = document.querySelector('#hd');
            if (hd) {
                results.headerBg = getComputedStyle(hd).backgroundColor;
            }

            // Check banner background
            const banner = document.querySelector('#masterHeaderImage, #masterDonorHeaderImage');
            if (banner) {
                results.bannerBg = getComputedStyle(banner).backgroundColor;
                const bannerRect = banner.getBoundingClientRect();
                results.bannerBottom = bannerRect.bottom;
            }

            // Check nav background
            const nav = document.querySelector('.PrimaryNavPanel, #ctl01_NavPanel, .header-bottom-container');
            if (nav) {
                results.navBg = getComputedStyle(nav).backgroundColor;
                const navRect = nav.getBoundingClientRect();
                results.navTop = navRect.top;

                // Calculate gap
                if (results.bannerBottom !== undefined) {
                    results.gapBetweenBannerAndNav = results.navTop - results.bannerBottom;
                }
            }

            // Check last nav item border
            const lastNavItem = document.querySelector('#hd .rmRootGroup > .rmItem:last-child, #hd .rmRootGroup > .rmLast');
            if (lastNavItem) {
                results.lastNavItemBorder = getComputedStyle(lastNavItem).borderRight;
            }

            // Check all nav items for borders
            const allNavItems = document.querySelectorAll('#hd .rmRootGroup > .rmItem');
            results.navItemCount = allNavItems.length;
            results.navItemBorders = [];
            allNavItems.forEach((item, i) => {
                results.navItemBorders.push({
                    index: i,
                    borderRight: getComputedStyle(item).borderRight
                });
            });

            return results;
        });

        console.log('Desktop Analysis:');
        console.log('  Header (#hd) background:', desktopAnalysis.headerBg);
        console.log('  Banner background:', desktopAnalysis.bannerBg);
        console.log('  Nav background:', desktopAnalysis.navBg);
        console.log('  Gap between banner and nav:', desktopAnalysis.gapBetweenBannerAndNav, 'px');
        console.log('  Last nav item border-right:', desktopAnalysis.lastNavItemBorder);
        console.log('  Nav item count:', desktopAnalysis.navItemCount);

        // Check for issues
        const issues = [];
        if (desktopAnalysis.gapBetweenBannerAndNav > 5) {
            issues.push(`Gap between banner and nav is ${desktopAnalysis.gapBetweenBannerAndNav}px (should be minimal)`);
        }
        if (desktopAnalysis.lastNavItemBorder && !desktopAnalysis.lastNavItemBorder.includes('none') && !desktopAnalysis.lastNavItemBorder.includes('0px')) {
            issues.push(`Last nav item still has border: ${desktopAnalysis.lastNavItemBorder}`);
        }

        if (issues.length > 0) {
            console.log('\n⚠️  ISSUES FOUND:');
            issues.forEach(issue => console.log('  -', issue));
        } else {
            console.log('\n✅ Desktop header/nav looks good!');
        }

        // ========== MOBILE TEST ==========
        console.log('\n=== MOBILE TEST (375x667) ===');
        await page.setViewport({ width: 375, height: 667 });
        await new Promise(r => setTimeout(r, 1000));

        // Re-inject CSS after viewport change
        await page.addStyleTag({ content: localCss });
        await new Promise(r => setTimeout(r, 500));

        // Screenshot mobile header
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'issue17-mobile-header.png'),
            fullPage: false
        });
        console.log('Screenshot saved: issue17-mobile-header.png');

        // Mobile analysis
        const mobileAnalysis = await page.evaluate(() => {
            const results = {
                headerBg: null,
                bannerVisible: false,
                navVisible: false
            };

            const hd = document.querySelector('#hd');
            if (hd) {
                results.headerBg = getComputedStyle(hd).backgroundColor;
            }

            const banner = document.querySelector('#masterHeaderImage, #masterDonorHeaderImage');
            if (banner) {
                const rect = banner.getBoundingClientRect();
                results.bannerVisible = rect.height > 0;
                results.bannerHeight = rect.height;
            }

            const nav = document.querySelector('.PrimaryNavPanel, #ctl01_NavPanel');
            if (nav) {
                const rect = nav.getBoundingClientRect();
                results.navVisible = rect.height > 0;
            }

            return results;
        });

        console.log('Mobile Analysis:');
        console.log('  Header (#hd) background:', mobileAnalysis.headerBg);
        console.log('  Banner visible:', mobileAnalysis.bannerVisible, '(height:', mobileAnalysis.bannerHeight, 'px)');
        console.log('  Nav visible:', mobileAnalysis.navVisible);

        // ========== WIDE SCREEN TEST ==========
        console.log('\n=== WIDE SCREEN TEST (1920x1080) ===');
        await page.setViewport({ width: 1920, height: 1080 });
        await new Promise(r => setTimeout(r, 1000));

        // Re-inject CSS
        await page.addStyleTag({ content: localCss });
        await new Promise(r => setTimeout(r, 500));

        // Screenshot wide screen header
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'issue17-widescreen-header.png'),
            fullPage: false
        });
        console.log('Screenshot saved: issue17-widescreen-header.png');

        console.log('\n=== TEST COMPLETE ===');
        console.log('Check screenshots in testingScreenshots/ folder:');
        console.log('  - issue17-desktop-header.png');
        console.log('  - issue17-mobile-header.png');
        console.log('  - issue17-widescreen-header.png');

        // Wait a bit for review
        await new Promise(r => setTimeout(r, 3000));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

testHeaderNavPolish();
