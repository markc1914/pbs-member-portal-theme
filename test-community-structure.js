const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { getCredentials } = require('./test-config');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const COMMUNITY_URL = 'https://members.phibetasigma1914.org/iMISDEV/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=33451093-a35b-433d-9b88-4337ac3ed9b3&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        protocolTimeout: 60000
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    page.on('dialog', async dialog => {
        await dialog.accept();
    });

    // Login
    console.log('=== LOGGING IN ===');
    const { username, password } = getCredentials();
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await new Promise(r => setTimeout(r, 6000));

    // Go to Community page
    console.log('\n=== NAVIGATING TO COMMUNITY PAGE ===');
    try {
        await page.goto(COMMUNITY_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
        console.log('Navigation timeout/error, waiting...', e.message);
        await new Promise(r => setTimeout(r, 5000));
    }
    await new Promise(r => setTimeout(r, 2000));

    // Get full page structure
    console.log('\n=== FULL PAGE STRUCTURE ===');
    const structure = await page.evaluate(() => {
        function getElementInfo(el, depth = 0) {
            if (depth > 4) return null;
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();

            return {
                tag: el.tagName,
                id: el.id || null,
                class: el.className ? el.className.substring(0, 80) : null,
                display: style.display,
                float: style.float,
                position: style.position,
                width: rect.width > 0 ? Math.round(rect.width) : 0,
                top: Math.round(rect.top),
                children: el.children.length > 0 && depth < 4 ?
                    Array.from(el.children).slice(0, 10).map(c => getElementInfo(c, depth + 1)) : null
            };
        }

        const body = document.body;
        return getElementInfo(body);
    });

    console.log(JSON.stringify(structure, null, 2));

    // Find specific elements that might be sidebar/main
    console.log('\n=== LOOKING FOR SIDEBAR ELEMENTS ===');
    const sidebarSearch = await page.evaluate(() => {
        const results = [];

        // Look for elements containing "Participant" or community logo
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const text = el.innerText || '';
            if (text.includes('Participant') && el.children.length < 20) {
                const rect = el.getBoundingClientRect();
                results.push({
                    tag: el.tagName,
                    id: el.id,
                    class: el.className.substring(0, 100),
                    text: text.substring(0, 50),
                    top: rect.top,
                    width: rect.width,
                    parentId: el.parentElement?.id,
                    parentClass: el.parentElement?.className.substring(0, 100)
                });
            }
        });

        // Also look for common sidebar classes/elements
        const sidebarCandidates = document.querySelectorAll('.CommunityDescription, .CommunityLogo, .CommunityInfo, [class*="sidebar"], [class*="Sidebar"], [class*="side-bar"], .col-sm-3, .col-md-3, .col-lg-3');
        sidebarCandidates.forEach(el => {
            const rect = el.getBoundingClientRect();
            results.push({
                tag: el.tagName,
                id: el.id,
                class: el.className.substring(0, 100),
                top: rect.top,
                width: rect.width,
                parentId: el.parentElement?.id,
                parentClass: el.parentElement?.className.substring(0, 100)
            });
        });

        return results;
    });

    console.log(JSON.stringify(sidebarSearch, null, 2));

    // Look at the bootstrap row/col structure
    console.log('\n=== BOOTSTRAP GRID STRUCTURE ===');
    const gridStructure = await page.evaluate(() => {
        const rows = document.querySelectorAll('.row, [class*="row"]');
        return Array.from(rows).map(row => {
            const rect = row.getBoundingClientRect();
            const cols = row.querySelectorAll('[class*="col-"]');
            return {
                id: row.id,
                class: row.className.substring(0, 100),
                top: rect.top,
                width: rect.width,
                display: getComputedStyle(row).display,
                flexWrap: getComputedStyle(row).flexWrap,
                columns: Array.from(cols).map(col => ({
                    class: col.className.substring(0, 100),
                    width: col.getBoundingClientRect().width,
                    display: getComputedStyle(col).display,
                    float: getComputedStyle(col).float,
                    order: getComputedStyle(col).order
                }))
            };
        });
    });

    console.log(JSON.stringify(gridStructure, null, 2));

    // Save HTML source for reference
    const html = await page.content();
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'community-page-source.html'), html);
    console.log('\nHTML source saved: community-page-source.html');

    console.log('\nBrowser open for 60 seconds for inspection...');
    await new Promise(r => setTimeout(r, 60000));

    await browser.close();
})();
