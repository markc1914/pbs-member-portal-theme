const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = './automatedTestScreenshots';
const BASE_URL = 'https://members.phibetasigma1914.org/iMISDEV';

// Load local CSS to inject
const localCSS = fs.readFileSync(path.join(__dirname, 'package', 'pbs-theme.css'), 'utf8');

const username = process.argv[2];
const password = process.argv[3];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testFollowButton() {
    if (!username || !password) {
        console.log('Usage: node test-follow-button.js <username> <password>');
        process.exit(1);
    }

    console.log('Testing Follow Community button...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    page.on('dialog', async dialog => {
        await dialog.accept();
    });

    try {
        // Login
        console.log('1. Logging in...');
        await page.goto(`${BASE_URL}/PBSMember/Sign_In.aspx`, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.type('input[id*="UserName"]', username);
        await page.type('input[id*="Password"]', password);
        await page.click('input[type="submit"], button[type="submit"], input[id*="LoginButton"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
        await wait(2000);

        // Navigate to Community page
        console.log('2. Navigating to Community page...');
        await page.goto(`${BASE_URL}/iCore/Communities/CommunityLayouts/CommunityDescription.aspx?iUniformKey=d2a740ce-8b73-4a54-97a5-990ac2cce029&WebsiteKey=f17366dc-26c7-4e94-9bc6-8535489d9140`, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(2000);

        // Screenshot BEFORE CSS injection
        const screenshot1 = path.join(SCREENSHOTS_DIR, `follow-button-1-before-${Date.now()}.png`);
        await page.screenshot({ path: screenshot1 });
        console.log(`   Screenshot (before CSS): ${screenshot1}`);

        // Inject local CSS
        console.log('\n3. Injecting local CSS...');
        await page.addStyleTag({ content: localCSS });
        await wait(500);

        // Screenshot AFTER CSS injection
        const screenshot2 = path.join(SCREENSHOTS_DIR, `follow-button-2-after-${Date.now()}.png`);
        await page.screenshot({ path: screenshot2 });
        console.log(`   Screenshot (after CSS): ${screenshot2}`);

        // Find the Follow Community button
        console.log('\n4. Inspecting Follow Community button...');
        const followButtonInfo = await page.evaluate(() => {
            const results = [];

            // Look for any element with "Follow" text
            const allElements = document.querySelectorAll('a, button, input[type="submit"], span, div');
            allElements.forEach(el => {
                const text = el.textContent?.trim() || el.value?.trim() || '';
                if (text.toLowerCase().includes('follow') && text.length < 50) {
                    const style = window.getComputedStyle(el);
                    results.push({
                        tag: el.tagName,
                        text: text.substring(0, 50),
                        id: el.id,
                        className: el.className,
                        color: style.color,
                        backgroundColor: style.backgroundColor,
                        display: style.display,
                        parentId: el.parentElement?.id,
                        parentClass: el.parentElement?.className
                    });
                }
            });

            return results;
        });

        console.log('\n   Found Follow-related elements:');
        followButtonInfo.forEach((el, i) => {
            console.log(`\n   [${i + 1}] ${el.tag} - "${el.text}"`);
            console.log(`       id: ${el.id}`);
            console.log(`       class: ${el.className}`);
            console.log(`       color: ${el.color}`);
            console.log(`       background: ${el.backgroundColor}`);
            console.log(`       parent class: ${el.parentClass}`);
        });

        console.log('\n✓ Test complete! Check the screenshot.');
        console.log('Browser left open for inspection.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testFollowButton();
