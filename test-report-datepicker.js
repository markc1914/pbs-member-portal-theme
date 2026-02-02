const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { getCredentials } = require('./test-config');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const REPORT_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/HQ_Items/Reports/LMS_Course_Completion_Report/PBSMember/LMS_Course_Completion_Report.aspx?hkey=e20d384d-d774-440f-8e64-912764acb195';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testReportDatePicker() {
    // Use mcornelius user (index 1) - has staff access to reports
    const { username, password } = getCredentials(1);
    console.log('Using user:', username);

    // Load local CSS and fix image paths
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
        console.log('Logged in! Current URL:', page.url());

        // Navigate to LMS Report page
        console.log('Navigating to LMS Course Completion Report...');
        await page.goto(REPORT_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);

        // Screenshot BEFORE CSS injection
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'report-datepicker-1-before-css.png'), fullPage: false });
        console.log('Screenshot: report-datepicker-1-before-css.png');

        // Analyze date picker elements before CSS
        const beforeAnalysis = await page.evaluate(() => {
            const results = {
                gridFilterCalendar: [],
                imageButtons: [],
                dateInputs: []
            };

            // Find GridFilterCalendar tables
            document.querySelectorAll('.GridFilterCalendar').forEach(table => {
                const rect = table.getBoundingClientRect();
                results.gridFilterCalendar.push({
                    width: rect.width,
                    height: rect.height,
                    visible: rect.width > 0 && rect.height > 0
                });
            });

            // Find image buttons (calendar buttons)
            document.querySelectorAll('input[type="image"]').forEach(img => {
                const rect = img.getBoundingClientRect();
                const style = getComputedStyle(img);
                results.imageButtons.push({
                    id: img.id.substring(img.id.length - 40),
                    alt: img.alt,
                    src: img.src,
                    width: rect.width,
                    height: rect.height,
                    display: style.display,
                    visibility: style.visibility,
                    visible: rect.width > 0 && rect.height > 0
                });
            });

            // Find date text inputs
            document.querySelectorAll('.StylesDateText, input[id*="BusinessCalendar"]').forEach(input => {
                const rect = input.getBoundingClientRect();
                results.dateInputs.push({
                    id: input.id.substring(input.id.length - 30),
                    className: input.className,
                    width: rect.width,
                    visible: rect.width > 0
                });
            });

            return results;
        });

        console.log('\n=== BEFORE CSS INJECTION ===');
        console.log('GridFilterCalendar tables:', JSON.stringify(beforeAnalysis.gridFilterCalendar, null, 2));
        console.log('Image buttons (calendar):', JSON.stringify(beforeAnalysis.imageButtons, null, 2));
        console.log('Date inputs:', JSON.stringify(beforeAnalysis.dateInputs, null, 2));

        // Inject local CSS
        console.log('\nInjecting local CSS...');
        await page.addStyleTag({ content: localCss });
        await sleep(1000);

        // Screenshot AFTER CSS injection
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'report-datepicker-2-after-css.png'), fullPage: false });
        console.log('Screenshot: report-datepicker-2-after-css.png');

        // Analyze after CSS
        const afterAnalysis = await page.evaluate(() => {
            const results = {
                imageButtons: []
            };

            document.querySelectorAll('input[type="image"]').forEach(img => {
                const rect = img.getBoundingClientRect();
                const style = getComputedStyle(img);
                results.imageButtons.push({
                    id: img.id.substring(img.id.length - 40),
                    alt: img.alt,
                    width: rect.width,
                    height: rect.height,
                    display: style.display,
                    visibility: style.visibility,
                    backgroundColor: style.backgroundColor,
                    backgroundImage: style.backgroundImage.substring(0, 50) + '...',
                    visible: rect.width > 0 && rect.height > 0
                });
            });

            return results;
        });

        console.log('\n=== AFTER CSS INJECTION ===');
        console.log('Image buttons (calendar):', JSON.stringify(afterAnalysis.imageButtons, null, 2));

        console.log('\nKeeping browser open for 15 seconds for inspection...');
        await sleep(15000);

    } catch (error) {
        console.error('Error:', error);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'report-datepicker-error.png'), fullPage: true });
    } finally {
        await browser.close();
    }
}

testReportDatePicker();
