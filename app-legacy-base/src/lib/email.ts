import nodemailer from 'nodemailer';
import { getCompanyInfo } from '@/lib/company';
import { getSetting, getSettings } from '@/lib/settings';
import { SERVICE_NAMES, TIER_NAMES } from '@/lib/types/consultation-types';
import { getConfiguredSiteOrigin } from '@/lib/site-url';

/**
 * Core email sending utility.
 * Reads SMTP config from settings (individual fields, not JSON).
 * Fire-and-forget: never throws, logs errors to console.
 */
async function getTransporter(): Promise<nodemailer.Transporter | null> {
    try {
        const cfg = await getSettings([
            'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure',
        ]);
        const host = cfg['smtp_host'];
        const port = cfg['smtp_port'];
        const user = cfg['smtp_user'];
        const pass = cfg['smtp_pass'];
        const secure = cfg['smtp_secure'];

        if (!host || !user || !pass) {
            console.warn('[Email] SMTP not configured, skipping email.');
            return null;
        }

        const portNum = Number(port) || 587;

        return nodemailer.createTransport({
            host,
            port: portNum,
            secure: secure === 'true' || secure === true || portNum === 465,
            auth: { user, pass },
            connectionTimeout: 10_000,  // 10 seconds to connect
            greetingTimeout: 10_000,    // 10 seconds for greeting
            socketTimeout: 15_000,      // 15 seconds for socket
            // Force IPv4 — many ISPs block IPv6 SMTP
            family: 4,
        } as any);
    } catch (err) {
        console.error('[Email] Failed to create transporter:', err);
        return null;
    }
}

async function getCompanyServiceLine() {
    const company = await getCompanyInfo();
    return `超過 ${company.yearsInBusiness} 年專業安防整合服務`;
}

export async function sendEmail(
    to: string,
    subject: string,
    html: string,
): Promise<boolean> {
    try {
        const transporter = await getTransporter();
        if (!transporter) return false;

        const user = await getSetting('smtp_user', 'pro@efan.tw');
        await transporter.sendMail({
            from: `一帆安全整合 <${user}>`,
            to,
            subject,
            html,
        });
        console.log(`[Email] Sent to ${to}: ${subject}`);
        return true;
    } catch (err) {
        console.error('[Email] sendEmail failed:', err);
        return false;
    }
}

// ─── Quote Request: Company Notification ─────────────────────────

interface QuoteRequestEmailData {
    contactName: string;
    mobile?: string;
    phone?: string;
    email?: string;
    companyName?: string;
    address?: string;
    quoteNumber: string;
    quoteId: string;
    services: string[];
    budgetTiers: string[];
    summary: string;       // full needs summary (buildSummary result)
    message?: string;
    baseUrl?: string;
}



