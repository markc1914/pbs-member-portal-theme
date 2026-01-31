const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--window-size=1920,1080'],
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    console.log('Navigating to login page...');
    await page.goto('https://members.phibetasigma1914.org/imisdev/pbsmember', { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(2000);

    // Login
    console.log('Logging in...');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', 'REDACTED_USER');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', 'REDACTED_PASSWORD');
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await wait(5000);

    console.log('Logged in. URL:', page.url());

    // Find ALL links containing "sign out"
    console.log('\n=== SIGN OUT LINK ANALYSIS ===');
    const signOutLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links
            .filter(a => a.textContent && a.textContent.toLowerCase().includes('sign out'))
            .map(a => ({
                text: a.textContent.trim(),
                id: a.id,
                href: a.href,
                onclick: a.getAttribute('onclick'),
                outerHTML: a.outerHTML.substring(0, 300)
            }));
    });

    console.log('Found', signOutLinks.length, 'links containing "sign out":');
    signOutLinks.forEach((link, i) => {
        console.log(`\n--- Link ${i + 1} ---`);
        console.log('Text:', link.text);
        console.log('ID:', link.id);
        console.log('href:', link.href);
        console.log('onclick:', link.onclick);
        console.log('HTML:', link.outerHTML);
    });

    // Also check for SignOut in ID
    const signOutById = await page.evaluate(() => {
        const el = document.querySelector('a[id*="SignOut"]');
        if (el) {
            return {
                text: el.textContent.trim(),
                id: el.id,
                href: el.href,
                onclick: el.getAttribute('onclick'),
                outerHTML: el.outerHTML
            };
        }
        return null;
    });

    console.log('\n=== SIGN OUT BY ID ===');
    if (signOutById) {
        console.log('Found by ID selector:');
        console.log(JSON.stringify(signOutById, null, 2));
    } else {
        console.log('No element found with ID containing "SignOut"');
    }

    console.log('\nBrowser open for 30 seconds to inspect...');
    await wait(30000);

    await browser.close();
})();
