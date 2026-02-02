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

    // Debug the area above nav menu
    const result = await page.evaluate(() => {
        const elements = [];
        
        // Check sign out area
        const signOutBtn = document.querySelector('#ctl01_LoginStatus1, [id*="LoginStatus"], .signout-btn, a[href*="Sign_Out"]');
        if (signOutBtn) {
            const parent = signOutBtn.parentElement;
            const grandparent = parent ? parent.parentElement : null;
            elements.push({
                name: 'signOutBtn',
                borderBottom: getComputedStyle(signOutBtn).borderBottom
            });
            if (parent) {
                elements.push({
                    name: 'signOutParent',
                    className: parent.className,
                    borderBottom: getComputedStyle(parent).borderBottom,
                    borderTop: getComputedStyle(parent).borderTop
                });
            }
            if (grandparent) {
                elements.push({
                    name: 'signOutGrandparent', 
                    className: grandparent.className,
                    borderBottom: getComputedStyle(grandparent).borderBottom
                });
            }
        }

        // Check nav panel area
        const navPanel = document.querySelector('.PrimaryNavPanel, #ctl01_NavPanel, .header-bottom-container');
        if (navPanel) {
            elements.push({
                name: 'navPanel',
                className: navPanel.className,
                borderTop: getComputedStyle(navPanel).borderTop,
                borderBottom: getComputedStyle(navPanel).borderBottom
            });
        }

        // Check RadMenu
        const radMenu = document.querySelector('#hd .RadMenu');
        if (radMenu) {
            elements.push({
                name: 'radMenu',
                className: radMenu.className,
                borderTop: getComputedStyle(radMenu).borderTop
            });
        }

        // Check auxiliary bar
        const auxBar = document.querySelector('#masterTopBarAuxiliary, .nav-auxiliary, .aux-container');
        if (auxBar) {
            elements.push({
                name: 'auxBar',
                className: auxBar.className,
                borderBottom: getComputedStyle(auxBar).borderBottom
            });
        }

        return elements;
    });

    console.log(JSON.stringify(result, null, 2));
    await browser.close();
})();
