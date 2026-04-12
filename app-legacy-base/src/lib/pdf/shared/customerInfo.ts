import { BRAND } from '../generator';

export function renderCustomerInfo(quote: any, contactsHtml: string) {
    const companyTitle = quote.companyName?.companyName;
    const customerName = quote.customer?.name || '個人客戶';
    const taxId = quote.companyName?.taxId;

    const showCompanyName = companyTitle && companyTitle !== '個人客戶';

    return `
        <div class="customer-card">
            <div class="customer-row">
                ${showCompanyName ? `
                <div class="customer-field" style="flex: 1.2;">
                    <span class="customer-field-label">公司名稱</span><span class="divider">│</span>
                    <div style="flex: 1; min-width: 0;">
                        <div class="customer-field-value">${companyTitle}</div>
                        ${taxId ? `<div style="font-size: 11px; color: ${BRAND.gray600}; margin-top: 2px;">統一編號：${taxId}</div>` : ''}
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
}
