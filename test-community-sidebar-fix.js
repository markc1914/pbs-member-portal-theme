const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const COMMUNITY_URL = 'https://members.phibetasigma1914.org/iMISDEV/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=33451093-a35b-433d-9b88-4337ac3ed9b3&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

const SIDEBAR_FIX_CSS = `
/* =====================================================
   COMMUNITY PAGE SIDEBAR FIX - Issue #16
   Make sidebar appear on the right instead of bottom
   ===================================================== */

/* The body-container holds both main content and sidebar */
.body-container {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: flex-start !important;
    gap: 20px !important;
}

/* Main content area - takes remaining space */
.body-container > .row:first-of-type,
.body-container > div:not(.col-secondary):not(.NotPrinted):first-child {
    flex: 1 !important;
    min-width: 0 !important;
    order: 1 !important;
}

/* Sidebar - fixed width on the right */
.col-secondary,
#ctl01_SubNavPanel {
    display: block !important;
    width: 280px !important;
    min-width: 280px !important;
    max-width: 280px !important;
    flex-shrink: 0 !important;
    order: 2 !important;
    float: none !important;
    padding: 15px !important;
    background-color: #f8f9fa !important;
    border-radius: 8px !important;
    border: 1px solid #e0e0e0 !important;
}

/* Ensure sidebar content is readable */
.col-secondary *,
#ctl01_SubNavPanel * {
    max-width: 100% !important;
    word-wrap: break-word !important;
}

.col-secondary a,
#ctl01_SubNavPanel a {
    color: var(--pbs-blue, #164F90) !important;
    text-decoration: none !important;
}

.col-secondary a:hover,
#ctl01_SubNavPanel a:hover {
    text-decoration: underline !important;
}

.col-secondary h3,
.col-secondary h4,
.col-secondary .PanelHead,
#ctl01_SubNavPanel h3,
#ctl01_SubNavPanel h4 {
    color: #333 !important;
    font-weight: 600 !important;
    margin-bottom: 10px !important;
    font-size: 14px !important;
}

/* Community logo in sidebar */
.col-secondary img,
#ctl01_SubNavPanel img {
    max-width: 100% !important;
    height: auto !important;
    border-radius: 4px !important;
}

/* Community sidebar title */
.CommunitySideBarTitle {
    font-weight: 600 !important;
    margin-bottom: 10px !important;
}

/* Community links block */
.CommunityLinksBlock {
    margin-top: 10px !important;
}

.CommunityLinksBlock a {
    display: block !important;
    padding: 5px 0 !important;
    border-bottom: 1px solid #eee !important;
}

/* Scope to community pages only - don't break other pages */
.wrapper:not(.has-secondary-col) .body-container {
    display: block !important;
}

/* Make sure header and footer are NOT affected */
#hd, #ft, header, footer,
#ctl01_headerWrapper,
#ctl01_footerWrapper {
    display: block !important;
    width: 100% !important;
    flex: none !important;
}

/* Mobile: Stack sidebar below content */
@media (max-width: 991px) {
    .body-container {
        flex-direction: column !important;
    }

    .col-secondary,
    #ctl01_SubNavPanel {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 100% !important;
        order: 2 !important;
        margin-top: 20px !important;
    }
}
`;

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

    page.on('dialog', async dialog => {
        console.log('[DIALOG] Accepting...');
        await dialog.accept();
    });

    // Login
    console.log('=== LOGGING IN ===');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'REDACTED_USER');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'REDACTED_PASSWORD');
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await new Promise(r => setTimeout(r, 6000));
    console.log('Logged in!');

    // Go to Community page
    console.log('\n=== NAVIGATING TO COMMUNITY PAGE ===');
    try {
        await page.goto(COMMUNITY_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
        console.log('Navigation note:', e.message);
        await new Promise(r => setTimeout(r, 3000));
    }
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot BEFORE fix
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'community-1-before.png'), fullPage: true });
    console.log('Screenshot: community-1-before.png (no CSS)');

    // Inject base CSS only
    await page.addStyleTag({ content: baseCss });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'community-2-base-css.png'), fullPage: true });
    console.log('Screenshot: community-2-base-css.png (base CSS only)');

    // Inject sidebar fix
    await page.addStyleTag({ content: SIDEBAR_FIX_CSS });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'community-3-with-fix.png'), fullPage: true });
    console.log('Screenshot: community-3-with-fix.png (with sidebar fix)');

    // Verify fix worked
    const verification = await page.evaluate(() => {
        const sidebar = document.querySelector('#ctl01_SubNavPanel') || document.querySelector('.col-secondary');
        const bodyContainer = document.querySelector('.body-container');
        const header = document.querySelector('#hd') || document.querySelector('header');
        const footer = document.querySelector('#ft') || document.querySelector('footer');

        const results = {};

        if (sidebar) {
            const rect = sidebar.getBoundingClientRect();
            const style = getComputedStyle(sidebar);
            results.sidebar = {
                top: Math.round(rect.top),
                left: Math.round(rect.left),
                width: Math.round(rect.width),
                display: style.display
            };
        }

        if (bodyContainer) {
            const style = getComputedStyle(bodyContainer);
            results.bodyContainer = {
                display: style.display,
                flexDirection: style.flexDirection
            };
        }

        if (header) {
            const rect = header.getBoundingClientRect();
            results.header = { top: Math.round(rect.top), height: Math.round(rect.height) };
        }

        if (footer) {
            const rect = footer.getBoundingClientRect();
            results.footer = { top: Math.round(rect.top) };
        }

        // Check if sidebar is actually on the side (left < 900 and top similar to content)
        const mainContent = document.querySelector('.body-container > .row:first-of-type');
        if (mainContent && sidebar) {
            const mainRect = mainContent.getBoundingClientRect();
            const sidebarRect = sidebar.getBoundingClientRect();
            results.sidebarOnRight = sidebarRect.left > mainRect.right - 50;
            results.sidebarAligned = Math.abs(sidebarRect.top - mainRect.top) < 100;
        }

        return results;
    });

    console.log('\n=== VERIFICATION ===');
    console.log(JSON.stringify(verification, null, 2));

    if (verification.sidebarOnRight && verification.sidebarAligned) {
        console.log('✓ SUCCESS: Sidebar is on the right and aligned!');
    } else if (verification.sidebar?.left > 800) {
        console.log('✓ PARTIAL: Sidebar appears to be on the right');
    } else {
        console.log('✗ ISSUE: Sidebar may not be properly positioned');
    }

    if (verification.header?.top === 0) {
        console.log('✓ Header is at top');
    }

    // Test on HOME page to make sure we didn't break it
    console.log('\n=== TESTING HOME PAGE (ensure no breakage) ===');
    try {
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
        await new Promise(r => setTimeout(r, 3000));
    }
    await new Promise(r => setTimeout(r, 2000));

    await page.addStyleTag({ content: baseCss });
    await page.addStyleTag({ content: SIDEBAR_FIX_CSS });
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'home-with-community-fix.png'), fullPage: true });
    console.log('Screenshot: home-with-community-fix.png');

    // Verify home page layout
    const homeCheck = await page.evaluate(() => {
        const header = document.querySelector('#hd');
        const footer = document.querySelector('#ft');
        return {
            headerTop: header ? header.getBoundingClientRect().top : null,
            footerExists: !!footer
        };
    });

    console.log('Home page check:', JSON.stringify(homeCheck));
    if (homeCheck.headerTop === 0) {
        console.log('✓ Home page header OK');
    }

    console.log('\n=== CSS FIX TO ADD TO pbs-theme.css ===');
    console.log(SIDEBAR_FIX_CSS);

    console.log('\nBrowser open for 30 seconds for inspection...');
    await new Promise(r => setTimeout(r, 30000));

    await browser.close();
})();
