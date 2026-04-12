import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { formatMobile, formatPhone, formatPhoneNumber } from '@/lib/phone-format';
import fs from 'fs';
import path from 'path';
import { getPdfFontFaceCss } from '@/lib/pdf/fonts';
import { getConfiguredSiteOrigin, toAbsoluteUrl } from '@/lib/site-url';
import { getPrivateAbsolutePath } from '@/lib/private-files';

// BRAND Colors
export const BRAND = {
    primary: "#1B3A5C",
    primaryLight: "#2A5A8C",
    accent: "#E8792B",
    accentLight: "#FFF3EB",
    teal: "#0D7377",
    tealLight: "#E6F5F5",
    gray50: "#FAFBFC",
    gray100: "#F3F5F7",
    gray200: "#CBD5E1",
    gray400: "#64748B",
    gray600: "#475569",
    gray800: "#2D3748",
    gray900: "#1A202C",
    white: "#FFFFFF",
};

import { formatDocTitle } from '@/lib/utils';

export async function generateQuotePdf(quote: any, baseUrl = getConfiguredSiteOrigin()): Promise<Buffer> {
    const showCustomerNote = await getSetting('show_customer_note_on_pdf', true);
    const companyName = await getSetting('company_name', '一帆安全整合有限公司');
    const companyPhone = await getSetting('company_phone', '02-7730-1158');
    const companyAddress = await getSetting('company_address', '台北市大安區四維路14巷15號7樓之1');
    const companyEmail = await getSetting('company_email', 'safekings@gmail.com');
    const companyStampUrl = await getSetting('company_stamp_url', '');

    const getAbsoluteUrl = (url: string) => {
        if (!url) return '';
        return toAbsoluteUrl(url, baseUrl);
    };

    // Convert stamp to base64 for reliable rendering in Puppeteer/Docker
    let absoluteStampUrl = '';
    if (companyStampUrl) {
        try {
            const localStampPath = companyStampUrl.replace(/^\/api\/uploads\//, '/uploads/');
            const stampPath = path.join(process.cwd(), 'public', localStampPath);
            if (fs.existsSync(stampPath)) {
                const stampBuffer = fs.readFileSync(stampPath);
                const ext = path.extname(stampPath).toLowerCase();
                const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
                absoluteStampUrl = `data:${mime};base64,${stampBuffer.toString('base64')}`;
            } else {
                absoluteStampUrl = getAbsoluteUrl(companyStampUrl);
            }
        } catch {
            absoluteStampUrl = getAbsoluteUrl(companyStampUrl);
        }
    }


    // Logo: prefer pdf_logo_url, fallback to company_logo_url
    const pdfLogoUrlRaw = await getSetting('pdf_logo_url', '');
    const logoUrlRaw = pdfLogoUrlRaw || await getSetting('company_logo_url', '');
    // Convert logo to base64 for reliable rendering in Puppeteer
    let absoluteLogoUrl = '';
    if (logoUrlRaw) {
        try {
            // Handle /api/uploads/... or /uploads/... paths
            const localPath = logoUrlRaw.replace(/^\/api\/uploads\//, '/uploads/');
            const logoPath = path.join(process.cwd(), 'public', localPath);
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                const ext = path.extname(logoPath).toLowerCase();
                const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
                absoluteLogoUrl = `data:${mime};base64,${logoBuffer.toString('base64')}`;
            } else {
                absoluteLogoUrl = getAbsoluteUrl(logoUrlRaw);
            }
        } catch {
            absoluteLogoUrl = getAbsoluteUrl(logoUrlRaw);
        }
    }

    // Handle Signature Image
    const latestSignature = quote.signatures && quote.signatures.length > 0 ? quote.signatures[0] : null;
    let signatureBase64Html = '';

    if (latestSignature && latestSignature.signatureImage) {
        try {
            const signatureImagePath = latestSignature.signatureImage.startsWith('signatures/')
                ? getPrivateAbsolutePath(latestSignature.signatureImage)
                : path.join(process.cwd(), 'public', latestSignature.signatureImage);
            if (fs.existsSync(signatureImagePath)) {
                const imageBuffer = fs.readFileSync(signatureImagePath);
                const base64Image = imageBuffer.toString('base64');
                signatureBase64Html = `<img src="data:image/png;base64,${base64Image}" style="height: 60px; max-width: 180px; object-fit: contain; margin-top: -10px; margin-bottom: -15px;" />`;
            }
        } catch (err) {
            console.error('Error reading signature image for PDF:', err);
        }
    }

    // Variant Logic
    const hasVariants = quote.variants && quote.variants.length > 0;
    const isSigned = ['signed', 'construction', 'completed', 'paid'].includes(quote.status);
    const selectedVariantId = quote.selectedVariantId;

    // Filter items based on variant logic
    let displayItems = [];
    let sharedItems = (quote.items || []).filter((item: any) => !item.variantId);
    let variantItemsMap: Record<string, any[]> = {};

    if (hasVariants) {
        quote.variants.forEach((v: any) => {
            variantItemsMap[v.id] = (quote.items || []).filter((item: any) => item.variantId === v.id);
        });
    }

    if (isSigned && selectedVariantId) {
        // Signed: Only show selected variant + shared items
        const selectedVariantItems = variantItemsMap[selectedVariantId] || [];
        displayItems = [...sharedItems, ...selectedVariantItems];
    } else if (!hasVariants) {
        // Traditional single variant
        displayItems = [...quote.items];
    } else {
        // Multi-variant UNSIGNED: We will handle this with a comparison layout
        displayItems = [...sharedItems];
    }

    // Calculation (Adjusted for variants)
    let subtotal = Number(quote.subtotalAmount);
    let total = Number(quote.totalAmount);

    if (isSigned && selectedVariantId) {
        const activeVariant = quote.variants.find((v: any) => v.id === selectedVariantId);
        if (activeVariant) {
            subtotal = Number(activeVariant.subtotalAmount);
            total = Number(activeVariant.totalAmount);
        }
    }

    const discount = Number(quote.discountAmount);
    const transport = Number(quote.transportFee || 0);
    const taxRate = Number(quote.taxRate);

    // totalAmount is PRE-TAX (subtotal - discount + transport), tax is added on top
    let preTax = total;
    let taxAmount = 0;
    let grandTotal = total;
    if (taxRate > 0) {
        taxAmount = Math.round(total * taxRate / 100);
        grandTotal = total + taxAmount;
    }

    // Generate contact HTML
    const contactsHtml = (quote.contacts && quote.contacts.length > 0)
        ? quote.contacts.map((qc: any) => {
            const c = qc.contact;
            if (!c) return '';
            const mobileFormatted = formatPhoneNumber(c.mobile || '');
            const phoneFormatted = formatPhoneNumber(c.phone || '');
            const phones = [mobileFormatted, phoneFormatted].filter(Boolean);

            return `
                <div style="margin-bottom: 2px; line-height: 1.2; display: flex; align-items: baseline;">
                    <span style="font-weight: 700; color: ${BRAND.gray900}; font-size: 13.5px; margin-right: 8px; white-space: nowrap;">${c.name}</span>
                    <span style="color: ${BRAND.gray400}; font-size: 11.5px;">${phones.join(' / ')}</span>
                </div>
            `;
        }).join('')
        : '';

    // Calculation for chunking
    const ITEMS_PER_FIRST_PAGE = 10;
    const ITEMS_PER_SUBSEQUENT_PAGE = 16;

    const pageHtmls: string[] = [];

    // --- Helper function to chunk items ---
    const chunkItems = (items: any[], isFirstChunk: boolean) => {
        const chunks: any[] = [];
        let remaining = [...items];
        let currentOffset = 0;

        if (isFirstChunk) {
            chunks.push({ items: remaining.splice(0, ITEMS_PER_FIRST_PAGE), offset: currentOffset });
            currentOffset += ITEMS_PER_FIRST_PAGE;
        }

        while (remaining.length > 0) {
            chunks.push({ items: remaining.splice(0, ITEMS_PER_SUBSEQUENT_PAGE), offset: currentOffset });
            currentOffset += ITEMS_PER_SUBSEQUENT_PAGE;
        }
        return chunks;
    };

    // --- CASE 1: Multi-variant UNSIGNED (Comparison + Sequential Details) ---
    if (!isSigned && hasVariants) {
        // Page 1: Comparison Table
        pageHtmls.push('__COMPARISON_PAGE__');

        // Shared Items (if any)
        if (sharedItems.length > 0) {
            const sharedChunks = chunkItems(sharedItems, false);
            sharedChunks.forEach((chunk, cIdx) => {
                const isLastInGroup = cIdx === sharedChunks.length - 1;
                pageHtmls.push('__ITEMS_PAGE_SHARED__' + JSON.stringify({ ...chunk, isLastInGroup }));
            });
        }

        // Individual Variant Details
        quote.variants.forEach((v: any) => {
            const vItems = variantItemsMap[v.id] || [];
            if (vItems.length > 0) {
                const vChunks = chunkItems(vItems, false);
                vChunks.forEach((chunk, idx) => {
                    const isLastInGroup = idx === vChunks.length - 1;
                    pageHtmls.push(`__ITEMS_PAGE_VARIANT_${v.id}_${idx}__` + JSON.stringify({ variant: v, ...chunk, isLastInGroup }));
                });
            }
        });
    } else {
        // --- CASE 2: Traditional or Signed (Single List) ---
        const chunks = chunkItems(displayItems, true);
        chunks.forEach((chunk, idx) => {
            const isLastInGroup = idx === chunks.length - 1;
            pageHtmls.push('__ITEMS_PAGE_STANDARD__' + JSON.stringify({ ...chunk, isLastInGroup }));
        });
    }

    const renderHeader = () => `
        <div class="header">
            <div class="logo-section" style="display: flex; align-items: center !important; gap: 18px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    ${absoluteLogoUrl
            ? `<img src="${absoluteLogoUrl}" class="logo-img" style="height: 52px;" />`
            : `<div class="logo-placeholder" style="width: 52px; height: 52px;">EFAN</div>`}
                    <div style="font-size: 8px; font-weight: 700; color: ${BRAND.gray400}; letter-spacing: 1px; font-family: sans-serif; opacity: 0.8; line-height: 1;">SINCE 1984</div>
                </div>
                <div class="company-info" style="display: inline-flex; flex-direction: column; width: fit-content;">
                    <div class="company-name" style="white-space: nowrap; margin: 0; font-size: 19px; font-weight: 900; color: ${BRAND.primary}; letter-spacing: 1.2px; line-height: 1;">${companyName}</div>
                    <div class="company-detail-row" style="text-align: justify; text-align-last: justify; color: ${BRAND.gray400}; font-size: 9px; line-height: 1; width: 100%; margin-top: 6px; letter-spacing: 0.5px; opacity: 0.9;">
                        <span>弱電系統整合｜門禁｜監視｜電話｜網路</span>
                        <span style="display: inline-block; width: 100%; height: 0;"></span>
                    </div>
                    <div class="company-detail-row" style="text-align: justify; text-align-last: justify; color: ${BRAND.gray400}; font-size: 8.5px; line-height: 1; width: 100%; margin-top: 1px;">
                        <span>${companyAddress}</span>
                        <span style="display: inline-block; width: 100%; height: 0;"></span>
                    </div>
                    <div class="company-detail-row" style="display: flex; justify-content: space-between; align-items: center; color: ${BRAND.gray400}; font-size: 8.5px; line-height: 1; width: 100%; letter-spacing: 0.5px; margin-top: 0px; white-space: nowrap;">
                        <span>${formatPhone(companyPhone)}</span>
                        <span style="color: ${BRAND.gray200}; font-weight: 300; margin: 0 4px;">|</span>
                        <span>${companyEmail}</span>
                    </div>
                </div>
            </div>
            <div class="quote-info">
                <div>報價編號：<span class="quote-id-val">${quote.quoteNumber}</span></div>
                <div>報價日期：${format(quote.createdAt, 'yyyy/MM/dd')}</div>
                <div>有效期限：<span class="valid-date-val">${format(quote.validUntil, 'yyyy/MM/dd')}</span></div>
            </div>
        </div>
    `;

    const renderFooter = (pageNum: number, total: number) => `
        <div class="footer-container">
            <div class="page-footer-text">第 ${pageNum} 頁 / 共 ${total} 頁</div>
            <div class="bottom-accent"></div>
        </div>
    `;

    // Generate local font CSS (no CDN dependency)
    const fontFaceCss = getPdfFontFaceCss();

    const html = `
<!-- Version: ${Date.now()} --><!-- CacheBust: ${Date.now()} -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        ${fontFaceCss}
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
        body { 
            margin: 0; padding: 0; 
            color: ${BRAND.gray800}; 
            background: #f0f2f5;
            font-family: "Inter", "Noto Sans TC", "Noto Sans CJK TC", sans-serif;
            line-height: 1.4;
        }
        
        .page-container {
            width: 210mm;
            height: 297mm;
            margin: 10mm auto;
            background: white;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        @media print {
            body { background: white; }
            .page-container { margin: 0; box-shadow: none; page-break-after: always; }
        }

        .top-accent { height: 5px; background: linear-gradient(90deg, ${BRAND.primary}, ${BRAND.teal}); }
        .header { padding: 30px 44px 0; display: flex; justify-content: space-between; align-items: center; }
        .logo-section { display: flex; align-items: center; gap: 18px; }
        .logo-img { height: 58px; width: auto; object-fit: contain; }
        .logo-placeholder { width: 58px; height: 58px; background: ${BRAND.primary}; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 800; }
        .company-name { font-family: "Noto Serif TC", "Noto Serif CJK TC", serif; font-size: 18px; font-weight: 900; color: ${BRAND.primary}; letter-spacing: 1.5px; }
        .company-details { display: none; }
        .company-detail-row { width: 100%; font-size: 9.5px; color: ${BRAND.gray400}; line-height: 1; margin: 0; }
        .quote-info { text-align: right; font-size: 11px; color: ${BRAND.gray600}; line-height: 1.8; }
        .quote-info div { margin-bottom: 2px; }
        .quote-id-val { color: ${BRAND.gray900}; font-weight: 700; }
        .valid-date-val { color: ${BRAND.accent}; font-weight: 600; }

        .title-section { text-align: center; padding: 8px 44px 2px; }
        .main-title { font-family: "Noto Serif TC", "Noto Serif CJK TC", serif; margin-bottom: 0px; }
        .title-ch { font-size: 24px; font-weight: 900; color: ${BRAND.primary}; letter-spacing: 8px; margin-bottom: 0px; }
        .title-en { font-size: 12px; font-weight: 700; color: ${BRAND.primaryLight}; letter-spacing: 2px; text-transform: uppercase; margin-top: -2px; opacity: 0.8; }
        .sub-title { display: inline-block; padding: 3px 20px; background: ${BRAND.tealLight}; border-radius: 20px; font-size: 13px; color: ${BRAND.teal}; font-weight: 700; margin-top: 10px; }

        .customer-card {
            margin: 18px 44px; padding: 16px 24px;
            background: ${BRAND.gray50}; border-radius: 8px;
            border-left: 4px solid ${BRAND.teal};
            display: flex; flex-direction: column; gap: 6px;
            font-size: 12.5px; line-height: 1.5;
        }
        .customer-row { display: flex; align-items: center; gap: 24px; width: 100%; }
        .customer-field { display: flex; align-items: center; min-width: 0; flex: 1; }
        .customer-field.grow { flex: 1.5; }
        .customer-field-label { color: ${BRAND.gray400}; min-width: 55px; white-space: nowrap; }
        .divider { margin: 0 8px; color: ${BRAND.gray200}; flex-shrink: 0; }
        .customer-field-value { font-weight: 700; color: ${BRAND.gray900}; }
        .text-nowrap { white-space: nowrap; }

        .table-section { padding: 4px 44px; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th { 
            background: ${BRAND.primary}; 
            padding: 8px 10px; 
            text-align: left; color: white; font-size: 11.5px; 
        }
        th:first-child { border-radius: 5px 0 0 0; }
        th:last-child { border-radius: 0 5px 0 0; }
        
        .items-table th:nth-child(1), .items-table td:nth-child(1) { width: 30px; text-align: center; }
        .items-table th:nth-child(2), .items-table td:nth-child(2) { text-align: left; padding-left: 14px; }
        .items-table th:nth-child(3), .items-table td:nth-child(3) { width: 40px; text-align: center; }
        .items-table th:nth-child(4), .items-table td:nth-child(4) { width: 40px; text-align: center; }
        .items-table th:nth-child(5), .items-table td:nth-child(5) { width: 75px; text-align: right; }
        .items-table th:nth-child(6), .items-table td:nth-child(6) { width: 85px; text-align: right; padding-right: 15px; }

        td { padding: 11px 10px; vertical-align: top; font-size: 11.5px; border-bottom: 1px solid ${BRAND.gray200}; }
        .item-name { font-size: 13px; font-weight: 700; color: ${BRAND.gray900}; margin-bottom: 2px; }
        .item-desc { font-size: 11px; color: ${BRAND.gray600}; line-height: 1.5; white-space: pre-wrap; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .comparison-table th { background: ${BRAND.primary}; padding: 12px; }
        .comparison-table td { padding: 15px 12px; font-size: 13px; }
        .recommended-badge { font-size: 10px; background: #fbbf24; color: white; padding: 2px 8px; border-radius: 10px; margin-left: 6px; }

        .summary-notes-footer { flex: 1; display: flex; flex-direction: column; margin-top: 0; width: 100%; }
        .summary-section { padding: 0 44px; display: flex; gap: 24px; justify-content: space-between; align-items: flex-start; margin-top: 12px; }
        .notes-box { flex: 1; padding: 12px 16px; background: ${BRAND.accentLight}; border-radius: 8px; border-left: 3px solid ${BRAND.accent}; font-size: 10.5px; line-height: 1.5; align-self: stretch; }
        .notes-title { font-size: 11px; font-weight: 700; color: ${BRAND.accent}; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; border-bottom: 1.5px solid rgba(232, 121, 43, 0.2); padding-bottom: 2px; }
        .totals-box { width: 280px; }
        .total-row { padding: 5px 12px; display: flex; justify-content: space-between; font-size: 12px; color: ${BRAND.gray600}; border-bottom: 1px dashed ${BRAND.gray200}; align-items: center; }
        .total-row.discount { color: #f97316; font-weight: 700; background: #fff7ed; border-radius: 4px; border-bottom: none; margin: 2px 0; }
        .grand-total-divider { height: 1.5px; background: ${BRAND.gray200}; margin: 6px 0 2px; }
        .grand-total-row { padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.teal}); border-radius: 0 0 10px 10px; color: white; margin-top: 0; }

        .footer-signing { padding: 0 44px 10px !important; display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
        .stamp-section { display: flex; align-items: center; gap: 15px; width: auto; position: relative; }
        .stamp-image { width: 140px; height: auto; margin-bottom: -10px; }
        .signature-label { font-size: 13.5px; font-weight: 700; color: ${BRAND.gray900}; font-family: "Noto Sans TC", "Noto Sans CJK TC", sans-serif; }
        .signature-line { display: inline-block; width: 150px; border-bottom: 1.5px solid ${BRAND.gray400}; margin-left: 4px; position: relative; }
        .signature-image-overlay { position: absolute; left: 0; bottom: 5px; width: 100%; }
        .signer-info-text { font-size: 10px; color: ${BRAND.gray600}; margin-top: 2px; }
        .service-hint { font-size: 11.5px; color: ${BRAND.gray600}; margin-top: 5px; text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 4px; }

        .footer-container { padding: 0 0 8px !important; position: relative; width: 100%; margin-top: auto; }
        .bottom-accent { height: 1.5px !important; background: linear-gradient(90deg, ${BRAND.primary}, ${BRAND.teal}); width: 100%; }
        .page-footer-text { text-align: center; font-size: 10.5px; color: ${BRAND.gray400}; margin-bottom: 2px !important; font-weight: 500; }
        
        .page-container:not(.last-page) .bottom-accent { display: none; }
        .page-container:not(.last-page) .footer-container { margin-top: auto; padding-bottom: 20px !important; }

        .variant-header {
            margin: 20px 44px 5px; padding: 10px 20px;
            background: ${BRAND.tealLight}; border-radius: 12px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .variant-title { font-size: 16px; font-weight: 900; color: ${BRAND.teal}; }
    </style>
</head>
<body>
    ${pageHtmls.map((pageType, idx) => {
        const pageNum = idx + 1;
        const isLastPage = pageNum === pageHtmls.length;
        const isFirstPage = pageNum === 1;

        // Header and Footer elements are common
        let pageContent = `
            <div class="top-accent"></div>
            ${renderHeader()}
        `;

        if (pageType === '__COMPARISON_PAGE__') {
            pageContent += `
                <div class="title-section">
                    <div class="main-title">
                        <div class="title-ch">${formatDocTitle(quote.name, '報價單')}</div>
                        <div class="sub-title">方案比較表 COMPARISON SUMMARY</div>
                    </div>
                </div>
                <div class="customer-card">
                    ${quote.companyName?.companyName ? `
                    <div class="customer-row">
                        <div class="customer-field">
                            <span class="customer-field-label">公司名稱</span><span class="divider">│</span>
                            <div style="flex: 1; min-width: 0;">
                                <div class="customer-field-value">${quote.companyName.companyName}</div>
                                ${quote.companyName?.taxId ? `<div style="font-size: 11px; color: ${BRAND.gray600}; margin-top: 2px;">統一編號：${quote.companyName.taxId}</div>` : ''}
                            </div>
                        </div>
                    </div>` : ''}
                    <div class="customer-row">
                        <div class="customer-field">
                            <span class="customer-field-label">聯絡窗口</span><span class="divider">│</span>
                            <div class="customer-field-value">${contactsHtml || '無'}</div>
                        </div>
                    </div>
                </div>

                <div class="table-section" style="margin-top: 20px;">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th style="text-align: left; border-radius: 12px 0 0 0;">方案名稱</th>
                                <th style="text-align: right;">小計金額</th>
                                <th style="text-align: right; border-radius: 0 12px 0 0;">總計金額 (含稅)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${quote.variants.map((v: any) => `
                                <tr>
                                    <td style="font-weight: 800; color: ${BRAND.primary};">
                                        ${v.name}
                                        ${v.isRecommended ? '<span class="recommended-badge">最佳建議</span>' : ''}
                                    </td>
                                    <td style="text-align: right; font-weight: 600;">$${Number(v.subtotalAmount).toLocaleString()}</td>
                                    <td style="text-align: right; font-weight: 900; font-size: 16px; color: ${BRAND.teal};">$${Number(v.totalAmount).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 40px; padding: 25px; background: ${BRAND.gray50}; border-radius: 15px; border: 1px dashed ${BRAND.gray200}; text-align: center;">
                        <div style="font-size: 14px; color: ${BRAND.gray600}; margin-bottom: 10px;">
                            以上各方案明細詳見後續頁面
                        </div>
                        <div style="font-size: 12px; color: ${BRAND.gray400};">
                            您可以點擊報價單連結直接在線上選擇您滿意的方案並完成簽核
                        </div>
                    </div>
                </div>
            `;
        } else {
            // It's an items page (Standard, Shared, or Variant)
            let items: any[] = [];
            let variant: any = null;
            let pageTitle = '';
            let isLastInGroup = false;
            let offset = 0;

            if (pageType.startsWith('__ITEMS_PAGE_STANDARD__')) {
                const data = JSON.parse(pageType.replace('__ITEMS_PAGE_STANDARD__', ''));
                items = data.items;
                offset = data.offset;
                isLastInGroup = data.isLastInGroup;
                if (isFirstPage) pageTitle = '報價明細';
            } else if (pageType.startsWith('__ITEMS_PAGE_SHARED__')) {
                const data = JSON.parse(pageType.replace('__ITEMS_PAGE_SHARED__', ''));
                items = data.items;
                offset = data.offset;
                isLastInGroup = data.isLastInGroup;
                pageTitle = '共同必備項目 (SHARED ITEMS)';
            } else if (pageType.startsWith('__ITEMS_PAGE_VARIANT_')) {
                const parts = pageType.split('__');
                const data = JSON.parse(parts[parts.length - 1]);
                items = data.items;
                offset = data.offset;
                isLastInGroup = data.isLastInGroup;
                variant = data.variant;
                pageTitle = `方案明細：${variant.name}`;
            }

            if (isFirstPage && pageType.startsWith('__ITEMS_PAGE_STANDARD__')) {
                pageContent += `
                    <div class="title-section">
                        <div class="main-title">
                            <div class="title-ch">${formatDocTitle(quote.name, '報價單')}</div>

                        </div>
                    </div>
                    <div class="customer-card">
                        <div class="customer-row">
                            ${quote.companyName?.companyName ? `
                            <div class="customer-field" style="flex: 1.2;">
                                <span class="customer-field-label">公司名稱</span><span class="divider">│</span>
                                <div style="flex: 1; min-width: 0;">
                                    <div class="customer-field-value">${quote.companyName.companyName}</div>
                                    ${quote.companyName?.taxId ? `<div style="font-size: 11px; color: ${BRAND.gray600}; margin-top: 2px;">統一編號：${quote.companyName.taxId}</div>` : ''}
                                </div>
                            </div>` : ''}
                            ${quote.location?.address ? `
                            <div class="customer-field" style="flex: 1;">
                                <span class="customer-field-label">案場地址</span><span class="divider">│</span>
                                <span class="customer-field-value">${quote.location.address}</span>
                            </div>` : ''}
                        </div>
                        <div class="customer-row">
                            <div class="customer-field">
                                <span class="customer-field-label">聯絡窗口</span><span class="divider">│</span>
                                <div class="customer-field-value">
                                    ${contactsHtml || '<span>無</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else if (pageTitle) {
                pageContent += `
                    <div class="variant-header">
                        <div class="variant-title">${pageTitle}</div>
                        ${variant && variant.isRecommended ? '<span class="recommended-badge" style="font-size: 12px; padding: 4px 12px;">⭐ 推薦方案</span>' : ''}
                    </div>
                `;
            }

            pageContent += `
                <div class="table-section">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>品名 / 說明</th>
                                <th>數量</th>
                                <th>單位</th>
                                <th>單價</th>
                                <th>小計</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((item, iIdx) => `
                                <tr>
                                    <td class="text-center" style="color: ${BRAND.gray400}; font-weight: 600;">${offset + iIdx + 1}</td>
                                    <td>
                                        <div class="item-name">${item.name}</div>
                                        ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                                    </td>
                                    <td class="text-center">${item.quantity === 0 ? '<span style="color:#ea580c;font-weight:bold;">選購</span>' : item.quantity}</td>
                                    <td class="text-center" style="color: ${BRAND.gray600};">${item.unit || ''}</td>
                                    <td class="text-right" style="color: ${BRAND.gray800};">$${Number(item.unitPrice).toLocaleString()}</td>
                                    <td class="text-right" style="font-weight: 700; color: ${BRAND.gray900};">$${Number(item.subtotal).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            if (isLastInGroup) {
                // For variant details, we need to use variant totals
                let currentSubtotal = subtotal;
                let currentPreTax = preTax;
                let currentDiscount = discount;
                let currentTransport = transport;
                let currentTaxAmount = taxAmount;
                let currentGrandTotal = grandTotal;

                if (variant) {
                    currentSubtotal = Number(variant.subtotalAmount);
                    currentPreTax = Number(variant.totalAmount); // totalAmount is pre-tax
                    // Forward-calculate tax for this variant
                    if (taxRate > 0) {
                        currentTaxAmount = Math.round(currentPreTax * taxRate / 100);
                        currentGrandTotal = currentPreTax + currentTaxAmount;
                    } else {
                        currentTaxAmount = 0;
                        currentGrandTotal = currentPreTax;
                    }
                }

                pageContent += `
                    <div class="summary-notes-footer">
                        <div class="summary-section">
                            <div style="flex: 1;">
                                ${(showCustomerNote && quote.customerNote) ? `
                                <div class="notes-box">
                                    <span class="notes-title">📝 工程說明與保固條款</span>
                                    <div style="white-space: pre-wrap;">${quote.customerNote}</div>
                                </div>` : ''}
                            </div>
                            <div class="totals-box">
                                <div class="total-row">
                                    <span>小計</span>
                                    <span style="font-weight: 600;">$${currentSubtotal.toLocaleString()}</span>
                                </div>
                                ${currentDiscount > 0 ? `
                                <div class="total-row discount">
                                    <span>優惠折扣${quote.discountNote ? `<span style="font-weight: 400; font-size: 10px; margin-left: 4px;">（${quote.discountNote}）</span>` : ''}</span>
                                    <span>-$${currentDiscount.toLocaleString()}</span>
                                </div>` : ''}
                                ${currentTransport > 0 ? `
                                <div class="total-row">
                                    <span>車馬費 / 運費</span>
                                    <span>$${currentTransport.toLocaleString()}</span>
                                </div>` : ''}
                                ${taxRate > 0 ? `
                                ${currentPreTax !== currentSubtotal ? `
                                <div class="total-row">
                                    <span>${currentDiscount > 0 ? '折後金額' : '應計小計'}</span>
                                    <span>$${currentPreTax.toLocaleString()}</span>
                                </div>` : ''}
                                <div class="total-row">
                                    <span>營業稅（${taxRate}%）</span>
                                    <span>$${currentTaxAmount.toLocaleString()}</span>
                                </div>` : ''}
                                <div class="grand-total-divider"></div>
                                <div class="grand-total-row">
                                    <span style="font-size: 14px; font-weight: 700; letter-spacing: 2px;">金額總計</span>
                                    <span style="font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">$${currentGrandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div class="footer-signing">
                            <div class="stamp-section">
                                <div class="signature-label">公司用印</div>
                                ${absoluteStampUrl ? `<img src="${absoluteStampUrl}" class="stamp-image" />` : ''}
                            </div>
                            <div style="text-align: right;">
                                <div class="signature-label">
                                    客戶確認簽章：
                                    <span class="signature-line">
                                        ${signatureBase64Html ? `
                                        <div class="signature-image-overlay">
                                            ${signatureBase64Html}
                                            <div class="signer-info-text">
                                                簽名人：${latestSignature.signerName} ${latestSignature.signerTitle ? `/ ${latestSignature.signerTitle}` : ''} | 
                                                日期：${format(latestSignature.signedAt, 'yyyy/MM/dd')}
                                            </div>
                                        </div>` : ''}
                                    </span>
                                </div>
                                <div class="service-hint">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.11-2.11a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                    如有疑問歡迎來電 ${formatPhoneNumber(companyPhone)}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        return `
            <div class="page-container ${isLastPage ? 'last-page' : ''}">
                ${pageContent}
                ${renderFooter(pageNum, pageHtmls.length)}
            </div>
        `;
    }).join('')}
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
