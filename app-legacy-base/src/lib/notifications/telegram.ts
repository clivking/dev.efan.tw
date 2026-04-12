import https from 'https';
import { getSetting } from '@/lib/settings';
import { prisma } from '@/lib/prisma';
import { getConfiguredSiteOrigin } from '@/lib/site-url';

export interface TelegramOptions {
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  disable_web_page_preview?: boolean;
  type?: string;
  entityType?: string;
  entityId?: string;
  chatIdSettingKey?: string;
  replyToMessageId?: number;
}

export interface TelegramResult {
  success: boolean;
  messageId?: number;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendTelegramNotification(
  message: string,
  options: TelegramOptions = {},
): Promise<TelegramResult> {
  const finalOptions = {
    parse_mode: 'HTML' as const,
    disable_web_page_preview: true,
    ...options,
  };

  let status: 'sent' | 'failed' = 'failed';
  let errorMessage: string | null = null;
  let telegramMessageId: number | undefined;
  let attempts = 0;
  const maxAttempts = 3;

  try {
    const botToken = await getSetting('telegram_bot_token', '');
    const chatId = await getSetting(options.chatIdSettingKey || 'telegram_chat_id', '');

    if (!botToken || !chatId) {
      errorMessage = 'Telegram 未設定 bot token 或 chat id，已略過通知。';
      console.warn(errorMessage);
      return { success: false };
    }

    while (attempts < maxAttempts && status === 'failed') {
      attempts++;
      try {
        const result = await new Promise<{ ok: boolean; status: number; data: any }>((resolve, reject) => {
          const requestBody: Record<string, unknown> = {
            chat_id: chatId,
            text: message,
            parse_mode: finalOptions.parse_mode,
            disable_web_page_preview: finalOptions.disable_web_page_preview,
          };

          if (finalOptions.replyToMessageId) {
            requestBody.reply_to_message_id = finalOptions.replyToMessageId;
            requestBody.allow_sending_without_reply = true;
          }

          const data = JSON.stringify(requestBody);

          const req = https.request({
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${botToken}/sendMessage`,
            method: 'POST',
            family: 4,
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
              'User-Agent': 'Efan-System-Bot/1.0',
            },
          }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                resolve({ ok: res.statusCode === 200, status: res.statusCode || 0, data: parsed });
              } catch {
                resolve({ ok: false, status: res.statusCode || 0, data: body });
              }
            });
          });

          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('ETIMEDOUT'));
          });

          req.write(data);
          req.end();
        });

        if (!result.ok) {
          errorMessage = `Telegram API 錯誤 (${result.status})：${JSON.stringify(result.data)}`;
          console.error('Telegram API error:', result.data);
          if (result.status === 401 || result.status === 404) break;
        } else {
          status = 'sent';
          telegramMessageId = result.data?.result?.message_id;
        }
      } catch (error: any) {
        errorMessage = `第 ${attempts} 次發送失敗：${error.message}`;
        console.error(`Telegram attempt ${attempts} failed:`, error.message);
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
  } finally {
    try {
      await prisma.notification.create({
        data: {
          type: options.type || 'system',
          title: 'Telegram Notification',
          body: message,
          channel: 'telegram',
          status: status === 'sent' ? 'sent' : 'failed',
          errorMessage,
          telegramMessageId: telegramMessageId || null,
          sentAt: status === 'sent' ? new Date() : null,
          entityType: options.entityType,
          entityId: options.entityId,
        },
      });
    } catch (logError) {
      console.error('Failed to log notification:', logError);
    }
  }

  return { success: status === 'sent', messageId: telegramMessageId };
}

export function fireAndForgetNotification(
  message: string,
  options?: TelegramOptions,
): Promise<TelegramResult> {
  return sendTelegramNotification(message, options).catch((error) => {
    console.error('Telegram background task error:', error);
    return { success: false };
  });
}

export function formatQuoteMessage(
  event: 'viewed' | 'signed' | 'expired' | 'warranty_expiring' | 'reminder_unsigned' | 'reminder_unviewed' | 'reminder_viewed_unsigned' | 'reminder_unpaid',
  data: any,
) {
  const { quoteNumber, customerName, totalAmount, signerName, expiryDate, completionDate, variantName } = data;
  const appUrl = data.baseUrl || getConfiguredSiteOrigin();
  const detailUrl = `${appUrl}/admin/quotes/${data.quoteNumber}`;
  const customer = customerName || '未提供';

  switch (event) {
    case 'viewed':
      return `👀 <b>報價單已被瀏覽</b>\n\n報價單號：<code>${quoteNumber}</code>\n客戶：${customer}\n\n<a href="${detailUrl}">查看詳情</a>`;

    case 'signed':
      return `✍️ <b>報價單已簽回</b>\n\n報價單號：<code>${quoteNumber}</code>\n客戶：${customer}\n簽署人：${signerName || customer}${variantName ? `\n方案：${variantName}` : ''}\n金額：NT$ ${Number(totalAmount).toLocaleString()}\n\n<a href="${detailUrl}">查看報價</a>`;

    case 'expired':
      return `⏰ <b>報價單已逾期</b>\n\n報價單號：<code>${quoteNumber}</code>\n客戶：${customer}\n到期日：${expiryDate}\n\n<a href="${detailUrl}">查看詳情</a>`;

    case 'reminder_unviewed':
      return `🔔 <b>報價單未瀏覽提醒</b>\n\n報價單號：<code>${quoteNumber}</code>\n客戶：${customer}\n\n<a href="${detailUrl}">查看報價</a>`;

    case 'reminder_viewed_unsigned':
      return `🔔 <b>已瀏覽未簽回提醒</b>\n\n報價單號：<code>${quoteNumber}</code>\n客戶：${customer}\n\n<a href="${detailUrl}">查看報價</a>`;

    case 'reminder_unpaid':
      return `💰 <b>未付款提醒</b>\n\n報價單號：<code>${quoteNumber}</code>\n客戶：${customer}\n\n<a href="${detailUrl}">查看款項</a>`;

    case 'warranty_expiring':
      return `🛡️ <b>保固即將到期</b>\n\n報價單號：<code>${quoteNumber}</code>\n客戶：${customer}\n完工日：${completionDate}\n保固到期日：${data.warrantyExpiresAt}\n\n<a href="${detailUrl}">查看案件</a>`;

    case 'reminder_unsigned':
      return `🔔 <b>報價單待簽回提醒</b>\n\n報價單號：<code>${quoteNumber}</code>\n客戶：${customer}\n\n<a href="${detailUrl}">查看報價</a>`;

    default:
      return '';
  }
}

export function formatPaymentMessage(data: any) {
  const { quoteNumber, customerName, amount, remainingAmount, isFullPayment } = data;
  const appUrl = data.baseUrl || getConfiguredSiteOrigin();
  const detailUrl = `${appUrl}/admin/quotes/${data.quoteNumber}`;
  const status = isFullPayment
    ? '已完成付款'
    : `尚欠 NT$ ${Number(remainingAmount).toLocaleString()}`;

  return `💳 <b>收到付款通知</b>\n\n報價單號：<code>${quoteNumber}</code>\n客戶：${customerName || '未提供'}\n收款金額：NT$ ${Number(amount).toLocaleString()}\n付款狀態：${status}\n\n<a href="${detailUrl}">查看報價</a>`;
}

export function formatConsultationNotification(data: {
  contactName: string;
  phone: string;
  email?: string;
  lineId?: string;
  address?: string;
  companyName?: string;
  summary: string;
  message?: string;
  sessionId: string;
  baseUrl?: string;
}) {
  const appUrl = data.baseUrl || getConfiguredSiteOrigin();
  const adminLink = `${appUrl}/admin/chat?session=${data.sessionId}`;

  const lines = [
    '📝 <b>收到新諮詢需求</b>',
    '',
    `姓名：${escapeHtml(data.contactName)}`,
    `電話：${data.phone}`,
  ];

  if (data.email) lines.push(`Email：${data.email}`);
  if (data.lineId) lines.push(`LINE：${escapeHtml(data.lineId)}`);
  if (data.address) lines.push(`地址：${escapeHtml(data.address)}`);
  if (data.companyName) lines.push(`公司名稱：${escapeHtml(data.companyName)}`);

  lines.push('');
  lines.push(escapeHtml(data.summary));

  if (data.message) {
    lines.push('');
    lines.push(`補充說明：${escapeHtml(data.message)}`);
  }

  lines.push('');
  lines.push(`👉 <a href="${adminLink}">前往後台查看</a>`);
  return lines.join('\n');
}

export function formatTransferNotification(data: {
  contactName: string;
  phone: string;
  email?: string;
  lineId?: string;
  address?: string;
  companyName?: string;
  summary?: string;
  message?: string;
  sessionId: string;
  baseUrl?: string;
}) {
  const appUrl = data.baseUrl || getConfiguredSiteOrigin();
  const adminLink = `${appUrl}/admin/chat?session=${data.sessionId}`;

  const lines = [
    '🙋 <b>客戶請求轉真人服務</b>',
    '',
    `姓名：${escapeHtml(data.contactName)}`,
    `電話：${data.phone}`,
  ];

  if (data.email) lines.push(`Email：${data.email}`);
  if (data.lineId) lines.push(`LINE：${escapeHtml(data.lineId)}`);
  if (data.address) lines.push(`地址：${escapeHtml(data.address)}`);
  if (data.companyName) lines.push(`公司名稱：${escapeHtml(data.companyName)}`);

  if (data.summary) {
    lines.push('');
    lines.push('需求摘要：');
    lines.push(escapeHtml(data.summary));
  }

  if (data.message) {
    lines.push('');
    lines.push(`補充說明：${escapeHtml(data.message)}`);
  }

  lines.push('');
  lines.push(`👉 <a href="${adminLink}">前往後台接手</a>`);
  return lines.join('\n');
}
