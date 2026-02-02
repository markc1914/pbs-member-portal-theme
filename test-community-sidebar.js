const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { getCredentials } = require('./test-config');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const COMMUNITY_URL = 'https://members.phibetasigma1914.org/iMISDEV/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=33451093-a35b-433d-9b88-4337ac3ed9b3&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

(async () => {
    // Load local CSS
    let baseCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    baseCss = baseCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({
        headless: false,
        protocolTimeout: 60000
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Handle dialogs
    page.on('dialog', async dialog => {
        console.log('[DIALOG] Accepting...');
        await dialog.accept();
    });

    // Login
    console.log('=== LOGGING IN ===');
    const { username, password } = getCredentials();
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await new Promise(r => setTimeout(r, 6000));
    console.log('Logged in!');

    // Go to Community page
    console.log('\n=== NAVIGATING TO COMMUNITY PAGE ===');
    await page.goto(COMMUNITY_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Current URL:', page.url());

    // Screenshot BEFORE any CSS changes (site's current CSS)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'community-before-fix.png'), fullPage: true });
    console.log('Screenshot saved: community-before-fix.png');

    // Analyze page structure
    console.log('\n=== ANALYZING PAGE STRUCTURE ===');
    const structure = await page.evaluate(() => {
        const results = {
            sidebar: null,
            mainContent: null,
            layoutContainers: [],
            yuiLayout: null
        };

        // Find sidebar
        const sidebarSelectors = [
            '#masterSideBarPanel',
            '.SideBar',
            '.sidebar',
            '#sidebar',
            '[class*="sidebar"]',
            '[class*="Sidebar"]',
            '.LeftColumn',
            '.left-column',
            '#yui-main + *'
        ];

        for (const sel of sidebarSelectors) {
            const el = document.querySelector(sel);
            if (el) {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                results.sidebar = {
                    selector: sel,
                    id: el.id,
                    className: el.className,
                    display: style.display,
                    float: style.float,
                    position: style.position,
                    width: style.width,
                    top: rect.top,
                    left: rect.left,
                    innerHTML: el.innerHTML.substring(0, 500)
                };
                break;
            }
        }

        // Find main content
        const mainSelectors = ['#yui-main', '#masterContentArea', '.MainContent', '.main-content', '#content'];
        for (const sel of mainSelectors) {
            const el = document.querySelector(sel);
            if (el) {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                results.mainContent = {
                    selector: sel,
                    id: el.id,
                    className: el.className,
                    display: style.display,
                    float: style.float,
                    width: style.width,
                    top: rect.top,
                    left: rect.left
                };
                break;
            }
        }

        // Find YUI layout structure
        const bd = document.querySelector('#bd');
        if (bd) {
            const style = getComputedStyle(bd);
            results.yuiLayout = {
                id: bd.id,
                display: style.display,
                flexDirection: style.flexDirection,
                children: Array.from(bd.children).map(c => ({
                    tag: c.tagName,
                    id: c.id,
                    className: c.className.substring(0, 100),
                    float: getComputedStyle(c).float,
                    display: getComputedStyle(c).display,
                    width: getComputedStyle(c).width,
                    order: getComputedStyle(c).order
                }))
            };
        }

        // Check for any layout containers
        const layoutEls = document.querySelectorAll('[class*="yui"], [class*="grid"], [class*="row"], [class*="col"]');
        layoutEls.forEach(el => {
            if (results.layoutContainers.length < 10) {
                results.layoutContainers.push({
                    tag: el.tagName,
                    id: el.id,
                    className: el.className.substring(0, 100)
                });
            }
        });

        return results;
    });

    console.log('\nSidebar:', JSON.stringify(structure.sidebar, null, 2));
    console.log('\nMain Content:', JSON.stringify(structure.mainContent, null, 2));
    console.log('\nYUI Layout (#bd):', JSON.stringify(structure.yuiLayout, null, 2));

    // Inject base CSS
    console.log('\n=== INJECTING LOCAL CSS ===');
    await page.addStyleTag({ content: baseCss });
    await new Promise(r => setTimeout(r, 1000));

    // Screenshot with current local CSS
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'community-with-local-css.png'), fullPage: true });
    console.log('Screenshot saved: community-with-local-css.png');

    // Re-analyze after CSS injection
    const afterCss = await page.evaluate(() => {
        const sidebar = document.querySelector('#masterSideBarPanel') || document.querySelector('[class*="sidebar"]');
        const main = document.querySelector('#yui-main');

        if (sidebar && main) {
            const sidebarRect = sidebar.getBoundingClientRect();
            const mainRect = main.getBoundingClientRect();
            const sidebarStyle = getComputedStyle(sidebar);
            const mainStyle = getComputedStyle(main);

            return {
                sidebarTop: sidebarRect.top,
                sidebarLeft: sidebarRect.left,
                sidebarWidth: sidebarStyle.width,
                sidebarDisplay: sidebarStyle.display,
                sidebarFloat: sidebarStyle.float,
                mainTop: mainRect.top,
                mainLeft: mainRect.left,
                mainWidth: mainStyle.width,
                sidebarBelowMain: sidebarRect.top > mainRect.bottom
            };
        }
        return null;
    });

    console.log('\nAfter local CSS:', JSON.stringify(afterCss, null, 2));
    if (afterCss?.sidebarBelowMain) {
        console.log('>>> PROBLEM: Sidebar is BELOW main content! <<<');
    }

    // Try CSS fix
    console.log('\n=== TESTING CSS FIX ===');
    const sidebarFix = `
    /* =====================================================
       COMMUNITY PAGE SIDEBAR FIX - Issue #16
       ===================================================== */

    /* Ensure #bd uses proper layout for sidebar */
    #bd {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: flex-start !important;
    }

    /* Sidebar container */
    #masterSideBarPanel {
        display: block !important;
        width: 250px !important;
        min-width: 250px !important;
        max-width: 250px !important;
        flex-shrink: 0 !important;
        order: 1 !important;
        float: none !important;
        margin-right: 20px !important;
    }

    /* Main content area */
    #yui-main {
        display: block !important;
        flex: 1 !important;
        order: 2 !important;
        float: none !important;
        width: auto !important;
        min-width: 0 !important;
    }

    /* Ensure sidebar content is visible and readable */
    #masterSideBarPanel * {
        color: inherit;
    }

    #masterSideBarPanel a {
        color: var(--pbs-blue, #164F90) !important;
    }

    #masterSideBarPanel .PanelHead,
    #masterSideBarPanel h3,
    #masterSideBarPanel h4 {
        color: #333 !important;
        font-weight: 600 !important;
    }

    /* Make sure header and footer are not affected */
    #hd, #ft {
        display: block !important;
        width: 100% !important;
        flex: none !important;
    }
    `;

    await page.addStyleTag({ content: sidebarFix });
    await new Promise(r => setTimeout(r, 1000));

    // Screenshot after fix
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'community-after-fix.png'), fullPage: true });
    console.log('Screenshot saved: community-after-fix.png');

    // Verify fix worked
    const afterFix = await page.evaluate(() => {
        const sidebar = document.querySelector('#masterSideBarPanel');
        const main = document.querySelector('#yui-main');
        const header = document.querySelector('#hd');
        const footer = document.querySelector('#ft');

        const results = {};

        if (sidebar && main) {
            const sidebarRect = sidebar.getBoundingClientRect();
            const mainRect = main.getBoundingClientRect();

            results.sidebar = {
                top: sidebarRect.top,
                left: sidebarRect.left,
                width: sidebarRect.width,
                visible: sidebarRect.width > 0 && sidebarRect.height > 0
            };
            results.main = {
                top: mainRect.top,
                left: mainRect.left,
                width: mainRect.width
            };
            results.sidebarIsActuallySidebar = sidebarRect.left < mainRect.left &&
                                                Math.abs(sidebarRect.top - mainRect.top) < 100;
        }

        if (header) {
            const rect = header.getBoundingClientRect();
            results.header = { top: rect.top, height: rect.height };
        }

        if (footer) {
            const rect = footer.getBoundingClientRect();
            results.footer = { top: rect.top };
        }

        return results;
    });

    console.log('\nAfter fix:', JSON.stringify(afterFix, null, 2));

    if (afterFix.sidebarIsActuallySidebar) {
        console.log('✓ SUCCESS: Sidebar is now a proper sidebar!');
    } else {
        console.log('✗ FAILED: Sidebar is still not properly positioned');
    }

    if (afterFix.header?.top >= 0) {
        console.log('✓ Header is in position');
    }

    console.log('\n=== CHECKING OTHER PAGES ===');

    // Check home page to make sure we didn't break it
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    await page.addStyleTag({ content: baseCss });
    await page.addStyleTag({ content: sidebarFix });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'home-with-sidebar-fix.png'), fullPage: true });
    console.log('Screenshot saved: home-with-sidebar-fix.png');

    console.log('\nBrowser open for 30 seconds for inspection...');
    await new Promise(r => setTimeout(r, 30000));

    await browser.close();
})();