export async function sendQuoteRequestCompanyNotification(data: QuoteRequestEmailData): Promise<void> {
    const enabled = await getSetting('email_notify_enabled', true);
    if (!enabled) return;

    const toAddr = await getSetting('email_notify_address', 'pro@efan.tw');
    const serviceNames = data.services.map(s => SERVICE_NAMES[s] || s).join('、');
    const subject = `[新詢價] ${data.contactName} — ${serviceNames}`;

    const adminLink = data.baseUrl
        ? `${data.baseUrl}/admin/quotes/${data.quoteNumber}`
        : `${getConfiguredSiteOrigin()}/admin/quotes/${data.quoteNumber}`;

    const html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a4b8c; border-bottom: 3px solid #e8a63a; padding-bottom: 10px;">📋 新詢價通知</h2>
  
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td colspan="2" style="background: #f8f9fa; padding: 8px 12px; font-weight: bold; color: #1a4b8c; border-bottom: 2px solid #e8a63a;">客戶資訊</td></tr>
    <tr><td style="padding: 6px 12px; color: #666; width: 100px;">聯絡人</td><td style="padding: 6px 12px; font-weight: bold;">${data.contactName}</td></tr>
    ${data.mobile ? `<tr><td style="padding: 6px 12px; color: #666;">手機</td><td style="padding: 6px 12px;">${data.mobile}</td></tr>` : ''}
    ${data.phone ? `<tr><td style="padding: 6px 12px; color: #666;">電話</td><td style="padding: 6px 12px;">${data.phone}</td></tr>` : ''}
    ${data.email ? `<tr><td style="padding: 6px 12px; color: #666;">Email</td><td style="padding: 6px 12px;">${data.email}</td></tr>` : ''}
    ${data.companyName ? `<tr><td style="padding: 6px 12px; color: #666;">公司</td><td style="padding: 6px 12px;">${data.companyName}</td></tr>` : ''}
    ${data.address ? `<tr><td style="padding: 6px 12px; color: #666;">施工地址</td><td style="padding: 6px 12px;">${data.address}</td></tr>` : ''}
  </table>

  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td colspan="2" style="background: #f8f9fa; padding: 8px 12px; font-weight: bold; color: #1a4b8c; border-bottom: 2px solid #e8a63a;">報價單資訊</td></tr>
    <tr><td style="padding: 6px 12px; color: #666; width: 100px;">報價單編號</td><td style="padding: 6px 12px; font-weight: bold; font-family: monospace;">${data.quoteNumber}</td></tr>
    <tr><td style="padding: 6px 12px; color: #666;">後台連結</td><td style="padding: 6px 12px;"><a href="${adminLink}" style="color: #1a4b8c;">${adminLink}</a></td></tr>
  </table>

  <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #1a4b8c;">
    <h3 style="margin: 0 0 12px; color: #1a4b8c;">需求內容</h3>
    <pre style="white-space: pre-wrap; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.6;">${data.summary}</pre>
  </div>

  ${data.message ? `
  <div style="background: #fff8e7; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #e8a63a;">
    <strong>補充說明：</strong><br/>${data.message}
  </div>` : ''}

  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">此信件由系統自動發送</p>
</div>`;

    await sendEmail(toAddr, subject, html);
}

// ─── Quote Request: Customer Confirmation ────────────────────────

export async function sendQuoteRequestCustomerConfirmation(data: QuoteRequestEmailData): Promise<void> {
    if (!data.email) return;

    const enabled = await getSetting('email_notify_enabled', true);
    if (!enabled) return;
    const companyServiceLine = await getCompanyServiceLine();

    const serviceNames = data.services.map(s => SERVICE_NAMES[s] || s).join('、');
    const tierNames = data.budgetTiers.map(t => TIER_NAMES[t] || t).join('、');

    const html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px 0;">
    <h1 style="color: #1a4b8c; margin: 0;">一帆安全整合</h1>
    <p style="color: #999; margin: 4px 0 0;">${companyServiceLine}</p>
  </div>

  <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 16px 0;">
    <p style="font-size: 16px; margin: 0 0 16px;"><strong>${data.contactName}</strong> 您好：</p>
    <p style="margin: 0 0 16px; line-height: 1.6;">感謝您的詢價！我們已收到您的需求，將盡快為您準備報價。</p>
    
    <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e0e0e0;">
      <h3 style="color: #1a4b8c; margin: 0 0 12px; font-size: 14px;">【您的詢價摘要】</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; color: #666;">服務項目</td><td style="padding: 4px 0; font-weight: bold;">${serviceNames}</td></tr>
        <tr><td style="padding: 4px 0; color: #666;">方案需求</td><td style="padding: 4px 0; font-weight: bold;">${tierNames || '未指定'}</td></tr>
        ${data.address ? `<tr><td style="padding: 4px 0; color: #666;">施工地址</td><td style="padding: 4px 0;">${data.address}</td></tr>` : ''}
      </table>
    </div>
  </div>

  <div style="text-align: center; padding: 20px 0; line-height: 1.8;">
    <p style="margin: 0; color: #666;">如有任何問題，歡迎來電洽詢：</p>
    <p style="margin: 4px 0; font-size: 16px;">📞 <a href="tel:02-7730-1158" style="color: #1a4b8c; text-decoration: none; font-weight: bold;">02-7730-1158</a></p>
    <p style="margin: 4px 0;">📧 <a href="mailto:pro@efan.tw" style="color: #1a4b8c;">pro@efan.tw</a></p>
  </div>

  <hr style="border: none; border-top: 1px solid #eee;" />
  <p style="color: #999; font-size: 12px; text-align: center; line-height: 1.6;">
    一帆安全整合有限公司<br/>${companyServiceLine}
  </p>
</div>`;

    await sendEmail(data.email, '感謝您的詢價 — 一帆安全整合', html);
}

