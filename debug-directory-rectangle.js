const puppeteer = require('puppeteer');
const { getCredentials } = require('./test-config');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const DIRECTORY_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/Membership/Directory/PBSMember/Directory.aspx?hkey=dedd1298-4a4a-4e0a-a0a8-e4bcc640c2cc';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function debugRectangle() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    page.on('dialog', async d => await d.accept());

    // Login
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    const { username, password } = getCredentials();
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
    await page.evaluate(() => document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton').click());
    await sleep(6000);

    // Go to Directory page
    await page.goto(DIRECTORY_URL, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Find elements in the right side area (x > 1000, y between 300-400)
    const elements = await page.evaluate(() => {
        const results = [];
        const allElements = document.querySelectorAll('*');

        allElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);

            // Look for elements in the right side of the page, near top of content
            if (rect.x > 1000 && rect.y > 300 && rect.y < 450 && rect.width > 50 && rect.height > 30) {
                // Check if it has a visible border or background
                const hasBorder = style.borderWidth !== '0px' && style.borderStyle !== 'none';
                const hasBg = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
                const hasRadius = style.borderRadius !== '0px';

                if (hasBorder || hasBg || hasRadius) {
                    results.push({
                        tag: el.tagName,
                        id: el.id || 'no-id',
                        className: el.className?.toString().substring(0, 80) || 'no-class',
                        x: Math.round(rect.x),
                        y: Math.round(rect.y),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        background: style.backgroundColor,
                        border: style.border,
                        borderRadius: style.borderRadius,
                        innerHTML: el.innerHTML?.substring(0, 100) || ''
                    });
                }
            }
        });

        return results;
    });

    console.log('=== Elements in right side area ===');
    console.log(JSON.stringify(elements, null, 2));

    await sleep(10000);
    await browser.close();
}

debugRectangle();
