import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { formatPhone } from '@/lib/phone-format';
import { pdfStyles } from './shared/styles';
import { renderHeader } from './shared/header';
import { renderCustomerInfo } from './shared/customerInfo';
import { renderFooter, renderSigningArea } from './shared/footer';
import { BRAND } from './generator';
import { formatDocTitle } from '@/lib/utils';
import { getPdfFontFaceCss } from '@/lib/pdf/fonts';
import { getConfiguredSiteOrigin } from '@/lib/site-url';

export async function generateWarrantyPdf(quote: any, baseUrl = getConfiguredSiteOrigin()): Promise<Buffer> {
    // Check status
    const allowedStatuses = ['completed', 'paid'];
    if (!allowedStatuses.includes(quote.status)) {
        throw new Error('報價狀態不符，無法產生保固書');
    }

    if (!quote.completedAt) {
        throw new Error('請先填寫完工日期');
    }

    const companyName = await getSetting('company_name', '一帆安全整合有限公司');
    const companyPhone = await getSetting('company_phone', '02-7730-1158');
    const companyAddress = await getSetting('company_address', '台北市大安區四維路14巷15號7樓之1');
    const companyEmail = await getSetting('company_email', 'safekings@gmail.com');
    const companyStampUrl = await getSetting('warranty_stamp_url', await getSetting('company_stamp_url', ''));
    const warrantyTerms = await getSetting('warranty_terms', '');
    const removeHiddenItems = await getSetting('remove_hidden_items_for_warranty', true);

    const { resolvePdfLogoUrl, resolveImageToBase64OrUrl } = await import('./shared/imageUtils');
    const settings = {
        logoUrl: await resolvePdfLogoUrl(baseUrl),
        companyName,
        companyAddress,
        companyPhone: formatPhone(companyPhone),
        companyEmail,
        companyStampUrl: resolveImageToBase64OrUrl(companyStampUrl, baseUrl)
    };

    // Filter items: selected variant items or all if none selected
    let displayItems = [];
    if (quote.selectedVariantId) {
        displayItems = quote.items.filter((item: any) => !item.variantId || item.variantId === quote.selectedVariantId);
    } else {
        displayItems = quote.items;
    }

    // Remove hidden items if setting is true
    if (removeHiddenItems) {
        displayItems = displayItems.filter((item: any) => !item.isHiddenItem);
    }

    // Warranty Period Calculation
    const startDate = new Date(quote.warrantyStartDate || quote.completedAt);
    const months = quote.warrantyMonths ?? 12;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    // Update quote expires at if not set
    if (!quote.warrantyExpiresAt) {
        await prisma.quote.update({
            where: { id: quote.id },
            data: { warrantyExpiresAt: endDate }
        });
    }

    // Contact HTML
    const contactsHtml = (quote.contacts && quote.contacts.length > 0)
        ? quote.contacts.map((qc: any) => {
            const c = qc.contact;
            return `
                <div style="margin-bottom: 2px; line-height: 1.2; display: flex; align-items: baseline;">
                    <span style="font-weight: 700; color: ${BRAND.gray900}; font-size: 13.5px; margin-right: 8px; white-space: nowrap;">${c.name}</span>
                </div>
            `;
        }).join('')
        : '';

    // Chunking
    const ITEMS_PER_PAGE = 18;
    const pageHtmls: string[] = [];
    const totalPages = Math.ceil(displayItems.length / ITEMS_PER_PAGE) || 1;

    for (let i = 0; i < totalPages; i++) {
        const chunk = displayItems.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE);
        const isLastPage = i === totalPages - 1;

        let pageContent = `
            <div class="top-accent"></div>
            ${renderHeader(quote, settings, '保固證明書', { overrideDate: quote.completedAt ? new Date(quote.completedAt) : undefined, hideExpiry: true })}
            <div class="title-section">
                <div class="main-title">
                    <div class="title-ch">${formatDocTitle(quote.name, '保固證明書')}</div>
                    <div class="title-en" style="font-size: 10px; margin-top: 2px;">WARRANTY CERTIFICATE</div>
                </div>
            </div>
            ${renderCustomerInfo(quote, contactsHtml)}
            
            <div class="table-section">
                <div style="font-size: 11px; font-weight: 900; color: ${BRAND.primary}; margin-bottom: 8px; border-bottom: 2px solid ${BRAND.primary}; padding: 4px 0;">🔧 保固設備明細 EQUIPMENT COVERED</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="background: ${BRAND.gray100}; color: ${BRAND.gray600};">#</th>
                            <th style="background: ${BRAND.gray100}; color: ${BRAND.gray600};">品名 / 型號</th>
                            <th style="background: ${BRAND.gray100}; color: ${BRAND.gray600}; text-align: center;">數量</th>
                            <th style="background: ${BRAND.gray100}; color: ${BRAND.gray600}; text-align: center;">單位</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${chunk.map((item: any, idx: number) => `
                            <tr>
                                <td class="text-center" style="color: ${BRAND.gray400};">${i * ITEMS_PER_PAGE + idx + 1}</td>
                                <td class="item-name">${item.name}</td>
                                <td class="text-center" style="font-weight: 700;">${item.quantity}</td>
                                <td class="text-center">${item.unit || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        if (isLastPage) {
            pageContent += `
                <div class="summary-notes-footer" style="padding-top: 10px;">
                    <div style="margin: 0 44px 20px; padding: 20px; background: ${BRAND.tealLight}55; border-radius: 16px; border: 2px solid ${BRAND.teal}22; display: flex; justify-content: space-around; text-align: center;">
                        <div>
                            <div style="font-size: 10px; color: ${BRAND.gray400}; margin-bottom: 4px;">完工驗收日</div>
                            <div style="font-size: 16px; font-weight: 900; color: ${BRAND.primary};">${format(startDate, 'yyyy 年 MM 月 dd 日')}</div>
                        </div>
                        <div style="width: 1px; background: ${BRAND.gray200};"></div>
                        <div>
                            <div style="font-size: 10px; color: ${BRAND.gray400}; margin-bottom: 4px;">保固期限 (${months}個月)</div>
                            <div style="font-size: 16px; font-weight: 900; color: ${BRAND.accent};">${format(endDate, 'yyyy 年 MM 月 dd 日')}</div>
                        </div>
                    </div>

                    <div class="summary-section" style="margin-bottom: 20px;">
                        <div class="notes-box" style="padding: 20px; background: #fff; border: 1px solid ${BRAND.gray200}; border-left: 4px solid ${BRAND.primary};">
                            <span class="notes-title" style="font-size: 13px;">📜 保固服務條款 WARRANTY TERMS</span>
                            <div style="font-size: 11px; line-height: 1.8; color: ${BRAND.gray600}; text-align: left;">
                                ${(() => {
                                    const processed = (warrantyTerms || `一、本保固書自完工日起生效。
二、保固期間內，因產品瑕疵所生之故障，本公司負責免費維修或更換良品。
三、人為損壞、天災（雷擊、水災、火災等）、不當使用或私自拆修不在保固範圍內。
四、若需維修服務，請來電洽詢並提供報價單編號。`).replace(/\\n/g, '\n');
                                    return processed
                                        .split('\n')
                                        .map((line) => line.trim())
                                        .filter((line) => line.length > 0)
                                        .map((line) => `<div style="text-align: left; margin: 0 0 2px 0;">${line}</div>`)
                                        .join('');
                                })()}
                            </div>
                        </div>
                    </div>

                    ${renderSigningArea(quote, settings, null, '', { showCustomerSignature: false })}
                </div>
            `;
        }

        pageHtmls.push(`<div class="page-container ${isLastPage ? 'last-page' : ''}">${pageContent}${renderFooter(i + 1, totalPages)}</div>`);
    }

    const fontFaceCss = getPdfFontFaceCss();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${fontFaceCss}
${pdfStyles}</style></head><body>${pageHtmls.join('')}</body></html>`;

    const browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'], headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    await browser.close();
    return Buffer.from(pdf);
}