// ─── Product Inquiry: Company Notification ───────────────────────

interface InquiryEmailData {
    contactName: string;
    mobile?: string;
    phone?: string;
    email?: string;
    companyName?: string;
    quoteNumber: string;
    quoteId: string;
    products: { name: string; quantity: number }[];
    message?: string;
    baseUrl?: string;
}

export async function sendInquiryCompanyNotification(data: InquiryEmailData): Promise<void> {
    const enabled = await getSetting('email_notify_enabled', true);
    if (!enabled) return;

    const toAddr = await getSetting('email_notify_address', 'pro@efan.tw');
    const productSummary = data.products.map(p => `${p.name} × ${p.quantity}`).join('、');
    const subject = `[新詢價] ${data.contactName} — ${productSummary}`;

    const adminLink = data.baseUrl
        ? `${data.baseUrl}/admin/quotes/${data.quoteNumber}`
        : `${getConfiguredSiteOrigin()}/admin/quotes/${data.quoteNumber}`;

    const productList = data.products.map((p, i) =>
        `${i + 1}. ${p.name} × ${p.quantity}`
    ).join('\n');

    const html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a4b8c; border-bottom: 3px solid #e8a63a; padding-bottom: 10px;">📋 新詢價通知（產品詢價）</h2>
  
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td colspan="2" style="background: #f8f9fa; padding: 8px 12px; font-weight: bold; color: #1a4b8c; border-bottom: 2px solid #e8a63a;">客戶資訊</td></tr>
    <tr><td style="padding: 6px 12px; color: #666; width: 100px;">聯絡人</td><td style="padding: 6px 12px; font-weight: bold;">${data.contactName}</td></tr>
    ${data.mobile ? `<tr><td style="padding: 6px 12px; color: #666;">手機</td><td style="padding: 6px 12px;">${data.mobile}</td></tr>` : ''}
    ${data.phone ? `<tr><td style="padding: 6px 12px; color: #666;">電話</td><td style="padding: 6px 12px;">${data.phone}</td></tr>` : ''}
    ${data.email ? `<tr><td style="padding: 6px 12px; color: #666;">Email</td><td style="padding: 6px 12px;">${data.email}</td></tr>` : ''}
    ${data.companyName ? `<tr><td style="padding: 6px 12px; color: #666;">公司</td><td style="padding: 6px 12px;">${data.companyName}</td></tr>` : ''}
  </table>

  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td colspan="2" style="background: #f8f9fa; padding: 8px 12px; font-weight: bold; color: #1a4b8c; border-bottom: 2px solid #e8a63a;">報價單資訊</td></tr>
    <tr><td style="padding: 6px 12px; color: #666; width: 100px;">報價單編號</td><td style="padding: 6px 12px; font-weight: bold; font-family: monospace;">${data.quoteNumber}</td></tr>
    <tr><td style="padding: 6px 12px; color: #666;">後台連結</td><td style="padding: 6px 12px;"><a href="${adminLink}" style="color: #1a4b8c;">${adminLink}</a></td></tr>
  </table>

  <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #1a4b8c;">
    <h3 style="margin: 0 0 12px; color: #1a4b8c;">詢價產品</h3>
    <pre style="white-space: pre-wrap; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.8;">${productList}</pre>
  </div>

  ${data.message ? `
  <div style="background: #fff8e7; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #e8a63a;">
    <strong>補充說明：</strong><br/>${data.message}
  </div>` : ''}

  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">此信件由系統自動發送</p>
</div>`;

    await sendEmail(toAddr, subject, html);
}

// ─── Product Inquiry: Customer Confirmation ──────────────────────

export async function sendInquiryCustomerConfirmation(data: InquiryEmailData): Promise<void> {
    if (!data.email) return;

    const enabled = await getSetting('email_notify_enabled', true);
    if (!enabled) return;
    const companyServiceLine = await getCompanyServiceLine();

    const productList = data.products.map((p, i) =>
        `<tr><td style="padding: 6px 12px; border-bottom: 1px solid #f0f0f0;">${i + 1}.</td><td style="padding: 6px 12px; border-bottom: 1px solid #f0f0f0;">${p.name}</td><td style="padding: 6px 12px; border-bottom: 1px solid #f0f0f0; text-align: center;">× ${p.quantity}</td></tr>`
    ).join('');

    const html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px 0;">
    <h1 style="color: #1a4b8c; margin: 0;">一帆安全整合</h1>
    <p style="color: #999; margin: 4px 0 0;">${companyServiceLine}</p>
  </div>

  <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 16px 0;">
    <p style="font-size: 16px; margin: 0 0 16px;"><strong>${data.contactName}</strong> 您好：</p>
    <p style="margin: 0 0 16px; line-height: 1.6;">感謝您的詢價！我們已收到您的需求，將盡快為您準備報價。</p>
    
    <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e0e0e0;">
      <h3 style="color: #1a4b8c; margin: 0 0 12px; font-size: 14px;">【您的詢價產品】</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${productList}
      </table>
    </div>
  </div>

  <div style="text-align: center; padding: 20px 0; line-height: 1.8;">
    <p style="margin: 0; color: #666;">如有任何問題，歡迎來電洽詢：</p>
    <p style="margin: 4px 0; font-size: 16px;">📞 <a href="tel:02-7730-1158" style="color: #1a4b8c; text-decoration: none; font-weight: bold;">02-7730-1158</a></p>
    <p style="margin: 4px 0;">📧 <a href="mailto:pro@efan.tw" style="color: #1a4b8c;">pro@efan.tw</a></p>
  </div>

  <hr style="border: none; border-top: 1px solid #eee;" />
  <p style="color: #999; font-size: 12px; text-align: center; line-height: 1.6;">
    一帆安全整合有限公司<br/>${companyServiceLine}
  </p>
</div>`;

    await sendEmail(data.email, '感謝您的詢價 — 一帆安全整合', html);
}

