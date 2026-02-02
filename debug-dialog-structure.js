const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { getCredentials } = require('./test-config');

const LOGIN_URL = 'https://members.phibetasigma1914.org/iMISdev/';
const ACCOUNT_URL = 'https://members.phibetasigma1914.org/iMISDEV/PBSMember/My_Account_2/PBSMember/AccountPage.aspx?hkey=53f0d6d1-e7a3-4f97-87b5-d6d0a6a282f0';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function debugDialog() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    page.on('dialog', async d => await d.accept());

    // Login
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    const { username, password } = getCredentials();
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInUserName', username);
    await page.type('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_signInPassword', password);
    await page.evaluate(() => document.querySelector('#ctl01_TemplateBody_WebPartManager1_gwpciNewContactSignInCommon_ciNewContactSignInCommon_SubmitButton').click());
    await sleep(6000);

    // Go to Account page
    await page.goto(ACCOUNT_URL, { waitUntil: 'networkidle2' });
    await sleep(3000);

    // Click Edit
    await page.mouse.click(165, 135);
    await sleep(4000);

    // Debug the dialog structure
    const structure = await page.evaluate(() => {
        const radWindow = document.querySelector('.RadWindow, [class*="RadWindow"]');
        if (!radWindow) return { found: false };

        // Get all elements in the RadWindow
        const allElements = radWindow.querySelectorAll('*');
        const elementInfo = [];

        allElements.forEach((el, i) => {
            if (i < 50) { // First 50 elements
                elementInfo.push({
                    index: i,
                    tag: el.tagName,
                    className: el.className?.toString().substring(0, 50) || '',
                    id: el.id || '',
                    text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
                          ? el.textContent.trim().substring(0, 20) : ''
                });
            }
        });

        // Find the title specifically
        const titleCandidates = [];
        allElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text === 'Edit' || text?.startsWith('Edit')) {
                const style = getComputedStyle(el);
                titleCandidates.push({
                    tag: el.tagName,
                    className: el.className?.toString() || '',
                    color: style.color,
                    fontSize: style.fontSize,
                    backgroundColor: style.backgroundColor
                });
            }
        });

        return {
            found: true,
            windowClass: radWindow.className,
            elementCount: allElements.length,
            structure: elementInfo,
            titleCandidates
        };
    });

    console.log('=== DIALOG STRUCTURE ===');
    console.log('Window class:', structure.windowClass);
    console.log('Element count:', structure.elementCount);
    console.log('\nFirst 50 elements:');
    structure.structure?.forEach(e => {
        console.log(`  ${e.index}: <${e.tag}> class="${e.className}" id="${e.id}" ${e.text ? `text="${e.text}"` : ''}`);
    });
    console.log('\nTitle candidates (elements with "Edit" text):');
    console.log(JSON.stringify(structure.titleCandidates, null, 2));

    await sleep(10000);
    await browser.close();
}

debugDialog();
