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

async function testDatePicker() {
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

        // Go to Account page
        console.log('Navigating to Account page...');
        await page.goto(ACCOUNT_URL, { waitUntil: 'networkidle2' });
        await sleep(2000);

        // Screenshot BEFORE CSS
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'datepicker-1-before-css.png'), fullPage: false });
        console.log('Screenshot: datepicker-1-before-css.png');

        // Inject CSS
        console.log('Injecting local CSS...');
        await page.addStyleTag({ content: localCss });
        await sleep(500);

        // Click on "My Membership" tab
        console.log('Clicking My Membership tab...');
        const tabs = await page.$$('a.rtsLink, .rtsLink');
        for (const tab of tabs) {
            const text = await page.evaluate(el => el.textContent?.trim(), tab);
            if (text && text.includes('My Membership')) {
                await tab.click();
                break;
            }
        }
        await sleep(2000);

        // List all Edit links first
        console.log('Finding all Edit links...');
        const links = await page.$$('a');
        const editLinks = [];
        for (const link of links) {
            const text = await page.evaluate(el => el.textContent?.trim(), link);
            const box = await link.boundingBox();
            if (text && text.includes('Edit') && box) {
                editLinks.push({ link, x: box.x, y: box.y, text });
                console.log(`  "${text}" link at (${Math.round(box.x)}, ${Math.round(box.y)})`);
            }
        }
        // If no Edit links found, dump all visible links and check section header
        if (editLinks.length === 0) {
            console.log('No Edit links found. Checking section header area...');
            const headerInfo = await page.evaluate(() => {
                const results = [];
                // Find the MY MEMBERSHIP section header
                const headers = document.querySelectorAll('.PanelHead, .panel-heading, [class*="PanelHead"], h3, h2');
                headers.forEach(h => {
                    const rect = h.getBoundingClientRect();
                    if (rect.y > 0 && rect.y < 200 && rect.x > 200) {
                        const links = h.querySelectorAll('a');
                        links.forEach(a => {
                            const aRect = a.getBoundingClientRect();
                            const style = getComputedStyle(a);
                            results.push({
                                parentClass: h.className,
                                href: a.href,
                                text: a.textContent?.trim(),
                                innerHTML: a.innerHTML.substring(0, 100),
                                x: aRect.x,
                                y: aRect.y,
                                width: aRect.width,
                                height: aRect.height,
                                display: style.display,
                                visibility: style.visibility,
                                color: style.color,
                                fontSize: style.fontSize
                            });
                        });
                    }
                });
                // Also check for any element with "Edit" in id
                document.querySelectorAll('[id*="Edit"], [id*="edit"]').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const style = getComputedStyle(el);
                    if (rect.y > 0 && rect.y < 200) {
                        results.push({
                            tag: el.tagName,
                            id: el.id,
                            text: el.textContent?.trim().substring(0, 30),
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                            display: style.display,
                            visibility: style.visibility
                        });
                    }
                });
                return results;
            });
            console.log('Header area elements:', JSON.stringify(headerInfo, null, 2));
        }

        // Click the Edit link in the MY MEMBERSHIP section header (rightmost, in content area)
        let clicked = false;
        for (const { link, x, y } of editLinks) {
            // Edit link in section header should be x > 600 (right side of content area)
            if (x > 600) {
                console.log(`Clicking Edit link at (${Math.round(x)}, ${Math.round(y)})...`);
                await link.click();
                clicked = true;
                break;
            }
        }
        if (!clicked && editLinks.length > 0) {
            // Click the last Edit link found (likely in content area)
            const last = editLinks[editLinks.length - 1];
            console.log(`Clicking last Edit link at (${Math.round(last.x)}, ${Math.round(last.y)})...`);
            await last.link.click();
            clicked = true;
        }
        await sleep(4000);

        // Screenshot AFTER Edit dialog opens
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'datepicker-2-edit-dialog.png'), fullPage: false });
        console.log('Screenshot: datepicker-2-edit-dialog.png');

        // Check date picker elements
        const datePickerInfo = await page.evaluate(() => {
            const results = {
                radDatePickers: [],
                dateInputs: [],
                calendarButtons: []
            };

            // Find RadDatePicker elements
            document.querySelectorAll('[class*="RadDatePicker"], [class*="RadPicker"], [class*="riTextBox"]').forEach(el => {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                results.radDatePickers.push({
                    className: el.className,
                    display: style.display,
                    visibility: style.visibility,
                    width: rect.width,
                    height: rect.height
                });
            });

            // Find date-related inputs
            document.querySelectorAll('input[type="text"][id*="Date"], input[id*="date"], input[id*="Birth"]').forEach(el => {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const parent = el.closest('td, div');
                const parentRect = parent ? parent.getBoundingClientRect() : null;
                results.dateInputs.push({
                    id: el.id,
                    value: el.value,
                    display: style.display,
                    visibility: style.visibility,
                    width: rect.width,
                    parentWidth: parentRect ? parentRect.width : null
                });
            });

            // Find calendar/popup buttons (usually images or anchors with calendar icon)
            document.querySelectorAll('[class*="rcCalPopup"], [class*="picker"], .rcCalPopup, a[href*="javascript"][class*="rad"], img[src*="calendar"]').forEach(el => {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                results.calendarButtons.push({
                    tag: el.tagName,
                    className: el.className,
                    display: style.display,
                    visibility: style.visibility,
                    width: rect.width,
                    height: rect.height,
                    src: el.src || null
                });
            });

            return results;
        });

        console.log('\n=== DATE PICKER ANALYSIS ===');
        console.log('RadDatePickers:', JSON.stringify(datePickerInfo.radDatePickers, null, 2));
        console.log('Date Inputs:', JSON.stringify(datePickerInfo.dateInputs, null, 2));
        console.log('Calendar Buttons:', JSON.stringify(datePickerInfo.calendarButtons, null, 2));

        // Check if any elements are being hidden
        const hiddenCheck = await page.evaluate(() => {
            const hiddenElements = [];
            document.querySelectorAll('*').forEach(el => {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const className = el.className?.toString() || '';

                // Look for date-related elements that are hidden
                if ((className.includes('Date') || className.includes('date') || className.includes('Cal') || className.includes('cal') || className.includes('Picker') || className.includes('picker')) &&
                    (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0)) {
                    hiddenElements.push({
                        tag: el.tagName,
                        className: className.substring(0, 60),
                        display: style.display,
                        visibility: style.visibility,
                        width: rect.width
                    });
                }
            });
            return hiddenElements;
        });

        console.log('\nHidden date-related elements:', JSON.stringify(hiddenCheck, null, 2));

        console.log('\nWaiting for inspection...');
        await sleep(15000);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

testDatePicker();
