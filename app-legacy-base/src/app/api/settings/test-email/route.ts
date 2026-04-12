import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getSetting } from '@/lib/settings';
import { withAdmin } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/settings/test-email
 * Send a test email to the company notification address.
 */
export async function POST(request: NextRequest) {
    return withAdmin(request, async () => {
        try {
            const toAddr = await getSetting('email_notify_address', 'pro@efan.tw');

            const success = await sendEmail(
                toAddr,
                'EFAN 測試信',
                `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a4b8c;">測試信寄送成功</h2>
  <p>這封信代表目前的 SMTP 設定可正常運作。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px;">這是 EFAN 後台系統自動寄出的測試訊息。</p>
</div>`,
            );

            if (success) {
                return NextResponse.json({ message: `測試信已寄送至 ${toAddr}` });
            }

            return NextResponse.json(
                { error: 'SMTP 測試失敗，請確認 SMTP 設定是否正確。' },
                { status: 500 }
            );
        } catch (error: any) {
            console.error('[test-email] Error:', error);
            return NextResponse.json(
                { error: error.message || '無法寄送測試信。' },
                { status: 500 }
            );
        }
    });
}
