const puppeteer = require('puppeteer');
const path = require('path');
const { getCredentials } = require('./test-config');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        protocolTimeout: 60000
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Handle dialogs FIRST before any navigation
    page.on('dialog', async dialog => {
        console.log('[DIALOG] Accepting:', dialog.message().substring(0, 50) + '...');
        await dialog.accept();
    });

    // Collect JS errors
    const jsErrors = [];
    page.on('pageerror', error => {
        jsErrors.push(error.message);
        console.log('[JS ERROR]', error.message);
    });

    // Track POST requests
    let postCount = 0;
    page.on('request', req => {
        if (req.method() === 'POST' && req.url().includes('phibetasigma')) {
            postCount++;
            console.log(`[POST #${postCount}]`, req.url().substring(0, 80));
        }
    });

    // Step 1: Login
    console.log('\n=== LOGGING IN ===');
    const { username, password } = getCredentials();
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');

    console.log('Waiting for login to complete...');
    await new Promise(r => setTimeout(r, 6000));
    console.log('Current URL:', page.url());

    // Step 2: Analyze sign out link
    console.log('\n=== ANALYZING SIGN OUT LINK ===');
    const analysis = await page.evaluate(() => {
        const results = {
            loginStatusElement: null,
            formAction: null,
            doPostBackExists: typeof __doPostBack === 'function',
            viewStateExists: !!document.querySelector('#__VIEWSTATE'),
            eventValidationExists: !!document.querySelector('#__EVENTVALIDATION')
        };

        // Find LoginStatus
        const loginStatus = document.querySelector('[id*="LoginStatus"]');
        if (loginStatus) {
            results.loginStatusElement = {
                id: loginStatus.id,
                tag: loginStatus.tagName,
                href: loginStatus.href,
                text: loginStatus.innerText,
                html: loginStatus.outerHTML
            };
        }

        // Form info
        const form = document.querySelector('form');
        if (form) {
            results.formAction = form.action;
        }

        return results;
    });

    console.log('\nAnalysis Results:');
    console.log('  __doPostBack exists:', analysis.doPostBackExists);
    console.log('  ViewState exists:', analysis.viewStateExists);
    console.log('  EventValidation exists:', analysis.eventValidationExists);
    console.log('  Form action:', analysis.formAction);
    console.log('\nLoginStatus element:');
    if (analysis.loginStatusElement) {
        console.log('  ID:', analysis.loginStatusElement.id);
        console.log('  Tag:', analysis.loginStatusElement.tag);
        console.log('  href:', analysis.loginStatusElement.href);
        console.log('  Text:', analysis.loginStatusElement.text);
        console.log('  HTML:', analysis.loginStatusElement.html);
    } else {
        console.log('  NOT FOUND!');
    }

    // Screenshot before
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'signout-before.png') });
    console.log('\nScreenshot: signout-before.png');

    // Step 3: Click sign out
    console.log('\n=== CLICKING SIGN OUT ===');
    postCount = 0;

    const clickResult = await page.evaluate(() => {
        const el = document.querySelector('[id*="LoginStatus"]');
        if (el) {
            el.click();
            return 'Clicked: ' + el.id;
        }
        return 'Element not found';
    });
    console.log(clickResult);

    // Wait for response
    console.log('Waiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('\nAfter click:');
    console.log('  URL:', page.url());
    console.log('  POST requests to site:', postCount);
    console.log('  JS errors:', jsErrors.length);
    jsErrors.forEach(e => console.log('    -', e));

    // Check if still logged in
    const stillLoggedIn = await page.evaluate(() => {
        const el = document.querySelector('[id*="LoginStatus"]');
        return el ? el.innerText : 'Element not found';
    });
    console.log('  LoginStatus text:', stillLoggedIn);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'signout-after.png') });
    console.log('\nScreenshot: signout-after.png');

    // Step 4: Try manual postback
    console.log('\n=== MANUAL __doPostBack TEST ===');
    postCount = 0;

    await page.evaluate(() => {
        if (typeof __doPostBack === 'function') {
            __doPostBack('ctl01$LoginStatus1$ctl00', '');
        }
    });

    console.log('Called __doPostBack manually');
    await new Promise(r => setTimeout(r, 5000));

    console.log('After manual postback:');
    console.log('  URL:', page.url());
    console.log('  POST requests:', postCount);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'signout-manual.png') });
    console.log('Screenshot: signout-manual.png');

    // Summary
    console.log('\n========================================');
    console.log('DIAGNOSIS');
    console.log('========================================');
    if (postCount === 0) {
        console.log('NO POST REQUEST was made - the __doPostBack is NOT triggering a form submit.');
        console.log('This suggests:');
        console.log('  1. Form action URL issue');
        console.log('  2. ViewState/EventValidation mismatch');
        console.log('  3. JavaScript error preventing form submit');
    } else {
        console.log(`${postCount} POST request(s) made but sign out may have failed.`);
    }

    console.log('\nBrowser open for 20 seconds for inspection...');
    await new Promise(r => setTimeout(r, 20000));

    await browser.close();
})();
