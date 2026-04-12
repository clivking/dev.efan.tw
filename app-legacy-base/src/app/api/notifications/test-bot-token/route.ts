import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getSetting } from '@/lib/settings';
import { withAdmin } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const botToken = await getSetting('telegram_bot_token', '');
      if (!botToken) {
        return NextResponse.json(
          { success: false, error: '尚未設定 Telegram bot token。' },
          { status: 400 },
        );
      }

      const result = await new Promise<{ ok: boolean; data: any }>((resolve, reject) => {
        const req = https.request(
          {
            hostname: 'api.telegram.org',
            path: `/bot${botToken}/getMe`,
            method: 'GET',
            family: 4,
            timeout: 15000,
          },
          (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              try {
                const data = JSON.parse(body);
                resolve({ ok: res.statusCode === 200 && data.ok, data });
              } catch {
                resolve({ ok: false, data: { description: 'Telegram 回傳格式無效。' } });
              }
            });
          },
        );

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Telegram 請求逾時。'));
        });
        req.end();
      });

      if (!result.ok || !result.data.result) {
        return NextResponse.json(
          {
            success: false,
            error: result.data?.description || 'Telegram bot token 驗證失敗。',
          },
          { status: 400 },
        );
      }

      const bot = result.data.result;
      return NextResponse.json({
        success: true,
        message: `Bot token 驗證成功：${bot.first_name} (@${bot.username})。`,
        bot,
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error?.message || '無法驗證 Telegram bot token。',
        },
        { status: 400 },
      );
    }
  });
}
