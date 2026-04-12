import { format } from 'date-fns';
import { BRAND } from '../generator';
import { formatPhone } from '@/lib/phone-format';

export function renderHeader(quote: any, settings: any, title: string = '報價單', options: { overrideDate?: Date, hideExpiry?: boolean } = {}) {
    const { logoUrl, companyName, companyAddress, companyPhone, companyEmail } = settings;
    const displayDate = options.overrideDate || new Date(quote.createdAt);
    const showExpiry = !options.hideExpiry && quote.validUntil;

    return `
        <div class="header">
            <div class="logo-section" style="display: flex; align-items: center !important; gap: 18px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    ${logoUrl
            ? `<img src="${logoUrl}" class="logo-img" style="height: 52px;" />`
            : `<div class="logo-placeholder" style="width: 52px; height: 52px;">EFAN</div>`}
                    <div style="font-size: 8px; font-weight: 700; color: ${BRAND.gray400}; letter-spacing: 1px; font-family: sans-serif; opacity: 0.8; line-height: 1;">SINCE 1984</div>
                </div>
                <div class="company-info" style="display: inline-flex; flex-direction: column; width: fit-content; text-align: left;">
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
                <div>編號：<span class="quote-id-val">${quote.quoteNumber}</span></div>
                <div>日期：${format(displayDate, 'yyyy/MM/dd')}</div>
                ${showExpiry ? `<div>有效期限：<span class="valid-date-val">${format(new Date(quote.validUntil), 'yyyy/MM/dd')}</span></div>` : ''}
            </div>
        </div>
    `;
}
