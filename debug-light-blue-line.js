const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getCredentials } = require('./test-config');

const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';

(async () => {
    let localCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    localCss = localCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    page.on('dialog', async d => await d.accept());

    const { username, password } = getCredentials();
    await page.goto('https://members.phibetasigma1914.org/iMISdev/', { waitUntil: 'networkidle2' });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
    await page.evaluate(() => document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton').click());
    await new Promise(r => setTimeout(r, 6000));

    // Navigate to Account page
    await page.goto('https://members.phibetasigma1914.org/iMISDEV/PBSMember/My_Account_2/PBSMember/AccountPage.aspx?hkey=53f0d6d1-e7a3-4f97-87b5-d6d0a6a282f0', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Inject local CSS
    await page.addStyleTag({ content: localCss });
    await new Promise(r => setTimeout(r, 500));

    // Find the light blue line - check all elements in the header area for borders
    const result = await page.evaluate(() => {
        const findings = [];

        // Get the nav menu position
        const navMenu = document.querySelector('.RadMenu, .PrimaryNavPanel, #ctl01_NavPanel');
        const navRect = navMenu ? navMenu.getBoundingClientRect() : null;

        // Get header element position
        const header = document.querySelector('#hd, header');
        const headerRect = header ? header.getBoundingClientRect() : null;

        // Check all elements in the header area
        const elementsToCheck = document.querySelectorAll('#hd, #hd > *, #bd, #bd > *, header, header > *, .PrimaryNavPanel, .PrimaryNavPanel > *, #ctl01_NavPanel, #ctl01_NavPanel > *, .RadMenu, .RadMenu > *, .rmRootGroup, .navbar, .navbar > *, .header-bottom-container, .header-bottom-container > *, [class*="nav"], [class*="Nav"]');

        elementsToCheck.forEach(el => {
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();

            // Check for any border
            const borderBottom = style.borderBottom;
            const borderTop = style.borderTop;
            const boxShadow = style.boxShadow;

            // Only include if there's a visible border or it's near the nav menu bottom
            const hasBorder = (borderBottom && !borderBottom.includes('0px') && !borderBottom.includes('none')) ||
                             (borderTop && !borderTop.includes('0px') && !borderTop.includes('none')) ||
                             (boxShadow && boxShadow !== 'none');

            if (hasBorder || (navRect && Math.abs(rect.bottom - navRect.bottom) < 10)) {
                findings.push({
                    tag: el.tagName,
                    id: el.id || 'no-id',
                    className: el.className ? el.className.toString().substring(0, 60) : 'no-class',
                    borderBottom: borderBottom,
                    borderTop: borderTop,
                    boxShadow: boxShadow !== 'none' ? boxShadow : null,
                    rectBottom: Math.round(rect.bottom),
                    rectTop: Math.round(rect.top)
                });
            }
        });

        return {
            navMenuBottom: navRect ? Math.round(navRect.bottom) : null,
            headerBottom: headerRect ? Math.round(headerRect.bottom) : null,
            findings
        };
    });

    console.log('=== DEBUG: Light Blue Line Investigation ===');
    console.log('Nav menu bottom position:', result.navMenuBottom);
    console.log('Header bottom position:', result.headerBottom);
    console.log('\nElements with borders or near nav menu bottom:');
    console.log(JSON.stringify(result.findings, null, 2));

    // Also check the body content area top
    const bdResult = await page.evaluate(() => {
        const bd = document.querySelector('#bd');
        if (!bd) return null;

        const style = getComputedStyle(bd);
        return {
            borderTop: style.borderTop,
            marginTop: style.marginTop,
            paddingTop: style.paddingTop,
            boxShadow: style.boxShadow
        };
    });
    console.log('\n#bd (body) styles:', bdResult);

    // Check yui-main
    const yuiResult = await page.evaluate(() => {
        const yui = document.querySelector('#yui-main, .yui-b');
        if (!yui) return null;

        const style = getComputedStyle(yui);
        return {
            className: yui.className,
            borderTop: style.borderTop,
            boxShadow: style.boxShadow
        };
    });
    console.log('\n#yui-main styles:', yuiResult);

    // Check for any pseudo-elements with borders using a workaround
    const pseudoCheck = await page.evaluate(() => {
        // Can't directly check pseudo-elements, but look for common dividers
        const dividers = document.querySelectorAll('hr, [class*="divider"], [class*="Divider"], [class*="separator"], [class*="border"]');
        const results = [];
        dividers.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top > 50 && rect.top < 200) {
                results.push({
                    tag: el.tagName,
                    className: el.className,
                    top: rect.top
                });
            }
        });
        return results;
    });
    console.log('\nDivider elements in header area:', pseudoCheck);

    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
})();
