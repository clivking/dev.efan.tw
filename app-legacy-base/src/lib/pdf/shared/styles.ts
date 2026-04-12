import { BRAND } from '../generator';

export const pdfStyles = `
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
    .company-detail-row { width: 100%; font-size: 9.5px; color: ${BRAND.gray400}; line-height: 1; margin: 0; }
    .quote-info { text-align: right; font-size: 11px; color: ${BRAND.gray600}; line-height: 1.8; }
    .quote-info div { margin-bottom: 2px; }
    .quote-id-val { color: ${BRAND.gray900}; font-weight: 700; }
    .valid-date-val { color: ${BRAND.accent}; font-weight: 600; }

    .title-section { text-align: center; padding: 20px 44px 10px; }
    .main-title { font-family: "Noto Serif TC", "Noto Serif CJK TC", serif; margin-bottom: 2px; }
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
    
    .items-table th:nth-child(1), .items-table td:nth-child(1) { width: 35px; text-align: center; }
    .items-table th:nth-child(2), .items-table td:nth-child(2) { text-align: left; padding-left: 14px; }
    .items-table th:nth-child(3), .items-table td:nth-child(3) { width: 50px; text-align: center; }
    .items-table th:nth-child(4), .items-table td:nth-child(4) { width: 50px; text-align: center; }
    .items-table th:nth-child(5), .items-table td:nth-child(5) { width: 80px; text-align: right; }
    .items-table th:nth-child(6), .items-table td:nth-child(6) { width: 95px; text-align: right; padding-right: 15px; }

    td { padding: 11px 10px; vertical-align: top; font-size: 11.5px; border-bottom: 1px solid ${BRAND.gray200}; }
    .item-name { font-size: 13px; font-weight: 700; color: ${BRAND.gray900}; margin-bottom: 2px; }
    .item-desc { font-size: 11px; color: ${BRAND.gray600}; line-height: 1.5; white-space: pre-wrap; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

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
`;
