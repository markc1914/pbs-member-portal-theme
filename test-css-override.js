const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOTS_DIR = './automatedTestScreenshots';
const BASE_URL = 'https://members.phibetasigma1914.org/iMISDEV';

const PAGES = {
    login: 'https://members.phibetasigma1914.org/imisdev/pbsmember',
    home: `${BASE_URL}/PBSMember/Home.aspx`,
    account: `${BASE_URL}/PBSMember/My_Account_2/PBSMember/AccountPage.aspx?hkey=53f0d6d1-e7a3-4f97-87b5-d6d0a6a282f0`,
    education: `${BASE_URL}/PBSMember/Documents/Member_Education_Material/PBSMember/Member_Education_Material.aspx?hkey=d0ba999b-db57-47c4-84c0-c9c1505cfacc`,
    community: `${BASE_URL}/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=d2a740ce-8b73-4a54-97a5-990ac2cce029&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140`
};

const VIEWPORTS = {
    fullscreen: { width: 2560, height: 1440, name: 'fullscreen' },
    wide: { width: 1920, height: 1080, name: 'wide' },
    desktop: { width: 1400, height: 900, name: 'desktop' },
    mobile: { width: 375, height: 812, name: 'mobile' }
};

const username = process.argv[2];
const password = process.argv[3];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// CSS overrides to test fixes - matches changes in pbs-theme.css
const CSS_OVERRIDES = `
/* FIX: Header container - expand to full width */
#hd, .header {
    background-color: #FFFFFF !important;
    width: 100% !important;
}

/* Header parent containers - must be wide enough for 1040px banner */
.header-container,
.header-logo-container,
#masterLogoArea {
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
}

#masterHeaderBackground {
    height: 120px !important;
    min-height: 120px !important;
    position: relative !important;
    display: block !important;
    margin-bottom: 10px !important;
    padding: 15px !important;
    background-color: #FFFFFF !important;
    width: 100% !important;
}

/* FIX: Header image - MUST show full 1040px width for founders on right */
#masterHeaderImage,
#masterDonorHeaderImage,
a#masterHeaderImage,
a#masterDonorHeaderImage {
    background-image: url("https://members.phibetasigma1914.org/iMISDEV/App_Themes/PBS_Responsive_Theme/images/pbs-header2.png") !important;
    background-repeat: no-repeat !important;
    background-position: left center !important;
    background-size: contain !important;
    width: 1040px !important;
    max-width: 95% !important;
    height: 89px !important;
    display: block !important;
    visibility: visible !important;
    position: relative !important;
    margin: 15px !important;
    z-index: 10 !important;
    text-indent: -9999px !important;
    overflow: hidden !important;
    font-size: 0 !important;
    color: transparent !important;
}

/* Nav panel z-index */
.PrimaryNavPanel,
#ctl01_NavPanel,
[id*="NavPanel"] {
    z-index: 1000 !important;
}

/* Nav menu bar - FORCE BLUE background (not grey) */
.RadMenu,
.RadMenu_Austin,
.rmRootGroup,
.rmHorizontal,
.rmRootGroup.rmHorizontal,
ul.rmRootGroup {
    background-color: #164F90 !important;
    background: #164F90 !important;
}

/* Nav bar container - FORCE BLUE */
.PrimaryNavPanel,
#ctl01_NavPanel,
[id*="NavPanel"],
[class*="NavPanel"] {
    background-color: #164F90 !important;
    background: #164F90 !important;
}

/* header-bottom-container - FORCE BLUE (container only, not children) */
.header-bottom-container {
    background-color: #164F90 !important;
}

/* Root nav items - transparent background on blue bar */
.RadMenu > .rmRootGroup > .rmItem,
.RadMenu_Austin > .rmRootGroup > .rmItem {
    background-color: transparent !important;
    background: transparent !important;
}

/* DESKTOP NAV - WHITE TEXT on BLUE background for READABILITY */
/* ONLY target root nav items, NOT dropdowns or buttons */
.RadMenu > .rmRootGroup > .rmItem > a.rmLink,
.RadMenu > .rmRootGroup > .rmItem > a.rmLink .rmText,
.RadMenu_Austin > .rmRootGroup > .rmItem > a.rmLink,
.RadMenu_Austin > .rmRootGroup > .rmItem > a.rmLink .rmText,
a.rmLink.rmRootLink,
a.rmLink.rmRootLink .rmText,
.rmRootGroup > .rmItem > a.rmRootLink,
.rmRootGroup > .rmItem > a.rmRootLink .rmText {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    background-color: transparent !important;
    font-weight: 600 !important;
    text-shadow: none !important;
    opacity: 1 !important;
}

/* Hover state */
.RadMenu a:hover,
.RadMenu_Austin a:hover,
a.rmLink:hover,
a.rmRootLink:hover {
    background-color: rgba(255,255,255,0.2) !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
}

/* ROOT NAV ONLY - White text (NOT dropdowns, NOT buttons) */
/* Use very specific selectors for root level items only */
.RadMenu > .rmRootGroup > .rmItem > a.rmLink,
.RadMenu > .rmRootGroup > .rmItem > a.rmLink > .rmText,
.RadMenu > .rmRootGroup > .rmItem > a.rmLink > span,
.RadMenu_Austin > .rmRootGroup > .rmItem > a.rmLink,
.RadMenu_Austin > .rmRootGroup > .rmItem > a.rmLink > .rmText,
.RadMenu_Austin > .rmRootGroup > .rmItem > a.rmLink > span,
.header-bottom-container > .RadMenu > .rmRootGroup > .rmItem > a,
.header-bottom-container > .RadMenu > .rmRootGroup > .rmItem > a > span {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    background-color: transparent !important;
    text-decoration: none !important;
}

/* Nav bar containers - blue background */
.PrimaryNavPanel,
[class*="NavPanel"],
[id*="NavPanel"],
.header-bottom-container {
    background-color: #164F90 !important;
}

/* KEEP header/banner area WHITE - not blue */
#hd, .header, header {
    background-color: #FFFFFF !important;
}

.header-top-container,
.header-container,
.header-logo-container,
#masterLogoArea {
    background-color: #FFFFFF !important;
}

/* FIX: Mobile nav - BLUE background, WHITE text for visibility */
@media (max-width: 767px) {
    /* Mobile banner - CROP to show only FOUNDERS (right side of image) */
    .header-logo-container,
    #masterLogoArea {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        text-align: center !important;
    }

    #masterHeaderImage,
    #masterDonorHeaderImage {
        display: block !important;
        visibility: visible !important;
        width: 200px !important;
        height: 70px !important;
        margin: 10px auto !important;
        background-size: auto 100% !important;
        background-position: right center !important;
        background-repeat: no-repeat !important;
    }

    #masterHeaderBackground {
        height: auto !important;
        min-height: 80px !important;
        padding: 5px !important;
    }

    /* Nav container */
    .RadMenu,
    .RadMenu_Austin,
    .rmRootGroup {
        background-color: #FFFFFF !important;
        border: 2px solid #164F90 !important;
        padding: 10px !important;
    }

    /* Nav items - blue background, white text */
    .RadMenu a.rmLink.rmRootLink,
    .RadMenu_Austin a.rmLink.rmRootLink {
        display: inline-block !important;
        background-color: #164F90 !important;
        color: #FFFFFF !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        padding: 10px 14px !important;
        margin: 4px !important;
        border-radius: 6px !important;
        border: none !important;
        text-transform: uppercase !important;
    }

    /* Selected/active - darker blue with white border */
    .RadMenu a.rmLink.rmRootLink.rmSelected,
    .RadMenu a.rmLink.rmRootLink.rmExpanded,
    .RadMenu a.rmLink.rmRootLink.rmFocused,
    .RadMenu_Austin a.rmLink.rmRootLink.rmSelected,
    .RadMenu_Austin a.rmLink.rmRootLink.rmExpanded {
        background-color: #0d3a6a !important;
        color: #FFFFFF !important;
        border: 2px solid #FFFFFF !important;
    }

    /* Hover state */
    .RadMenu a.rmLink.rmRootLink:hover,
    .RadMenu_Austin a.rmLink.rmRootLink:hover {
        background-color: #0d3a6a !important;
        color: #FFFFFF !important;
    }

    /* MOBILE SIGN OUT BUTTON - Must be visible */
    .auth-link-container {
        position: relative !important;
        top: auto !important;
        right: auto !important;
        display: block !important;
        text-align: center !important;
        margin: 10px 0 !important;
        z-index: 9999 !important;
    }

    a#ctl01_LoginStatus1,
    #ctl01_LoginStatus1,
    a[id*="LoginStatus"],
    a.auth-link,
    .auth-link-container a {
        display: inline-block !important;
        visibility: visible !important;
        opacity: 1 !important;
        padding: 8px 16px !important;
        margin: 5px !important;
        background-color: #FFFFFF !important;
        color: #164F90 !important;
        border: 2px solid #164F90 !important;
        border-radius: 10px !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        text-decoration: none !important;
        position: relative !important;
    }
}

/* Dropdown z-index fix */
.rmSlide, .rmGroup {
    z-index: 9999999 !important;
}

/* FIX: Sign In/Sign Up NavigationLink buttons - proper styling */
.NavigationLink,
a.NavigationLink {
    display: inline-block !important;
    visibility: visible !important;
    padding: 8px 16px !important;
    margin: 5px !important;
    background-color: transparent !important;
    color: #164F90 !important;
    border: 2px solid #164F90 !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    text-decoration: none !important;
    white-space: nowrap !important;
}

.NavigationLink:hover,
a.NavigationLink:hover {
    background-color: #164F90 !important;
    color: #FFFFFF !important;
}

/* FIX: Sign Out button container - position in TOP RIGHT */
.auth-link-container {
    position: fixed !important;
    top: 10px !important;
    right: 180px !important;
    z-index: 9999 !important;
    display: block !important;
    visibility: visible !important;
}

/* FIX: SIGN OUT, MARK, CART buttons - BLUE text, consistent 2px border */
#navbar-collapse .auth-link-container .auth-link,
#navbar-collapse .auth-link-container a.auth-link,
#navbar-collapse .auth-link-container a#ctl01_LoginStatus1,
.auth-link-container > a.auth-link,
.auth-link-container > a#ctl01_LoginStatus1,
#hd .auth-link-container a,
a#ctl01_LoginStatus1,
#ctl01_LoginStatus1,
a[id*="LoginStatus"],
a.auth-link,
a[id*="lnkUserName"],
a[id*="lnkCart"],
.TextButton,
a.TextButton {
    display: inline-block !important;
    visibility: visible !important;
    opacity: 1 !important;
    padding: 8px 16px !important;
    margin: 5px !important;
    background-color: transparent !important;
    color: #164F90 !important;
    border: 2px solid #164F90 !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    text-decoration: none !important;
    position: relative !important;
    z-index: 9999 !important;
    white-space: nowrap !important;
}

#navbar-collapse .auth-link-container a:hover,
a#ctl01_LoginStatus1:hover,
#ctl01_LoginStatus1:hover,
a[id*="LoginStatus"]:hover,
a.auth-link:hover,
a[id*="lnkUserName"]:hover,
a[id*="lnkCart"]:hover,
.TextButton:hover,
a.TextButton:hover {
    background-color: #164F90 !important;
    color: #FFFFFF !important;
}

/* header-bottom-container - make it blue to match nav */
.header-bottom-container {
    background-color: #164F90 !important;
}

/* Nav menu text - WHITE on blue background for readability */
.RadMenu a.rmLink.rmRootLink,
.RadMenu_Austin a.rmLink.rmRootLink,
.header-bottom-container .RadMenu a.rmLink {
    color: #FFFFFF !important;
    background-color: transparent !important;
    font-size: 11px !important;
    font-weight: 600 !important;
}

.RadMenu a.rmLink.rmRootLink:hover,
.RadMenu_Austin a.rmLink.rmRootLink:hover {
    background-color: rgba(255,255,255,0.2) !important;
    color: #FFFFFF !important;
}

/* DROPDOWN MENUS - DARK TEXT ON WHITE BACKGROUND */
/* High specificity selectors to override any other rules */
.RadMenu .rmSlide .rmLink,
.RadMenu .rmGroup .rmLink,
.RadMenu .rmSlide a.rmLink,
.RadMenu .rmGroup a.rmLink,
.RadMenu_Austin .rmSlide .rmLink,
.RadMenu_Austin .rmGroup .rmLink,
.RadMenu_Austin .rmSlide a.rmLink,
.RadMenu_Austin .rmGroup a.rmLink,
.rmSlide .rmItem a.rmLink,
.rmGroup .rmItem a.rmLink,
ul.rmGroup li a.rmLink,
div.rmSlide a,
div.rmSlide span,
ul.rmGroup a,
ul.rmGroup span,
.rmSlide .rmText,
.rmGroup .rmText {
    display: block !important;
    padding: 10px 15px !important;
    margin: 0 !important;
    color: #333333 !important;
    -webkit-text-fill-color: #333333 !important;
    background-color: #FFFFFF !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    text-decoration: none !important;
    border-bottom: 1px solid #e0e0e0 !important;
    white-space: nowrap !important;
}

.RadMenu .rmSlide .rmLink:hover,
.RadMenu .rmGroup .rmLink:hover,
.RadMenu_Austin .rmSlide .rmLink:hover,
.RadMenu_Austin .rmGroup .rmLink:hover,
.rmSlide .rmItem a.rmLink:hover,
.rmGroup .rmItem a.rmLink:hover {
    background-color: #164F90 !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
}

/* DROPDOWN CONTAINERS - White background with border */
.rmSlide,
.rmGroup,
ul.rmGroup,
div.rmSlide {
    background-color: #FFFFFF !important;
    border: 2px solid #164F90 !important;
    border-radius: 4px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    min-width: 200px !important;
    padding: 0 !important;
    margin-top: 2px !important;
    z-index: 999999 !important;
}

/* Third level submenu items */
.rmSlide .rmSlide .rmLink,
.rmGroup .rmGroup .rmLink,
.rmSlide .rmSlide .rmText,
.rmGroup .rmGroup .rmText {
    padding-left: 25px !important;
    font-size: 12px !important;
    color: #333333 !important;
    -webkit-text-fill-color: #333333 !important;
}

/* NESTED DROPDOWNS - z-index only, let Telerik handle positioning */
.rmSlide,
.rmGroup,
.rmGroup .rmGroup,
.rmSlide .rmSlide {
    z-index: 9999999 !important;
}
`;

