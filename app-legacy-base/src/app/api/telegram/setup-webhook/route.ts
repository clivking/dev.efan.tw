import crypto from 'crypto';
import https from 'https';
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware/auth';
import { getSetting } from '@/lib/settings';
import { prisma } from '@/lib/prisma';
import { getOriginFromRequest } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

async function telegramRequest(botToken: string, method: string, body?: Record<string, unknown>) {
  return new Promise<{ ok: boolean; status: number; data: any }>((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${botToken}/${method}`,
        method: body ? 'POST' : 'GET',
        family: 4,
        timeout: 15000,
        headers: body
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            }
          : undefined,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            resolve({
              ok: res.statusCode === 200,
              status: res.statusCode || 0,
              data: JSON.parse(raw),
            });
          } catch {
            resolve({
              ok: false,
              status: res.statusCode || 0,
              data: { raw },
            });
          }
        });
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Telegram 請求逾時。'));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

export async function POST(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const botToken = await getSetting('telegram_bot_token', '');
      if (!botToken) {
        return NextResponse.json({ error: '尚未設定 Telegram bot token。' }, { status: 400 });
      }

      let webhookSecret = await getSetting('telegram_webhook_secret', '');
      if (!webhookSecret) {
        webhookSecret = crypto.randomBytes(32).toString('hex');
        const existing = await prisma.setting.findUnique({ where: { key: 'telegram_webhook_secret' } });
        if (existing) {
          await prisma.setting.update({
            where: { key: 'telegram_webhook_secret' },
            data: { value: webhookSecret },
          });
        } else {
          await prisma.setting.create({
            data: {
              key: 'telegram_webhook_secret',
              value: webhookSecret,
              type: 'encrypted',
              category: 'api',
              description: 'Telegram webhook 驗證密鑰',
            },
          });
        }
      }

      const webhookUrl = `${getOriginFromRequest(request)}/api/telegram/webhook`;
      const result = await telegramRequest(botToken, 'setWebhook', {
        url: webhookUrl,
        secret_token: webhookSecret,
        allowed_updates: ['message'],
      });

      if (!result.ok || !result.data?.ok) {
        return NextResponse.json(
          {
            success: false,
            error: result.data?.description || 'Telegram webhook 註冊失敗。',
            detail: result.data,
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        webhookUrl,
        message: `Webhook 已註冊：${webhookUrl}`,
      });
    } catch (error: any) {
      console.error('Setup webhook error:', error);
      return NextResponse.json(
        { error: error?.message || '無法註冊 Telegram webhook。' },
        { status: 500 },
      );
    }
  });
}

export async function GET(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const botToken = await getSetting('telegram_bot_token', '');
      if (!botToken) {
        return NextResponse.json({ error: '尚未設定 Telegram bot token。' }, { status: 400 });
      }

      const result = await telegramRequest(botToken, 'getWebhookInfo');
      return NextResponse.json(result.data);
    } catch (error: any) {
      console.error('Get webhook info error:', error);
      return NextResponse.json(
        { error: error?.message || '無法載入 Telegram webhook 資訊。' },
        { status: 500 },
      );
    }
  });
}
