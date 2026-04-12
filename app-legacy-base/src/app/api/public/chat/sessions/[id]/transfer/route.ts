import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import { getConfiguredSiteOrigin } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

/**
 * POST /api/public/chat/sessions/[id]/transfer — Customer manually requests transfer to human
 * Public endpoint, no auth required (customer-facing)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: '對話不存在' }, { status: 404 });
    }

    // Only allow transfer from active state
    if (session.status !== 'active') {
      return NextResponse.json({ 
        error: session.status === 'transferred' ? '已轉接專人，請稍候回覆' : '此對話已結束',
      }, { status: 400 });
    }

    // Update session status
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: 'transferred' },
    });

    // Add transfer message
    const transferMessage = await getSetting<string>(
      'ai_chat_transfer_message',
      '正在為您轉接專人，請稍候...'
    );
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: transferMessage,
      },
    });

    // Send Telegram notification
    notifyManualTransfer(sessionId, session).catch(console.error);

    return NextResponse.json({ success: true, message: transferMessage });
  } catch (error: any) {
    console.error('Public transfer error:', error);
    return NextResponse.json({ error: '轉接失敗' }, { status: 500 });
  }
}

async function notifyManualTransfer(sessionId: string, session: any) {
  try {
    const { sendTelegramNotification, escapeHtml } = await import('@/lib/notifications/telegram');
    const chatId = await getSetting<string>('telegram_chat_id_customer_service', '');
    if (!chatId) return;

    const appUrl = getConfiguredSiteOrigin();
    const sourceLabel = session.source === 'web_quote' ? '互動頁' : '官網';

    // Get recent messages for context
    const recentMsgs = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { role: true, content: true },
    });

    const summaryLines = recentMsgs.reverse().map(m => {
      const icon = m.role === 'user' ? '👤' : m.role === 'admin' ? '👨‍💼' : '🤖';
      const label = m.role === 'user' ? '客戶' : m.role === 'admin' ? '管理員' : 'AI';
      const content = escapeHtml(m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''));
      return `${icon} ${label}：${content}`;
    }).join('\n');

    const message =
      `🔔 <b>客戶要求轉接專人</b>\n\n` +
      `來源：${sourceLabel}\n` +
      `訪客：${escapeHtml(session.visitorName || '匿名')}\n\n` +
      `<b>最近對話：</b>\n${summaryLines}\n\n` +
      `💬 回覆此訊息即可直接回覆客戶\n` +
      `<a href="${appUrl}/admin/chat?session=${sessionId}">或到後台操作</a>`;

    const result = await sendTelegramNotification(message, {
      type: 'chat_manual_transfer',
      entityType: 'chat_session',
      entityId: sessionId,
      chatIdSettingKey: 'telegram_chat_id_customer_service',
      replyToMessageId: session.telegramMessageId || undefined,
    });

    // Update thread root if needed
    if (result.messageId) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { telegramMessageId: result.messageId },
      });
    }
  } catch (e) {
    console.error('Failed to notify manual transfer:', e);
  }
}
