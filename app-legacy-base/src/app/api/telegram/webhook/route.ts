import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// In-memory deduplication set (prevents double-processing on Telegram retries)
const processedUpdateIds = new Set<number>();
const MAX_PROCESSED_IDS = 1000;

/**
 * POST /api/telegram/webhook — Receive messages from Telegram Bot API
 * 
 * When an admin replies to a notification message in the customer service group,
 * this webhook captures the reply and forwards it to the customer's chat session.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify secret token
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
    const expectedSecret = await getSetting<string>('telegram_webhook_secret', '');
    
    if (!expectedSecret || secretHeader !== expectedSecret) {
      console.warn('[Webhook] Invalid secret token');
      return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }

    const body = await request.json();

    // 2. Return 200 immediately, process async
    // (Telegram retries if no response within seconds)
    processWebhookAsync(body).catch(err => {
      console.error('[Webhook] Async processing error:', err);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ ok: true }); // Always 200
  }
}

async function processWebhookAsync(body: any) {
  const message = body.message;
  if (!message) return; // Not a message update (could be edited_message, etc.)

  // 3. Deduplication
  const updateId = body.update_id;
  if (updateId && processedUpdateIds.has(updateId)) {
    console.log(`[Webhook] Duplicate update_id ${updateId}, skipping`);
    return;
  }
  if (updateId) {
    processedUpdateIds.add(updateId);
    // Trim set if too large
    if (processedUpdateIds.size > MAX_PROCESSED_IDS) {
      const entries = Array.from(processedUpdateIds);
      entries.slice(0, entries.length - MAX_PROCESSED_IDS / 2).forEach(id => processedUpdateIds.delete(id));
    }
  }

  // 4. Only process messages from the customer service group
  const customerServiceChatId = await getSetting<string>('telegram_chat_id_customer_service', '');
  if (!customerServiceChatId) return;

  const chatId = String(message.chat?.id);
  if (chatId !== customerServiceChatId) {
    console.log(`[Webhook] Message from wrong chat: ${chatId} (expected: ${customerServiceChatId})`);
    return;
  }

  // 5. Only process reply messages (must be replying to one of our notifications)
  const replyTo = message.reply_to_message;
  if (!replyTo) {
    // Not a reply — ignore (casual group chat)
    return;
  }

  // 6. Only process text messages (ignore photos, stickers, etc. for now)
  const text = message.text;
  if (!text) {
    console.log('[Webhook] Non-text reply, ignoring');
    return;
  }

  // 7. Find the session by looking up the replied-to message_id in notifications table
  const replyToMessageId = replyTo.message_id;
  
  const notification = await prisma.notification.findFirst({
    where: {
      telegramMessageId: replyToMessageId,
      entityType: 'chat_session',
    },
    select: { entityId: true },
  });

  if (!notification?.entityId) {
    console.log(`[Webhook] No session found for telegram_message_id: ${replyToMessageId}`);
    return;
  }

  const sessionId = notification.entityId;

  // 8. Verify session exists and is not closed
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    console.log(`[Webhook] Session ${sessionId} not found`);
    return;
  }

  if (session.status === 'closed') {
    console.log(`[Webhook] Session ${sessionId} is closed, ignoring reply`);
    return;
  }

  // 9. Extract sender info
  const from = message.from;
  const senderName = [from?.first_name, from?.last_name].filter(Boolean).join(' ') || 'Telegram 管理員';

  // 10. Create admin message in the chat session
  await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'admin',
      content: text,
      senderName,
    },
  });

  // 11. Auto-transfer if session is still in AI mode
  if (session.status === 'active') {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'transferred',
        transferredAt: new Date(),
        // Note: transferredTo requires a system user UUID, which we don't have from Telegram
        // We leave it null; the senderName on the message identifies who replied
      },
    });
    console.log(`[Webhook] Session ${sessionId} auto-transferred from Telegram reply`);
  }

  console.log(`[Webhook] Message from ${senderName} saved to session ${sessionId}`);
}