async function takeScreenshot(page, name, viewport = 'desktop') {
    const filepath = path.join(SCREENSHOTS_DIR, `override-${viewport}-${name}-${Date.now()}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`  Screenshot: ${filepath}`);
    return filepath;
}

async function injectCSS(page) {
    await page.evaluate((css) => {
        const style = document.createElement('style');
        style.id = 'css-override-test';
        style.textContent = css;
        document.head.appendChild(style);
    }, CSS_OVERRIDES);
    console.log('  CSS overrides injected');
}

async function testPages() {
    console.log('Launching Chrome FULLSCREEN with CSS override testing...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    page.on('dialog', async dialog => {
        console.log(`  Dialog: ${dialog.type()}`);
        await dialog.accept();
    });

    try {
        // ============================================================
        // WIDE DESKTOP (1920px)
        // ============================================================
        console.log('\n' + '='.repeat(60));
        console.log('WIDE DESKTOP TESTING (1920px) WITH CSS OVERRIDES');
        console.log('='.repeat(60));

        // Login page
        console.log('\n=== Login Page (Wide) ===');
        await page.goto(PAGES.login, { waitUntil: 'networkidle2', timeout: 30000 });

        // Debug: Log header structure
        const headerInfo = await page.evaluate(() => {
            const hd = document.querySelector('#hd');
            const headerBg = document.querySelector('#masterHeaderBackground');
            const headerImg = document.querySelector('#masterHeaderImage');
            return {
                hdExists: !!hd,
                hdHTML: hd ? hd.outerHTML.substring(0, 500) : 'NOT FOUND',
                headerBgExists: !!headerBg,
                headerImgExists: !!headerImg
            };
        });
        console.log('  Header Debug:', JSON.stringify(headerInfo, null, 2));

        await injectCSS(page);
        await wait(1000);

        // Debug login page nav structure
        const loginNavDebug = await page.evaluate(() => {
            const navItems = document.querySelectorAll('.rmLink, .rmRootLink, [class*="Nav"] a, .header-bottom-container a');
            const items = [];
            navItems.forEach((item, i) => {
                if (i < 5) {
                    const style = window.getComputedStyle(item);
                    items.push({
                        tag: item.tagName,
                        class: item.className,
                        text: item.textContent.trim().substring(0, 20),
                        color: style.color,
                        bgColor: style.backgroundColor,
                        webkitFill: style.webkitTextFillColor
                    });
                }
            });
            return items;
        });
        console.log('  Login Nav Debug:', JSON.stringify(loginNavDebug, null, 2));

        await takeScreenshot(page, '01-login', 'wide');

        if (username && password) {
            // Login
            console.log('\n=== Logging in ===');
            await page.evaluate((user, pass) => {
                const usernameField = document.querySelector('input[id*="signInUserName"]');
                const passwordField = document.querySelector('input[type="password"]');
                if (usernameField) usernameField.value = user;
                if (passwordField) passwordField.value = pass;
            }, username, password);
            await wait(500);
            await page.evaluate(() => {
                const btn = document.querySelector('input[type="submit"]');
                if (btn) btn.click();
            });
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
            await wait(2000);

            await injectCSS(page);
            await wait(500);

            console.log('\n=== Home (Wide) ===');

            // Debug: Find Sign Out button and its parent container
            const signOutInfo = await page.evaluate(() => {
                const el = document.querySelector('#ctl01_LoginStatus1');
                if (!el) return { error: 'Sign Out element not found' };

                // Walk up the DOM to find what's hiding it
                const ancestry = [];
                let current = el;
                for (let i = 0; i < 10 && current; i++) {
                    const style = window.getComputedStyle(current);
                    ancestry.push({
                        tag: current.tagName,
                        id: current.id,
                        class: current.className,
                        display: style.display,
                        visibility: style.visibility,
                        position: style.position
                    });
                    current = current.parentElement;
                }

                // Also capture the nav bar right side area
                const navPanel = document.querySelector('[id*="NavPanel"]');
                const navPanelStyle = navPanel ? window.getComputedStyle(navPanel) : null;

                return {
                    signOutAncestry: ancestry,
                    navPanel: navPanel ? {
                        id: navPanel.id,
                        class: navPanel.className,
                        bgColor: navPanelStyle.backgroundColor,
                        width: navPanelStyle.width
                    } : 'NOT FOUND'
                };
            });
            console.log('  Sign Out Debug:', JSON.stringify(signOutInfo, null, 2));

            await takeScreenshot(page, '02-home', 'wide');

            console.log('\n=== Education (Wide) ===');
            await page.goto(PAGES.education, { waitUntil: 'networkidle2', timeout: 30000 });
            await injectCSS(page);
            await wait(1000);

            // Debug nav styles
            const navDebug = await page.evaluate(() => {
                const navLink = document.querySelector('.rmLink.rmRootLink');
                const navText = document.querySelector('.rmLink.rmRootLink .rmText');
                const navContainer = document.querySelector('.RadMenu');
                return {
                    navLink: navLink ? {
                        color: window.getComputedStyle(navLink).color,
                        bgColor: window.getComputedStyle(navLink).backgroundColor,
                        classes: navLink.className
                    } : 'NOT FOUND',
                    navText: navText ? {
                        color: window.getComputedStyle(navText).color,
                        innerHTML: navText.innerHTML
                    } : 'NOT FOUND',
                    navContainer: navContainer ? {
                        bgColor: window.getComputedStyle(navContainer).backgroundColor
                    } : 'NOT FOUND'
                };
            });
            console.log('  Nav Debug:', JSON.stringify(navDebug, null, 2));

            await takeScreenshot(page, '03-education', 'wide');

            console.log('\n=== Community (Wide) ===');
            await page.goto(PAGES.community, { waitUntil: 'networkidle2', timeout: 30000 });
            await injectCSS(page);
            await wait(1000);
            await takeScreenshot(page, '04-community', 'wide');

            // Account page testing
            console.log('\n=== Account Page (Wide) ===');
            await page.goto(PAGES.account, { waitUntil: 'networkidle2', timeout: 30000 });
            await injectCSS(page);
            await wait(1000);
            await takeScreenshot(page, '05-account', 'wide');

            // Test dropdown menus - hover over STAFF nav item to show submenu
            console.log('\n=== Testing Nav Dropdown - Hover over STAFF ===');
            await injectCSS(page);
            await wait(500);

            // Find and hover over STAFF to show dropdown
            const staffLink = await page.evaluateHandle(() => {
                const links = document.querySelectorAll('a.rmLink.rmRootLink');
                for (const link of links) {
                    if (link.textContent.toLowerCase().includes('staff')) {
                        return link;
                    }
                }
                return links[0]; // fallback to first link
            });
            if (staffLink) {
                await staffLink.hover();
                await wait(2000);
                await takeScreenshot(page, '06-nav-dropdown-STAFF', 'wide');

                // Hover over "Reports" submenu item to show level 2
                console.log('\n=== Testing Nav Dropdown Level 2 - Hover over Reports ===');
                try {
                    const reportsLink = await page.evaluateHandle(() => {
                        const links = document.querySelectorAll('.rmSlide .rmLink, .rmGroup .rmLink');
                        for (const link of links) {
                            if (link.textContent.toLowerCase().includes('report')) {
                                return link;
                            }
                        }
                        return links[0]; // fallback
                    });
                    if (reportsLink) {
                        await reportsLink.hover();
                        await wait(2000);
                        await takeScreenshot(page, '07-nav-dropdown-REPORTS', 'wide');
                    }
                } catch (e) {
                    console.log('  Dropdown L2 hover failed:', e.message);
                }
            }

            // ============================================================
            // MOBILE (375px)
            // ============================================================
            console.log('\n' + '='.repeat(60));
            console.log('MOBILE TESTING (375px) WITH CSS OVERRIDES');
            console.log('='.repeat(60));

            await page.setViewport(VIEWPORTS.mobile);
            await wait(1000);

            // Re-login at mobile
            console.log('\n=== Login Page (Mobile) ===');
            await page.goto(PAGES.login, { waitUntil: 'networkidle2', timeout: 30000 });
            await injectCSS(page);
            await wait(1000);
            await takeScreenshot(page, '01-login', 'mobile');

            await page.evaluate((user, pass) => {
                const usernameField = document.querySelector('input[id*="signInUserName"]');
                const passwordField = document.querySelector('input[type="password"]');
                if (usernameField) usernameField.value = user;
                if (passwordField) passwordField.value = pass;
            }, username, password);
            await wait(500);
            await page.evaluate(() => {
                const btn = document.querySelector('input[type="submit"]');
                if (btn) btn.click();
            });
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
            await wait(2000);

            await injectCSS(page);
            await wait(500);

            console.log('\n=== Home (Mobile) ===');
            await takeScreenshot(page, '02-home', 'mobile');

            console.log('\n=== Education (Mobile) ===');
            await page.goto(PAGES.education, { waitUntil: 'networkidle2', timeout: 30000 });
            await injectCSS(page);
            await wait(1000);
            await takeScreenshot(page, '03-education', 'mobile');
        }

        console.log('\n' + '='.repeat(60));
        console.log('CSS OVERRIDE TESTING COMPLETE');
        console.log('='.repeat(60));
        console.log('\nReview the "override-*" screenshots to verify fixes.');

    } catch (error) {
        console.error('Error:', error.message);
        await takeScreenshot(page, 'error', 'desktop');
    }

    console.log('\nBrowser open for 15 seconds...');
    await wait(15000);
    await browser.close();
}

testPages();
