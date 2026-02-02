const puppeteer = require('puppeteer');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        protocolTimeout: 60000
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Handle dialogs
    page.on('dialog', async dialog => {
        console.log('[DIALOG] Accepting...');
        await dialog.accept();
    });

    // Track redirects
    page.on('response', response => {
        const status = response.status();
        if (status >= 300 && status < 400) {
            console.log(`[REDIRECT ${status}] ${response.url()} -> ${response.headers()['location']}`);
        }
    });

    // Login
    console.log('=== LOGGING IN ===');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'REDACTED_USER');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'REDACTED_PASSWORD');
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await new Promise(r => setTimeout(r, 6000));

    // Get cookies BEFORE sign out
    console.log('\n=== COOKIES BEFORE SIGN OUT ===');
    const cookiesBefore = await page.cookies();
    cookiesBefore.forEach(c => {
        console.log(`  ${c.name}: ${c.value.substring(0, 30)}... (path: ${c.path}, domain: ${c.domain})`);
    });

    // Check current URL
    console.log('\nCurrent URL:', page.url());

    // Analyze form action
    const formInfo = await page.evaluate(() => {
        const form = document.querySelector('form');
        return {
            action: form ? form.action : 'NO FORM',
            method: form ? form.method : 'N/A',
            id: form ? form.id : 'N/A'
        };
    });
    console.log('\nForm action:', formInfo.action);

    // Click sign out
    console.log('\n=== CLICKING SIGN OUT ===');

    // Use navigation promise to catch the redirect
    const [response] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(e => {
            console.log('Navigation timeout or error:', e.message);
            return null;
        }),
        page.evaluate(() => {
            const link = document.querySelector('[id*="LoginStatus"]');
            if (link) link.click();
        })
    ]);

    if (response) {
        console.log('Navigation completed to:', response.url());
        console.log('Response status:', response.status());
    }

    await new Promise(r => setTimeout(r, 3000));

    // Get cookies AFTER sign out
    console.log('\n=== COOKIES AFTER SIGN OUT ===');
    const cookiesAfter = await page.cookies();
    cookiesAfter.forEach(c => {
        console.log(`  ${c.name}: ${c.value.substring(0, 30)}... (path: ${c.path}, domain: ${c.domain})`);
    });

    // Compare cookies
    console.log('\n=== COOKIE COMPARISON ===');
    const beforeNames = cookiesBefore.map(c => c.name);
    const afterNames = cookiesAfter.map(c => c.name);

    const removed = beforeNames.filter(n => !afterNames.includes(n));
    const added = afterNames.filter(n => !beforeNames.includes(n));
    const changed = beforeNames.filter(n => {
        const before = cookiesBefore.find(c => c.name === n);
        const after = cookiesAfter.find(c => c.name === n);
        return after && before.value !== after.value;
    });

    console.log('Removed cookies:', removed.length ? removed.join(', ') : 'NONE');
    console.log('Added cookies:', added.length ? added.join(', ') : 'NONE');
    console.log('Changed cookies:', changed.length ? changed.join(', ') : 'NONE');

    // Check if still logged in
    const loginStatus = await page.evaluate(() => {
        const el = document.querySelector('[id*="LoginStatus"]');
        return el ? el.innerText : 'NOT FOUND';
    });
    console.log('\nLoginStatus text:', loginStatus);
    console.log('Still logged in:', loginStatus.toLowerCase().includes('sign out'));

    // Final URL
    console.log('\nFinal URL:', page.url());

    console.log('\n=== DIAGNOSIS ===');
    const authCookieBefore = cookiesBefore.find(c => c.name.toLowerCase().includes('login'));
    const authCookieAfter = cookiesAfter.find(c => c.name.toLowerCase().includes('login'));

    if (authCookieBefore) {
        console.log('Auth cookie before:', authCookieBefore.name, '(path:', authCookieBefore.path + ')');
    }
    if (authCookieAfter) {
        console.log('Auth cookie after:', authCookieAfter.name, '(path:', authCookieAfter.path + ')');
        if (authCookieBefore && authCookieBefore.value === authCookieAfter.value) {
            console.log('>>> AUTH COOKIE WAS NOT CLEARED! <<<');
        }
    } else if (authCookieBefore) {
        console.log('>>> Auth cookie was removed (good!) <<<');
    }

    console.log('\nBrowser open for 20 seconds...');
    await new Promise(r => setTimeout(r, 20000));

    await browser.close();
})();
