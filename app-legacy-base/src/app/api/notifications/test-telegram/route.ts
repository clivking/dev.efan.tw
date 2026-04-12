import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware/auth';
import { sendTelegramNotification } from '@/lib/notifications/telegram';

export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = ['telegram_chat_id', 'telegram_chat_id_customer_service'];

export async function POST(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const body = await request.json().catch(() => ({}));
      const chatIdSettingKey = ALLOWED_KEYS.includes(body.chatIdSettingKey)
        ? body.chatIdSettingKey
        : 'telegram_chat_id';

      const label = chatIdSettingKey === 'telegram_chat_id_customer_service'
        ? '客服通知群組'
        : '主通知群組';

      const result = await sendTelegramNotification(
        `Telegram 測試訊息\n\n目標：${label}\n如果你看到這則訊息，代表 Telegram 通知流程正常。`,
        {
          type: 'test',
          chatIdSettingKey,
        },
      );

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Telegram 測試訊息發送失敗。',
            message: '請確認 bot token 與目標 chat ID 是否正確。',
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message: `${label} 測試訊息已成功送出。`,
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error?.message || 'Telegram 測試失敗。',
        },
        { status: 400 },
      );
    }
  });
}