// ─── AI Consultation: Customer Confirmation ──────────────────────

interface ConsultationEmailData {
    contactName: string;
    email: string;
    services: string[];
    budgetTiers: string[];
    summary: string;      // buildConsultationSummary() result
    address?: string;
    lineId?: string;
}

export async function sendConsultationConfirmation(data: ConsultationEmailData): Promise<void> {
    if (!data.email) return;

    const enabled = await getSetting('email_notify_enabled', true);
    if (!enabled) return;
    const companyServiceLine = await getCompanyServiceLine();

    const serviceNames = data.services.map(s => SERVICE_NAMES[s] || s).join('、');
    const tierNames = data.budgetTiers.map(t => TIER_NAMES[t] || t).join('、');

    // Get LINE info for footer
    const lineId = await getSetting<string>('line_official_id', '');

    const html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px 0;">
    <h1 style="color: #1a4b8c; margin: 0;">一帆安全整合</h1>
    <p style="color: #999; margin: 4px 0 0;">${companyServiceLine}</p>
  </div>

  <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 16px 0;">
    <p style="font-size: 16px; margin: 0 0 16px;"><strong>${data.contactName}</strong> 您好：</p>
    <p style="margin: 0 0 16px; line-height: 1.6;">感謝您的報價諮詢！以下是我們收到的需求：</p>
    
    <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e0e0e0;">
      <h3 style="color: #1a4b8c; margin: 0 0 12px; font-size: 14px;">【您的需求摘要】</h3>
      <pre style="white-space: pre-wrap; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.8;">${data.summary}</pre>
    </div>

    <p style="margin: 16px 0 0; line-height: 1.6;">我們會在一個工作日內與您聯繫，提供完整報價方案。</p>
  </div>

  <div style="text-align: center; padding: 20px 0; line-height: 1.8;">
    <p style="margin: 0; color: #666;">如有急件請來電洽詢：</p>
    <p style="margin: 4px 0; font-size: 16px;">📞 <a href="tel:02-7730-1158" style="color: #1a4b8c; text-decoration: none; font-weight: bold;">02-7730-1158</a></p>
    <p style="margin: 4px 0;">📧 <a href="mailto:pro@efan.tw" style="color: #1a4b8c;">pro@efan.tw</a></p>
    ${lineId ? `<p style="margin: 4px 0;">💬 LINE：${lineId}</p>` : ''}
  </div>

  <hr style="border: none; border-top: 1px solid #eee;" />
  <p style="color: #999; font-size: 12px; text-align: center; line-height: 1.6;">
    一帆安全整合有限公司<br/>${companyServiceLine}
  </p>
</div>`;

    await sendEmail(data.email, '一帆安全整合 — 已收到您的報價諮詢', html);
}
