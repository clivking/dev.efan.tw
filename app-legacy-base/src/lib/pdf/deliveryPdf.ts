import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { formatMobile, formatPhone } from '@/lib/phone-format';
import fs from 'fs';
import path from 'path';
import { pdfStyles } from './shared/styles';
import { renderHeader } from './shared/header';
import { renderCustomerInfo } from './shared/customerInfo';
import { renderFooter, renderSigningArea } from './shared/footer';
import { BRAND } from './generator';
import { formatDocTitle } from '@/lib/utils';
import { getPdfFontFaceCss } from '@/lib/pdf/fonts';
import { getConfiguredSiteOrigin } from '@/lib/site-url';

export async function generateDeliveryPdf(quote: any, baseUrl = getConfiguredSiteOrigin()): Promise<Buffer> {
    // Check status
    const allowedStatuses = ['signed', 'construction', 'completed', 'paid'];
    if (!allowedStatuses.includes(quote.status)) {
        throw new Error('報價狀態不符，無法產生出貨單');
    }

    const companyName = await getSetting('company_name', '一帆安全整合有限公司');
    const companyPhone = await getSetting('company_phone', '02-7730-1158');
    const companyAddress = await getSetting('company_address', '台北市大安區四維路14巷15號7樓之1');
    const companyEmail = await getSetting('company_email', 'safekings@gmail.com');
    const companyStampUrl = await getSetting('delivery_stamp_url', await getSetting('company_stamp_url', ''));
    const deliveryNoteFooter = await getSetting('delivery_note_footer', '');
    const removeHiddenItems = await getSetting('remove_hidden_items_for_delivery', true);

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

    // 出貨單只顯示實際需要出貨的項目：
    // 1. 眼睛遮住的隱藏項目不顯示
    // 2. 0 元或 0 數量的選購項目不顯示
    displayItems = displayItems.filter((item: any) => {
        if (removeHiddenItems && item.isHiddenItem) return false;
        if (Number(item.quantity || 0) <= 0) return false;
        return Number(item.subtotal || 0) > 0;
    });

    // Bundle Expansion Logic
    const finalItems: any[] = [];
    const expandedBundles: any[] = [];

    for (const item of displayItems) {
        if (item.productId) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: { bundleItems: { include: { product: true } } }
            });

            if (product && product.type === 'bundle' && product.bundleItems.length > 0) {
                expandedBundles.push({
                    name: item.name,
                    items: product.bundleItems.map((bi: any) => ({
                        name: bi.product.quoteName || bi.product.name,
                        quantity: bi.quantity * item.quantity
                    }))
                });
            }
        }
        finalItems.push(item);
    }

    // Generate contact HTML
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

    // Chunking items
    const ITEMS_PER_PAGE = 18;
    const pageHtmls: string[] = [];
    const totalPages = Math.ceil(finalItems.length / ITEMS_PER_PAGE) || 1;

    for (let i = 0; i < totalPages; i++) {
        const chunk = finalItems.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE);
        const isLastPage = i === totalPages - 1;

        let pageContent = `
            <div class="top-accent"></div>
            ${renderHeader(quote, settings, '出貨單', { overrideDate: new Date(), hideExpiry: true })}
            <div class="title-section">
                <div class="main-title">
                    <div class="title-ch">${formatDocTitle(quote.name, '出貨單')}</div>
                    <div class="title-en" style="font-size: 10px; margin-top: 2px;">DELIVERY ORDER / PACKING LIST</div>
                </div>
            </div>
            ${renderCustomerInfo(quote, contactsHtml)}
            
            <div class="table-section">
                <div style="background: ${BRAND.gray50}; padding: 8px 16px; border-radius: 8px 8px 0 0; border-bottom: 2px solid ${BRAND.primary}; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; font-weight: 900; color: ${BRAND.primary}; letter-spacing: 1px;">出貨明細 ITEMS</span>
                    <span style="font-size: 10px; color: ${BRAND.gray400}; font-weight: bold;">出貨日期：${quote.completedAt ? format(new Date(quote.completedAt), 'yyyy / MM / dd') : '____年____月____日'}</span>
                </div>
                <table class="items-table" style="border: 1px solid ${BRAND.gray100}; border-top: none;">
                    <thead>
                        <tr>
                            <th style="background: ${BRAND.gray100}; color: ${BRAND.gray600}; font-weight: 800; border-bottom: 2px solid ${BRAND.gray200};">#</th>
                            <th style="background: ${BRAND.gray100}; color: ${BRAND.gray600}; font-weight: 800; border-bottom: 2px solid ${BRAND.gray200};">品名 / 規格描述</th>
                            <th style="background: ${BRAND.gray100}; color: ${BRAND.gray600}; font-weight: 800; border-bottom: 2px solid ${BRAND.gray200}; text-align: center;">數量</th>
                            <th style="background: ${BRAND.gray100}; color: ${BRAND.gray600}; font-weight: 800; border-bottom: 2px solid ${BRAND.gray200}; text-align: center;">單位</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${chunk.map((item, idx) => `
                            <tr>
                                <td class="text-center" style="color: ${BRAND.gray400}; font-weight: 600;">${i * ITEMS_PER_PAGE + idx + 1}</td>
                                <td>
                                    <div class="item-name">${item.name}</div>
                                    ${item.description ? `<div class="item-desc" style="color: ${BRAND.gray400}; font-size: 10px;">${item.description}</div>` : ''}
                                </td>
                                <td class="text-center" style="font-weight: 800; font-size: 14px; color: ${BRAND.primary};">${item.quantity}</td>
                                <td class="text-center" style="color: ${BRAND.gray600};">${item.unit || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        if (isLastPage) {
            pageContent += `
                <div class="summary-notes-footer" style="padding-top: 10px;">
                    ${expandedBundles.length > 0 ? `
                    <div style="margin: 0 44px 15px; padding: 15px; background: ${BRAND.gray50}; border-radius: 12px; border: 1px dashed ${BRAND.gray200};">
                        <div style="font-size: 11px; font-weight: 900; color: ${BRAND.primary}; margin-bottom: 8px; border-bottom: 1px solid ${BRAND.gray200}; padding-bottom: 4px;">套餐內容明細 (BUNDLE COMPONENTS)</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            ${expandedBundles.map(bundle => `
                                <div style="font-size: 10px; color: ${BRAND.gray600};">
                                    <strong style="color: ${BRAND.teal};">「${bundle.name}」包含：</strong><br/>
                                    ${bundle.items.map((bi: any) => `&nbsp;&nbsp;• ${bi.name} × ${bi.quantity}`).join('<br/>')}
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}

                    <div class="summary-section">
                        <div style="flex: 1;">
                            <div class="notes-box" style="background: ${BRAND.gray50}; border-left-color: ${BRAND.gray400};">
                                <span class="notes-title" style="color: ${BRAND.gray600}; border-bottom-color: ${BRAND.gray200};">📝 出貨備註 DELIVERY NOTES</span>
                                <div style="white-space: pre-wrap; font-size: 11px; line-height: 1.6; color: ${BRAND.gray600};">${(deliveryNoteFooter || '本出貨單所列設備經客戶點收無誤，如有瑕疵請於三日內提出。').replace(/\\n/g, '\n')}</div>
                            </div>
                        </div>
                    </div>

                    ${renderSigningArea(quote, settings, null, '', { showCustomerSignature: false })}
                </div>
            `;
        }

        pageHtmls.push(`
            <div class="page-container ${isLastPage ? 'last-page' : ''}">
                ${pageContent}
                ${renderFooter(i + 1, totalPages)}
            </div>
        `);
    }

    const fontFaceCss = getPdfFontFaceCss();

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>${fontFaceCss}
${pdfStyles}</style>
        </head>
        <body>
            ${pageHtmls.join('')}
        </body>
        </html>
    `;

    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
        headless: true
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();
    return Buffer.from(pdf);
}
