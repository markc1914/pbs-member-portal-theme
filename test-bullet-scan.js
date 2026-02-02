const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    page.on('dialog', async d => await d.accept());

    // Login
    console.log('Logging in...');
    await page.goto('https://members.phibetasigma1914.org/iMISdev/', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', process.env.PBS_USER || 'kingboot');
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', process.env.PBS_PASS || 'pbs1914');
    await page.click('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton');
    await new Promise(r => setTimeout(r, 6000));

    const pagesToCheck = [
        { name: 'Home', url: 'https://members.phibetasigma1914.org/iMISdev/' },
        { name: 'My Account', url: 'https://members.phibetasigma1914.org/iMISdev/iCore/Contacts/MyAccount_DefaultPage.aspx' },
        { name: 'Directory', url: 'https://members.phibetasigma1914.org/iMISdev/Directory' },
        { name: 'Community', url: 'https://members.phibetasigma1914.org/iMISDEV/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=33451093-a35b-433d-9b88-4337ac3ed9b3&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140' }
    ];

    for (const pg of pagesToCheck) {
        try {
            await page.goto(pg.url, { waitUntil: 'networkidle2', timeout: 30000 });
        } catch(e) {
            console.log('Navigation timeout for', pg.name);
        }
        await new Promise(r => setTimeout(r, 2000));

        const bullets = await page.evaluate(() => {
            const results = [];
            const allLi = document.querySelectorAll('li');
            allLi.forEach(li => {
                const style = getComputedStyle(li);
                if (style.listStyleType !== 'none' && style.display !== 'none') {
                    const rect = li.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && rect.top > 0) {
                        results.push({
                            text: li.innerText.substring(0, 50).replace(/\n/g, ' '),
                            listStyle: style.listStyleType,
                            parentClass: li.parentElement?.className?.substring(0, 60),
                            parentId: li.parentElement?.id,
                            top: Math.round(rect.top)
                        });
                    }
                }
            });
            return results;
        });

        console.log('\n=== ' + pg.name + ' ===');
        if (bullets.length > 0) {
            console.log('Found ' + bullets.length + ' items with bullets:');
            bullets.slice(0, 15).forEach(b => {
                console.log('  - [' + b.listStyle + '] "' + b.text + '"');
                console.log('    Parent: class="' + (b.parentClass || '') + '" id="' + (b.parentId || '') + '"');
            });
        } else {
            console.log('No visible bullets found');
        }
    }

    await browser.close();
    console.log('\nDone.');
})();
