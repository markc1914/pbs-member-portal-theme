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

    await page.addStyleTag({ content: localCss });
    await new Promise(r => setTimeout(r, 500));

    // Get all elements between sign out and nav menu
    const result = await page.evaluate(() => {
        const navMenu = document.querySelector('.PrimaryNavPanel, .header-bottom-container, #hd .RadMenu');
        if (!navMenu) return { error: 'No nav menu found' };
        
        const navRect = navMenu.getBoundingClientRect();
        
        // Find all elements that have a border and are above the nav menu
        const elementsWithBorder = [];
        const allElements = document.querySelectorAll('#hd *, header *, .navbar *');
        
        allElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            
            // Check if element is in the area above the nav menu
            if (rect.bottom <= navRect.top + 10 && rect.bottom > navRect.top - 50) {
                const borderBottom = style.borderBottomWidth;
                const borderBottomColor = style.borderBottomColor;
                
                if (borderBottom && borderBottom !== '0px') {
                    elementsWithBorder.push({
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        borderBottom: style.borderBottom,
                        rectBottom: rect.bottom,
                        navTop: navRect.top
                    });
                }
            }
        });
        
        // Also check the navbar-collapse and similar containers
        const containers = document.querySelectorAll('.navbar-collapse, .nav-primary, #navbar-collapse, .collapse');
        containers.forEach(el => {
            const style = getComputedStyle(el);
            elementsWithBorder.push({
                tag: el.tagName,
                id: el.id || 'no-id',
                className: el.className,
                borderBottom: style.borderBottom,
                type: 'container'
            });
        });
        
        return { elementsWithBorder, navTop: navRect.top };
    });

    console.log(JSON.stringify(result, null, 2));
    await browser.close();
})();
