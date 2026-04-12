import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { formatMobile, formatPhone } from '@/lib/phone-format';
import { pdfStyles } from './shared/styles';
import { renderHeader } from './shared/header';
import { renderCustomerInfo } from './shared/customerInfo';
import { renderFooter, renderSigningArea } from './shared/footer';
import { BRAND } from './generator';
import { formatDocTitle } from '@/lib/utils';
import { getPdfFontFaceCss } from '@/lib/pdf/fonts';
import fs from 'fs';
import path from 'path';
import { getConfiguredSiteOrigin } from '@/lib/site-url';

export async function generateInvoicePdf(quote: any, baseUrl = getConfiguredSiteOrigin()): Promise<Buffer> {
    // Check status
    const allowedStatuses = ['signed', 'construction', 'completed', 'paid'];
    if (!allowedStatuses.includes(quote.status)) {
        throw new Error('報價狀態不符，無法產生請款單');
    }

    const companyName = await getSetting('company_name', '一帆安全整合有限公司');
    const companyPhone = await getSetting('company_phone', '02-7730-1158');
    const companyAddress = await getSetting('company_address', '台北市大安區四維路14巷15號7樓之1');
    const companyEmail = await getSetting('company_email', 'safekings@gmail.com');
    const companyStampUrl = await getSetting('invoice_stamp_url', await getSetting('company_stamp_url', ''));
    const invoiceNoteFooter = await getSetting('invoice_note_footer', '');
    const bankAccountInfo = await getSetting<any>('bank_account_info', {});

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
    let subtotal = Number(quote.subtotalAmount);
    let total = Number(quote.totalAmount);

    if (quote.selectedVariantId) {
        displayItems = quote.items.filter((item: any) => !item.variantId || item.variantId === quote.selectedVariantId);
        const variant = quote.variants.find((v: any) => v.id === quote.selectedVariantId);
        if (variant) {
            subtotal = Number(variant.subtotalAmount);
            total = Number(variant.totalAmount);
        }
    } else {
        displayItems = quote.items;
    }

    const discount = Number(quote.discountAmount);
    const transport = Number(quote.transportFee || 0);
    const taxRate = Number(quote.taxRate);

    // Tax calculation
    let preTax = total;
    let taxAmount = 0;
    let grandTotal = total;
    if (taxRate > 0) {
        taxAmount = Math.round(total * taxRate / 100);
        grandTotal = total + taxAmount;
    }

    // Payment Info
    const payments = await prisma.payment.findMany({
        where: { quoteId: quote.id }
    });
    const paidTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceDue = grandTotal - paidTotal;

    // Signature
    const latestSignature = quote.signatures && quote.signatures.length > 0 ? quote.signatures[0] : null;
    let signatureBase64Html = '';
    if (latestSignature && latestSignature.signatureImage) {
        try {
            const signatureImagePath = path.join(process.cwd(), 'public', latestSignature.signatureImage);
            if (fs.existsSync(signatureImagePath)) {
                const imageBuffer = fs.readFileSync(signatureImagePath);
                const base64Image = imageBuffer.toString('base64');
                signatureBase64Html = `<img src="data:image/png;base64,${base64Image}" style="height: 60px; max-width: 180px; object-fit: contain; margin-top: -10px; margin-bottom: -15px;" />`;
            }
        } catch (err) { console.warn('Failed to load signature image:', err); }
    }

    // Contact HTML
    const contactsHtml = (quote.contacts && quote.contacts.length > 0)
        ? quote.contacts.map((qc: any) => {
            const c = qc.contact;
            if (!c) return '';
            const mobile = formatMobile(c.mobile || '');
            const phone = formatPhone(c.phone || '');
            const phones = [mobile, phone].filter(Boolean);
            return `
                <div style="margin-bottom: 2px; line-height: 1.2; display: flex; align-items: baseline;">
                    <span style="font-weight: 700; color: ${BRAND.gray900}; font-size: 13.5px; margin-right: 8px; white-space: nowrap;">${c.name}</span>
                    <span style="color: ${BRAND.gray400}; font-size: 11.5px;">${phones.join(' / ')}</span>
                </div>
            `;
        }).join('')
        : '';

    // Chunking
    const ITEMS_PER_PAGE = 14;
    const pageHtmls: string[] = [];
    const totalPages = Math.ceil(displayItems.length / ITEMS_PER_PAGE) || 1;

    for (let i = 0; i < totalPages; i++) {
        const chunk = displayItems.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE);
        const isLastPage = i === totalPages - 1;

        let pageContent = `
            <div class="top-accent"></div>
            ${renderHeader(quote, settings, '請款單', { overrideDate: new Date(), hideExpiry: true })}
            <div class="title-section">
                <div class="main-title">
                    <div class="title-ch">${formatDocTitle(quote.name, '請款單')}</div>
                    <div class="title-en" style="font-size: 10px; margin-top: 2px;">REQUEST FOR PAYMENT / INVOICE</div>
                </div>
            </div>
            ${renderCustomerInfo(quote, contactsHtml)}
            
            <div class="table-section">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>品名 / 規格描述</th>
                            <th class="text-center">數量</th>
                            <th class="text-center">單位</th>
                            <th class="text-right">單價</th>
                            <th class="text-right">小計</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${chunk.map((item: any, idx: number) => `
                            <tr>
                                <td class="text-center" style="color: ${BRAND.gray400};">${i * ITEMS_PER_PAGE + idx + 1}</td>
                                <td>
                                    <div class="item-name">${item.name}</div>
                                    ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                                </td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-center">${item.unit || ''}</td>
                                <td class="text-right">$${Number(item.unitPrice).toLocaleString()}</td>
                                <td class="text-right" style="font-weight: 700;">$${Number(item.subtotal).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        if (isLastPage) {
            pageContent += `
                <div class="summary-notes-footer">
                    <div class="summary-section">
                        <div style="flex: 1;">
                            <div class="notes-box">
                                <span class="notes-title">📝 請款備註 INVOICE NOTES</span>
                                <div style="white-space: pre-wrap;">${(invoiceNoteFooter || '請於收到請款單後於約定期限內完成付款，謝謝您。').replace(/\\n/g, '\n')}</div>
                            </div>
                            
                            ${(typeof bankAccountInfo === 'string' && bankAccountInfo.trim()) || (typeof bankAccountInfo === 'object' && (bankAccountInfo?.bankName || bankAccountInfo?.bank_name)) ? `
                            <div style="margin-top: 15px; padding: 15px; background: ${BRAND.tealLight}; border-radius: 12px; border: 1px solid ${BRAND.teal}33;">
                                <div style="font-size: 11px; font-weight: 900; color: ${BRAND.teal}; margin-bottom: 8px;">💰 匯款資訊 BANK TRANSFER INFO</div>
                                <div style="font-size: 12px; line-height: 1.6; color: ${BRAND.gray800};">
                                    ${typeof bankAccountInfo === 'string' ? `
                                        <div style="white-space: pre-wrap;">${bankAccountInfo}</div>
                                    ` : `
                                        <strong>戶名：</strong> ${bankAccountInfo.accountName || bankAccountInfo.account_name || companyName}<br/>
                                        <strong>銀行：</strong> ${bankAccountInfo.bankName || bankAccountInfo.bank_name}<br/>
                                        <strong>帳號：</strong> <span style="font-family: monospace; font-weight: 900; letter-spacing: 1px; font-size: 14px;">${bankAccountInfo.accountNumber || bankAccountInfo.account_number}</span>
                                    `}
                                </div>
                            </div>` : ''}
                        </div>
                        
                        <div class="totals-box">
                            <div class="total-row"><span>小計</span><span style="font-weight: 600;">$${subtotal.toLocaleString()}</span></div>
                            ${discount > 0 ? `<div class="total-row discount"><span>優惠折扣</span><span>-$${discount.toLocaleString()}</span></div>` : ''}
                            ${transport > 0 ? `<div class="total-row"><span>車馬費</span><span>$${transport.toLocaleString()}</span></div>` : ''}
                            ${taxRate > 0 ? `
                                <div class="total-row"><span>${discount > 0 ? '折後金額' : '應計小計'}</span><span>$${preTax.toLocaleString()}</span></div>
                                <div class="total-row"><span>營業稅（${taxRate}%）</span><span>$${taxAmount.toLocaleString()}</span></div>
                            ` : ''}
                            <div class="grand-total-divider"></div>
                            <div class="grand-total-row">
                                <span style="font-size: 14px; font-weight: 700;">應收總額</span>
                                <span style="font-size: 20px; font-weight: 800;">$${grandTotal.toLocaleString()}</span>
                            </div>
                            ${paidTotal > 0 ? `
                                <div class="total-row" style="margin-top: 8px; border-bottom: none; color: ${BRAND.teal};">
                                    <span style="font-weight: 700;">已收金額</span>
                                    <span style="font-weight: 700;">$${paidTotal.toLocaleString()}</span>
                                </div>
                                <div class="total-row" style="background: ${BRAND.primary}11; border-radius: 8px; padding: 8px 12px; margin-top: 4px; border: 1px solid ${BRAND.primary}22;">
                                    <span style="font-weight: 900; color: ${BRAND.primary};">本次請款</span>
                                    <span style="font-weight: 900; color: ${BRAND.primary}; font-size: 16px;">$${balanceDue.toLocaleString()}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${renderSigningArea(quote, settings, latestSignature, signatureBase64Html, { showCustomerSignature: false })}
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
