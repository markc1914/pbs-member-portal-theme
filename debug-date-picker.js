const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { getCredentials } = require('./test-config');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const ACCOUNT_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/My_Account_2/PBSMember/AccountPage.aspx?hkey=53f0d6d1-e7a3-4f97-87b5-d6d0a6a282f0';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function debugDatePicker() {
    const { username, password } = getCredentials();

    let localCss = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    localCss = localCss.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);

    const browser = await puppeteer.launch({ headless: false, protocolTimeout: 120000 });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    page.on('dialog', async d => await d.accept());

    try {
        // Login
        console.log('Logging in...');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
        await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
        await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
        await page.evaluate(() => document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton').click());
        await sleep(6000);

        // Go to Account page (defaults to About Me / MY DEMOGRAPHICS)
        console.log('Navigating to Account page...');
        await page.goto(ACCOUNT_URL, { waitUntil: 'networkidle2' });
        await sleep(2000);

        // Screenshot before clicking Edit (no CSS)
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug-1-before-edit-no-css.png'), fullPage: false });
        console.log('Screenshot: debug-1-before-edit-no-css.png');

        // Find and click the Edit link
        console.log('Dumping ALL links on page...');
        const allLinkTexts = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('a').forEach(link => {
                const text = link.textContent?.trim();
                const rect = link.getBoundingClientRect();
                if (text && rect.y > 100 && rect.y < 500 && rect.width > 0) {
                    results.push({ text: text.substring(0, 30), x: Math.round(rect.x), y: Math.round(rect.y) });
                }
            });
            return results;
        });
        console.log('All visible links (y=100-500):');
        allLinkTexts.forEach(l => console.log(`  "${l.text}" at (${l.x}, ${l.y})`));

        const editLinkPositions = allLinkTexts.filter(l => l.text.includes('Edit'));
        console.log('Edit links found:', editLinkPositions);

        // Check for Edit in ANY element type
        console.log('\nSearching for Edit in ALL element types...');
        const editElements = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('*').forEach(el => {
                // Only check elements with direct text content
                const hasDirectText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent?.includes('Edit'));
                const text = el.textContent?.trim();
                const rect = el.getBoundingClientRect();
                if ((hasDirectText || (text && text === 'Edit')) && rect.y > 400 && rect.y < 550 && rect.width > 0) {
                    const style = getComputedStyle(el);
                    results.push({
                        tag: el.tagName,
                        text: text.substring(0, 30),
                        className: el.className?.substring(0, 40),
                        x: Math.round(rect.x),
                        y: Math.round(rect.y),
                        width: Math.round(rect.width),
                        display: style.display,
                        visibility: style.visibility
                    });
                }
            });
            return results;
        });
        console.log('All Edit elements:', editElements);

        // Click the Edit link using page.$$
        const links = await page.$$('a');
        let clicked = false;
        for (const link of links) {
            const text = await page.evaluate(el => el.textContent?.trim(), link);
            if (text === 'Edit') {
                const box = await link.boundingBox();
                if (box && box.y > 130 && box.y < 200) {
                    console.log(`Clicking Edit link at (${box.x}, ${box.y})`);
                    await link.click();
                    clicked = true;
                    break;
                }
            }
        }
        if (!clicked) {
            console.log('Could not find Edit link, trying all Edit links...');
            for (const link of links) {
                const text = await page.evaluate(el => el.textContent?.trim(), link);
                if (text === 'Edit') {
                    const box = await link.boundingBox();
                    if (box) {
                        console.log(`Clicking Edit link at (${box.x}, ${box.y})`);
                        await link.click();
                        clicked = true;
                        break;
                    }
                }
            }
        }
        console.log('Edit clicked:', clicked);
        await sleep(3000);

        // Screenshot after clicking Edit (no CSS) - should show edit form
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug-2-after-edit-no-css.png'), fullPage: false });
        console.log('Screenshot: debug-2-after-edit-no-css.png');

        // Analyze date picker HTML WITHOUT our CSS
        console.log('\n=== DATE PICKER HTML (WITHOUT OUR CSS) ===');
        const datePickerInfoNoCss = await page.evaluate(() => {
            const results = [];
            // Find Date of Birth field
            document.querySelectorAll('*').forEach(el => {
                const text = el.textContent || '';
                const id = el.id || '';
                if ((text.includes('Date of Birth') || id.toLowerCase().includes('dateofbirth') || id.toLowerCase().includes('birth')) &&
                    el.tagName !== 'HTML' && el.tagName !== 'BODY') {
                    const rect = el.getBoundingClientRect();
                    if (rect.height > 0 && rect.height < 50 && rect.y > 150 && rect.y < 400) {
                        const parent = el.closest('tr, div.PanelField');
                        if (parent) {
                            results.push({
                                fieldHTML: parent.outerHTML?.substring(0, 1500)
                            });
                        }
                    }
                }
            });
            return results;
        });
        console.log('Date picker HTML (no CSS):');
        datePickerInfoNoCss.forEach((info, i) => {
            console.log(`\n--- Field ${i + 1} HTML ---`);
            console.log(info.fieldHTML);
        });

        // Now inject our CSS
        console.log('\n=== INJECTING OUR CSS ===');
        await page.addStyleTag({ content: localCss });
        await sleep(500);

        // Screenshot after injecting CSS
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug-3-after-css.png'), fullPage: false });
        console.log('Screenshot: debug-3-after-css.png');

        // Analyze date picker visibility WITH our CSS
        const datePickerInfoWithCss = await page.evaluate(() => {
            const results = [];
            // Find inputs that look like date fields
            document.querySelectorAll('input[type="text"]').forEach(input => {
                const value = input.value || '';
                const id = input.id || '';
                // Check if it looks like a date
                if (value.match(/\d{1,2}\/\d{1,2}\/\d{4}/) || id.toLowerCase().includes('date') || id.toLowerCase().includes('birth')) {
                    const rect = input.getBoundingClientRect();
                    const style = getComputedStyle(input);
                    // Check for sibling/adjacent elements (date picker button)
                    const parent = input.closest('td, div, span');
                    const siblings = parent ? Array.from(parent.children) : [];
                    const siblingInfo = siblings.map(sib => {
                        const sibRect = sib.getBoundingClientRect();
                        const sibStyle = getComputedStyle(sib);
                        return {
                            tag: sib.tagName,
                            className: sib.className?.substring(0, 50),
                            width: sibRect.width,
                            height: sibRect.height,
                            display: sibStyle.display,
                            visibility: sibStyle.visibility
                        };
                    });

                    results.push({
                        id: id.substring(0, 60),
                        value: value,
                        inputWidth: rect.width,
                        inputDisplay: style.display,
                        siblings: siblingInfo
                    });
                }
            });
            return results;
        });
        console.log('\nDate picker visibility (WITH CSS):');
        console.log(JSON.stringify(datePickerInfoWithCss, null, 2));

        console.log('\nWaiting for inspection...');
        await sleep(15000);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

debugDatePicker();
