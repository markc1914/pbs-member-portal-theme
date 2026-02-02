const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';

(async () => {
    // Load local CSS
    let localCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    localCss = localCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    page.on('dialog', async d => await d.accept());

    await page.goto('https://members.phibetasigma1914.org/iMISdev/', { waitUntil: 'networkidle2' });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'REDACTED_USER');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'REDACTED_PASSWORD');
    await page.evaluate(() => document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton').click());
    await new Promise(r => setTimeout(r, 5000));

    // Inject local CSS
    console.log('Injecting local CSS...');
    await page.addStyleTag({ content: localCss });
    await new Promise(r => setTimeout(r, 500));

    // Debug nav bar borders
    const borders = await page.evaluate(() => {
        const results = {};

        // Check nav panel
        const navPanel = document.querySelector('.PrimaryNavPanel, #ctl01_NavPanel, [id*="NavPanel"]');
        if (navPanel) {
            const style = getComputedStyle(navPanel);
            results.navPanel = {
                border: style.border,
                borderTop: style.borderTop,
                borderRight: style.borderRight,
                borderBottom: style.borderBottom,
                outline: style.outline,
                boxShadow: style.boxShadow
            };
        }

        // Check RadMenu
        const radMenu = document.querySelector('#hd .RadMenu, #hd .RadMenu_Austin');
        if (radMenu) {
            const style = getComputedStyle(radMenu);
            results.radMenu = {
                border: style.border,
                borderTop: style.borderTop,
                borderRight: style.borderRight,
                outline: style.outline
            };
        }

        // Check rmRootGroup
        const rootGroup = document.querySelector('#hd .rmRootGroup');
        if (rootGroup) {
            const style = getComputedStyle(rootGroup);
            results.rmRootGroup = {
                border: style.border,
                borderTop: style.borderTop,
                borderRight: style.borderRight,
                outline: style.outline
            };
        }

        // Check rmHorizontal
        const rmHorizontal = document.querySelector('#hd .rmHorizontal');
        if (rmHorizontal) {
            const style = getComputedStyle(rmHorizontal);
            results.rmHorizontal = {
                border: style.border,
                borderTop: style.borderTop,
                borderRight: style.borderRight
            };
        }

        // Check individual nav items
        const items = document.querySelectorAll('#hd .rmRootGroup > .rmItem');
        results.itemCount = items.length;
        if (items.length > 0) {
            const firstStyle = getComputedStyle(items[0]);
            const lastStyle = getComputedStyle(items[items.length - 1]);
            results.firstItem = {
                borderLeft: firstStyle.borderLeft,
                borderRight: firstStyle.borderRight,
                borderTop: firstStyle.borderTop
            };
            results.lastItem = {
                borderLeft: lastStyle.borderLeft,
                borderRight: lastStyle.borderRight,
                borderTop: lastStyle.borderTop,
                className: items[items.length - 1].className
            };
        }

        // Check header-bottom-container
        const headerBottom = document.querySelector('.header-bottom-container');
        if (headerBottom) {
            const style = getComputedStyle(headerBottom);
            results.headerBottomContainer = {
                border: style.border,
                borderTop: style.borderTop
            };
        }

        // Check for any element with visible border in nav area
        const allNavElements = document.querySelectorAll('#hd .RadMenu *, #hd .RadMenu, .PrimaryNavPanel, .PrimaryNavPanel *');
        results.elementsWithBorder = [];
        allNavElements.forEach(el => {
            const style = getComputedStyle(el);
            if (style.borderTopWidth !== '0px' || style.borderRightWidth !== '0px' ||
                style.borderBottomWidth !== '0px' || style.borderLeftWidth !== '0px') {
                if (!style.border.includes('0px')) {
                    results.elementsWithBorder.push({
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        borderTop: style.borderTop,
                        borderRight: style.borderRight,
                        borderBottom: style.borderBottom,
                        borderLeft: style.borderLeft
                    });
                }
            }
        });

        return results;
    });

    console.log(JSON.stringify(borders, null, 2));

    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
