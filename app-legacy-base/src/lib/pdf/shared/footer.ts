import { format } from 'date-fns';
import { BRAND } from '../generator';

export function renderFooter(pageNum: number, total: number) {
    return `
        <div class="footer-container">
            <div class="page-footer-text">第 ${pageNum} 頁 / 共 ${total} 頁</div>
            <div class="bottom-accent"></div>
        </div>
    `;
}

export function renderSigningArea(quote: any, settings: any, latestSignature: any, signatureBase64Html: string, options: { showCustomerSignature?: boolean } = {}) {
    const { companyStampUrl, companyPhone } = settings;
    const { showCustomerSignature = true } = options;

    let rightSide = '';
    if (showCustomerSignature) {
        rightSide = `
            <div class="signature-label">
                客戶確認簽章：
                <span class="signature-line">
                    ${signatureBase64Html ? `
                    <div class="signature-image-overlay">
                        ${signatureBase64Html}
                        <div class="signer-info-text">
                            簽名人：${latestSignature?.signerName || ''} ${latestSignature?.signerTitle ? `/ ${latestSignature.signerTitle}` : ''} | 
                            日期：${latestSignature?.signedAt ? format(new Date(latestSignature.signedAt), 'yyyy/MM/dd') : ''}
                        </div>
                    </div>` : ''}
                </span>
            </div>
            
            <div class="service-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.11-2.11a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                如有疑問歡迎來電 ${companyPhone}
            </div>
        `;
    }

    return `
        <div class="footer-signing">
            <div class="stamp-section">
                <div class="signature-label">公司用印</div>
                ${companyStampUrl ? `<img src="${companyStampUrl}" class="stamp-image" />` : ''}
            </div>
            <div style="text-align: right;">
                ${rightSide}
            </div>
        </div>
    `;
}
