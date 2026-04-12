import puppeteer from 'puppeteer';
import path from 'path';

async function verify() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await page.setViewport({ width: 1280, height: 1000 });

    // Capture browser console
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    const artifactDir = 'C:/Users/clivt/.gemini/antigravity/brain/87032832-72a5-4d3d-83a7-1350c181a2bc';

    try {
        console.log('1. Navigating to login...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

        console.log('2. Entering credentials...');
        await page.waitForSelector('input#username');
        await page.type('input#username', 'cliv');
        await page.type('input#password', '0982');

        console.log('3. Clicking login button...');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        console.log('4. Checking if logged in successfully...');
        const url = page.url();
        console.log('Current URL:', url);

        console.log('5. Verifying Customer List...');
        await page.goto('http://localhost:3000/admin/customers', { waitUntil: 'networkidle2' });
        await page.waitForSelector('table');
        await page.screenshot({ path: path.join(artifactDir, 'v3_final_list_fixed.png'), fullPage: true });

        console.log('6. Verifying Detail Page...');
        // Find the specific customer created for acceptance
        const detailLink = await page.$('a[href^="/admin/customers/"]');
        if (detailLink) {
            await detailLink.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            await page.waitForSelector('h1');
            await page.screenshot({ path: path.join(artifactDir, 'v3_final_detail_fixed.png'), fullPage: true });
        }

        console.log('7. Verifying Audit Log...');
        await page.goto('http://localhost:3000/admin/audit', { waitUntil: 'networkidle2' });
        await page.waitForSelector('table');
        await page.screenshot({ path: path.join(artifactDir, 'v3_final_audit_fixed.png'), fullPage: true });

        console.log('Verification Complete. All screenshots saved.');
    } catch (err) {
        console.error('Error during verification:', err.message);
        await page.screenshot({ path: path.join(artifactDir, 'v3_error_fixed.png') });
    } finally {
        await browser.close();
    }
}

verify();

