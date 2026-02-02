const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';

(async () => {
    let localCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    localCss = localCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    page.on('dialog', async d => await d.accept());

    await page.goto('https://members.phibetasigma1914.org/iMISdev/', { waitUntil: 'networkidle2' });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'kingboot');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'pbs1914');
    await page.evaluate(() => document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton').click());
    await new Promise(r => setTimeout(r, 5000));

    console.log('Injecting local CSS...');
    await page.addStyleTag({ content: localCss });
    await new Promise(r => setTimeout(r, 500));

    // Check nav button styling
    const buttonStyles = await page.evaluate(() => {
        const links = document.querySelectorAll('#hd .rmRootGroup > .rmItem > a.rmLink');
        const results = [];
        
        links.forEach((link, i) => {
            const style = getComputedStyle(link);
            if (i < 3) { // Just check first 3
                results.push({
                    text: link.textContent.trim(),
                    border: style.border,
                    borderTop: style.borderTop,
                    borderRight: style.borderRight,
                    borderBottom: style.borderBottom,
                    borderLeft: style.borderLeft,
                    background: style.background,
                    backgroundColor: style.backgroundColor,
                    boxShadow: style.boxShadow,
                    outline: style.outline,
                    padding: style.padding,
                    margin: style.margin
                });
            }
        });
        
        return results;
    });

    console.log(JSON.stringify(buttonStyles, null, 2));

    // Take a close-up screenshot of the nav bar
    const navBar = await page.$('#hd .RadMenu, .PrimaryNavPanel');
    if (navBar) {
        await navBar.screenshot({ path: 'testingScreenshots/nav-buttons-closeup.png' });
        console.log('Saved: nav-buttons-closeup.png');
    }

    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
