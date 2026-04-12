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
import { getConfiguredSiteOrigin } from '@/lib/site-url';

const PAYMENT_TYPE_LABELS: Record<string, string> = {
    deposit: '訂金',
    final: '尾款',
    full: '全額'
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    transfer: '轉帳',
    cash: '現金',
    check: '支票'
};

export async function generateReceiptPdf(
    quote: any,
    payment: any | null,
    baseUrl = getConfiguredSiteOrigin()
): Promise<Buffer> {
    const displayPayment = payment ?? {
        id: null,
        type: '',
        method: '',
        paidAt: new Date().toISOString(),
        amount: 0,
        notes: '',
        recorder: null
    };

    const companyName = await getSetting('company_name', '一帆科技股份有限公司');
    const companyPhone = await getSetting('company_phone', '02-7730-1158');
    const companyAddress = await getSetting('company_address', '台北市中山區民權東路二段46號5樓之1');
    const companyEmail = await getSetting('company_email', 'safekings@gmail.com');
    const companyStampUrl = await getSetting('receipt_stamp_url', await getSetting('company_stamp_url', ''));
    const receiptNoteFooter = await getSetting(
        'receipt_note_footer',
        '本收據可先行存檔；若尚未收款，金額欄位會保留為 0 以供後續補登。'
    );

    const { resolvePdfLogoUrl, resolveImageToBase64OrUrl } = await import('./shared/imageUtils');
    const settings = {
        logoUrl: await resolvePdfLogoUrl(baseUrl),
        companyName,
        companyAddress,
        companyPhone: formatPhone(companyPhone),
        companyEmail,
        companyStampUrl: resolveImageToBase64OrUrl(companyStampUrl, baseUrl)
    };

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

    const paymentSequence = [...(quote.payments || [])].sort((a: any, b: any) => {
        const paidAtDiff = new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime();
        if (paidAtDiff !== 0) return paidAtDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    const selectedPaymentIndex = displayPayment.id
        ? paymentSequence.findIndex((entry: any) => entry.id === displayPayment.id)
        : -1;
    const cumulativePaid = displayPayment.id
        ? paymentSequence
            .slice(0, selectedPaymentIndex >= 0 ? selectedPaymentIndex + 1 : paymentSequence.length)
            .reduce((sum: number, entry: any) => sum + Number(entry.amount), 0)
        : 0;

    const preTaxAmount = quote.selectedVariantId
        ? Number(quote.variants?.find((variant: any) => variant.id === quote.selectedVariantId)?.totalAmount ?? quote.totalAmount)
        : Number(quote.totalAmount);
    const taxRate = Number(quote.taxRate || 0);
    const taxAmount = Math.round(preTaxAmount * taxRate / 100);
    const contractTotal = preTaxAmount + taxAmount;
    const remainingAmount = Math.max(0, contractTotal - cumulativePaid);

    const itemsHtml = (quote.items || [])
        .filter((item: any) => !quote.selectedVariantId || !item.variantId || item.variantId === quote.selectedVariantId)
        .slice(0, 8)
        .map((item: any, idx: number) => `
            <tr>
                <td class="text-center" style="color: ${BRAND.gray400};">${idx + 1}</td>
                <td>
                    <div class="item-name">${item.name}</div>
                    ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-center">${item.unit || ''}</td>
                <td class="text-right">$${Number(item.subtotal).toLocaleString()}</td>
            </tr>
        `).join('');

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
            <div class="page-container last-page">
                <div class="top-accent"></div>
                ${renderHeader(quote, settings, '收據單', { overrideDate: new Date(displayPayment.paidAt), hideExpiry: true })}
                <div class="title-section">
                    <div class="main-title">
                        <div class="title-ch">${formatDocTitle(quote.name, '收據單')}</div>
                        <div class="title-en" style="font-size: 10px; margin-top: 2px;">PAYMENT RECEIPT</div>
                    </div>
                </div>
                ${renderCustomerInfo(quote, contactsHtml)}

                <div style="margin: 0 44px 16px; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 14px;">
                    <div style="padding: 16px 18px; border: 1px solid ${BRAND.gray200}; border-radius: 14px; background: white;">
                        <div style="font-size: 11px; font-weight: 900; color: ${BRAND.primary}; margin-bottom: 12px;">收款資訊 PAYMENT DETAILS</div>
                        <div style="display: grid; grid-template-columns: 100px 1fr; row-gap: 8px; font-size: 12px; color: ${BRAND.gray600};">
                            <div style="color: ${BRAND.gray400};">收據日期</div>
                            <div style="font-weight: 700;">${format(new Date(displayPayment.paidAt), 'yyyy / MM / dd')}</div>
                            <div style="color: ${BRAND.gray400};">付款性質</div>
                            <div style="font-weight: 700;">${PAYMENT_TYPE_LABELS[displayPayment.type] || '--'}</div>
                            <div style="color: ${BRAND.gray400};">付款方式</div>
                            <div style="font-weight: 700;">${PAYMENT_METHOD_LABELS[displayPayment.method] || '--'}</div>
                            <div style="color: ${BRAND.gray400};">收款人員</div>
                            <div style="font-weight: 700;">${displayPayment.recorder?.name || '--'}</div>
                            <div style="color: ${BRAND.gray400};">備註</div>
                            <div style="font-weight: 700;">${displayPayment.notes || '--'}</div>
                        </div>
                    </div>

                    <div style="padding: 16px 18px; border-radius: 14px; background: ${BRAND.primary}08; border: 1px solid ${BRAND.primary}22;">
                        <div style="font-size: 11px; font-weight: 900; color: ${BRAND.primary}; margin-bottom: 12px;">收款摘要 RECEIPT SUMMARY</div>
                        <div class="total-row"><span>本次收款</span><span style="font-weight: 800;">$${Number(displayPayment.amount).toLocaleString()}</span></div>
                        <div class="total-row"><span>累計已收</span><span style="font-weight: 800;">$${cumulativePaid.toLocaleString()}</span></div>
                        <div class="total-row"><span>合約總額</span><span style="font-weight: 700;">$${contractTotal.toLocaleString()}</span></div>
                        <div class="grand-total-divider"></div>
                        <div class="grand-total-row">
                            <span style="font-size: 14px; font-weight: 700;">尚未收款</span>
                            <span style="font-size: 20px; font-weight: 800;">$${remainingAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="table-section">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>品名 / 描述</th>
                                <th class="text-center">數量</th>
                                <th class="text-center">單位</th>
                                <th class="text-right">金額</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>

                <div class="summary-notes-footer">
                    <div class="summary-section">
                        <div style="flex: 1;">
                            <div class="notes-box">
                                <span class="notes-title">收據說明 RECEIPT NOTES</span>
                                <div style="white-space: pre-wrap;">${(receiptNoteFooter || '').replace(/\n/g, '\n')}</div>
                            </div>
                        </div>
                    </div>

                    ${renderSigningArea(quote, settings, null, '', { showCustomerSignature: false })}
                </div>

                ${renderFooter(1, 1)}
            </div>
        </body>
        </html>
    `;

    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
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
