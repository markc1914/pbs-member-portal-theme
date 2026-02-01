const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TEST_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const THEME_BASE_URL = 'https://members.phibetasigma1914.org/iMISdev/App_Themes/PBS_Responsive_Theme';
const USERNAME = 'REDACTED_USER';
const PASSWORD = 'REDACTED_PASSWORD';
const SCREENSHOT_DIR = path.join(__dirname, 'testingScreenshots');
const LOCAL_CSS_PATH = path.join(__dirname, 'package', 'pbs-theme.css');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function injectCSS(page) {
    let css = fs.readFileSync(LOCAL_CSS_PATH, 'utf8');
    css = css.replace(/url\("images\//g, `url("${THEME_BASE_URL}/images/`);
    await page.addStyleTag({ content: css });
}

async function test() {
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
    
    try {
        console.log('=== FULL TEST ===');
        const dp = await browser.newPage();
        await dp.setViewport({ width: 1280, height: 800 });
        dp.on('dialog', async d => await d.accept());
        
        await dp.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const u = await dp.$('input[id*="signInUserName"]');
        const p = await dp.$('input[id*="signInPassword"], input[type="password"]');
        if (u && p) {
            await u.type(USERNAME, { delay: 30 });
            await p.type(PASSWORD, { delay: 30 });
            const s = await dp.$('input[type="submit"]');
            if (s) { await s.click(); await dp.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}); }
        }
        
        await injectCSS(dp);
        await sleep(2000);
        
        // Check Mark/Cart
        const buttons = await dp.evaluate(() => {
            const links = document.querySelectorAll('a');
            const result = [];
            links.forEach(a => {
                const text = a.textContent.trim().toUpperCase();
                if (text === 'MARK' || text === 'CART') {
                    const s = window.getComputedStyle(a);
                    result.push({ text: a.textContent.trim(), display: s.display, visibility: s.visibility });
                }
            });
            return result;
        });
        const visibleButtons = buttons.filter(b => b.display !== 'none' && b.visibility !== 'hidden');
        console.log('Mark/Cart buttons visible:', visibleButtons.length);
        console.log(visibleButtons.length === 0 ? '✓ PASS - All hidden' : '✗ FAIL - Some visible: ' + JSON.stringify(visibleButtons));
        
        // Check banner
        const banner = await dp.evaluate(() => {
            const b = document.querySelector('#masterHeaderImage');
            if (b) {
                const r = b.getBoundingClientRect();
                return { w: r.width, h: r.height };
            }
            return null;
        });
        console.log('Banner size:', banner);
        console.log(banner && banner.w > 1200 ? '✓ PASS - Full width' : '✗ FAIL - Not full width');
        
        await dp.screenshot({ path: path.join(SCREENSHOT_DIR, 'FINAL-desktop-test.png') });
        
        // Mobile test
        console.log('\n=== MOBILE ===');
        const mp = await browser.newPage();
        await mp.setViewport({ width: 375, height: 812, isMobile: true });
        mp.on('dialog', async d => await d.accept());
        
        await mp.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const mu = await mp.$('input[id*="signInUserName"]');
        const mpa = await mp.$('input[id*="signInPassword"], input[type="password"]');
        if (mu && mpa) {
            await mu.type(USERNAME, { delay: 30 });
            await mpa.type(PASSWORD, { delay: 30 });
            const ms = await mp.$('input[type="submit"]');
            if (ms) { await ms.click(); await mp.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}); }
        }
        
        await injectCSS(mp);
        await sleep(2000);
        
        const mobileBanner = await mp.evaluate(() => {
            const b = document.querySelector('#masterHeaderImage');
            if (b) {
                const r = b.getBoundingClientRect();
                return { w: r.width, h: r.height };
            }
            return null;
        });
        console.log('Mobile banner:', mobileBanner);
        console.log(mobileBanner && mobileBanner.h > 0 ? '✓ PASS - Mobile banner visible' : '✗ FAIL');
        
        await mp.screenshot({ path: path.join(SCREENSHOT_DIR, 'FINAL-mobile-test.png') });
        
        console.log('\nBrowser open 15 seconds...');
        await sleep(15000);
        
    } finally {
        await browser.close();
    }
}

test();
