import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import { createAIEngine } from '@/lib/ai/ai-engine';
import { calculateCost } from '@/lib/ai/pricing';
import { CUSTOMER_CHAT_SYSTEM_PROMPT, EXTRACTION_SYSTEM_PROMPT, getQuoteContextPrompt } from '@/lib/ai/prompts/customer-chat';
import { recordAIUsageEvent } from '@/lib/ai/usage';
import { buildConsultationSummary } from '@/lib/utils/consultation-summary';
import { SYSTEM_USER_ID } from '@/lib/system-user';
import type { ChatMessage, AICustomerServiceResponse, ExtractedCustomerInfo } from '@/lib/ai/types';
import { getConfiguredSiteOrigin, getOriginFromRequest } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const TRANSFER_TAG = '[TRANSFER]';

/**
 * POST /api/public/chat/sessions/[id]/messages
 * Send message and return the AI response via SSE.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const requestBaseUrl = getOriginFromRequest(request);

  try {
    // Verify session exists and is active/transferred
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        quote: { include: { variants: true } },
        contactRequest: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: '\u627e\u4e0d\u5230\u804a\u5929\u5de5\u4f5c\u968e\u6bb5\u3002' }, { status: 404 });
    }
    if (session.status === 'closed') {
      return NextResponse.json({ error: '\u6b64\u804a\u5929\u5df2\u7d50\u675f\u3002' }, { status: 400 });
    }

    // Rate limiting: max 30 messages per minute per session
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentMessages = await prisma.chatMessage.count({
      where: {
        sessionId,
        role: 'user',
        createdAt: { gte: oneMinuteAgo },
      },
    });
    if (recentMessages >= 30) {
      return NextResponse.json({ error: '\u8a0a\u606f\u9001\u51fa\u904e\u65bc\u983b\u7e41\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66\u3002' }, { status: 429 });
    }

    const body = await request.json();
    const userMessage = body.message?.trim();
    if (!userMessage) {
      return NextResponse.json({ error: '\u8acb\u8f38\u5165\u8a0a\u606f\u5167\u5bb9\u3002' }, { status: 400 });
    }

    // Turnstile verification on first message only
    // Skip verification for consultation/transfer_request sessions because they were
    // already verified during form submission.
    const skipTurnstile = session.source === 'consultation' || session.source === 'transfer_request';
    const existingUserMessages = await prisma.chatMessage.count({
      where: { sessionId, role: 'user' },
    });
    if (existingUserMessages === 0 && !skipTurnstile) {
      const { verifyTurnstile } = await import('@/lib/turnstile');
      const ok = await verifyTurnstile(body.turnstileToken);
      if (!ok) {
        return NextResponse.json({ error: '\u9a57\u8b49\u5931\u6557\uff0c\u8acb\u91cd\u65b0\u6574\u7406\u9801\u9762\u5f8c\u518d\u8a66\u3002' }, { status: 403 });
      }
    }

    // Per-session message limit to prevent token abuse
    const sessionMaxMessages = await getSetting<number>('ai_chat_session_max_messages', 50);
    const totalSessionMessages = await prisma.chatMessage.count({
      where: { sessionId },
    });
    if (totalSessionMessages >= sessionMaxMessages) {
      // Save the user message but don't generate AI response
      await prisma.chatMessage.create({
        data: { sessionId, role: 'user', content: userMessage },
      });
      const baseUrl = requestBaseUrl;
      const limitMsg = `\u76ee\u524d\u5c0d\u8a71\u6b21\u6578\u5df2\u9054\u4e0a\u9650\uff0c\u70ba\u4e86\u907f\u514d\u7cfb\u7d71\u6feb\u7528\uff0c\u8acb\u76f4\u63a5\u4f86\u96fb 02-7730-1158\uff0c\u6216\u6539\u586b\u5beb\u8868\u55ae ${baseUrl}/quote-request\uff0c\u6211\u5011\u6703\u76e1\u5feb\u7531\u5c08\u4eba\u5354\u52a9\u60a8\u3002`;
      await prisma.chatMessage.create({
        data: { sessionId, role: 'assistant', content: limitMsg },
      });
      return NextResponse.json({ message: limitMsg, sessionLimitReached: true });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: userMessage,
      },
    });

    // If session is transferred (human took over), forward to Telegram and don't generate AI response
    if (session.status === 'transferred') {
      // Forward customer message to Telegram for the admin to see
      forwardCustomerMessageToTelegram(sessionId, session.telegramMessageId, userMessage, session.visitorName).catch(console.error);

      // Don't repeat the transfer message because the customer already saw it.
      // Just acknowledge the message was received.
      return NextResponse.json({ 
        isTransferred: true,
      });
    }

    // Build conversation history for AI
    const maxHistory = await getSetting<number>('ai_chat_max_history', 20);
    const history = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: maxHistory,
      select: { role: true, content: true },
    });

    // Convert to AI message format (only user/assistant, skip admin)
    // Strip leading assistant messages because Gemini requires the first turn to be user.
    let aiMessages: ChatMessage[] = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    // Drop leading assistant messages
    while (aiMessages.length > 0 && aiMessages[0].role === 'assistant') {
      aiMessages.shift();
    }

    // Build system prompt with dynamic site URL
    const siteUrl = requestBaseUrl;
    let systemPrompt = CUSTOMER_CHAT_SYSTEM_PROMPT.replace(/\{\{SITE_URL\}\}/g, siteUrl);
    
    // If on quote interactive page, inject quote context
    if (session.source === 'web_quote' && session.quote) {
      const variants = session.quote.variants?.map(v => ({
        name: v.name,
        totalAmount: Number(v.totalAmount),
        isRecommended: v.isRecommended,
      })) || [];
      if (variants.length > 0) {
        systemPrompt += getQuoteContextPrompt({
          quoteNumber: session.quote.quoteNumber,
          variants,
        });
      }
    }

    // If from consultation flow, inject customer's consultation data into system prompt
    if (session.source === 'consultation' && session.contactRequest) {
      const cr = session.contactRequest as any;
      const consultData = cr.consultationData;
      const contextParts: string[] = ['\n\n--- \u5ba2\u6236\u8af8\u8a62\u80cc\u666f\u8cc7\u6599 ---'];
      if (session.visitorName) contextParts.push(`\u59d3\u540d\uff1a${session.visitorName}`);
      if (session.visitorContact) contextParts.push(`\u96fb\u8a71\uff1a${session.visitorContact}`);
      if (session.visitorEmail) contextParts.push(`Email\uff1a${session.visitorEmail}`);
      if (cr.address) contextParts.push(`\u5730\u5740\uff1a${cr.address}`);
      if (consultData) {
        try {
          const summary = buildConsultationSummary(consultData);
          if (summary) contextParts.push(`\n\u9700\u6c42\u6458\u8981\uff1a\n${summary}`);
        } catch {}
      }
      contextParts.push('\n\u8acb\u512a\u5148\u5ef6\u7e8c\u4e0a\u9762\u5df2\u6536\u96c6\u5230\u7684\u8cc7\u8a0a\uff0c\u4e0d\u8981\u91cd\u8907\u8a62\u554f\u5ba2\u6236\u5df2\u7d93\u63d0\u4f9b\u7684\u59d3\u540d\u3001\u806f\u7d61\u65b9\u5f0f\u6216\u5730\u5740\uff1b\u82e5\u8cc7\u8a0a\u4ecd\u4e0d\u8db3\uff0c\u518d\u81ea\u7136\u5730\u8ffd\u554f\u5fc5\u8981\u7d30\u7bc0\u3002');
      systemPrompt += contextParts.join('\n');
    }

    // Budget check before calling AI
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const spendResult: any[] = await prisma.$queryRaw`
      SELECT COALESCE(SUM(estimated_cost), 0) as total
      FROM chat_messages
      WHERE role = 'assistant'
        AND estimated_cost IS NOT NULL
        AND created_at >= ${monthStart}
    `;
    const currentSpend = Number(spendResult[0]?.total || 0);
    const monthlyBudget = await getSetting<number>('ai_monthly_budget', 10);

    if (currentSpend >= monthlyBudget) {
      // Budget exceeded. Disable AI and return the offline message.
      const offlineMsg = await getSetting<string>(
        'ai_chat_offline_message',
        '\u76ee\u524d AI \u5ba2\u670d\u66ab\u6642\u96e2\u7dda\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66\uff1b\u82e5\u9700\u8981\u7acb\u5373\u5354\u52a9\uff0c\u8acb\u76f4\u63a5\u4f86\u96fb 02-7730-1158\u3002'
      );
      await prisma.chatMessage.create({
        data: { sessionId, role: 'assistant', content: offlineMsg },
      });
      return NextResponse.json({ message: offlineMsg, budgetExceeded: true });
    }

    // Stream AI response
    const engine = await createAIEngine();
    console.log('[Chat] AI engine created:', engine.provider, engine.model);
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        let usage = { input_tokens: 0, output_tokens: 0 };
        let isTransfer = false;
        try {
          // Buffer for [TRANSFER] detection
          let buffer = '';
          let bufferFlushed = false;
          const BUFFER_SIZE = TRANSFER_TAG.length + 5; // "[TRANSFER] " + margin

          const handleChunk = (chunk: string) => {
            fullResponse += chunk;

            if (!bufferFlushed) {
              buffer += chunk;
              // Wait until we have enough chars to check for [TRANSFER]
              if (buffer.length >= BUFFER_SIZE) {
                if (buffer.startsWith(TRANSFER_TAG)) {
                  // Transfer detected. Hold the output until the full response is ready.
                  isTransfer = true;
                  bufferFlushed = true;
                  return;
                }
                // Not a transfer. Flush the buffered text to the client.
                bufferFlushed = true;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: buffer })}\n\n`));
              }
              return;
            }

            // If transfer was detected, don't stream (accumulate silently)
            if (isTransfer) return;

            // Normal streaming
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          };

          // Use streamWithUsage if available, otherwise fall back to stream
          if ('streamWithUsage' in engine && typeof engine.streamWithUsage === 'function') {
            usage = await engine.streamWithUsage(aiMessages, systemPrompt, handleChunk);
          } else {
            for await (const chunk of engine.stream(aiMessages, systemPrompt)) {
              handleChunk(chunk);
            }
          }

          // Handle case where stream ended before buffer was flushed
          if (!bufferFlushed) {
            if (buffer.startsWith(TRANSFER_TAG)) {
              isTransfer = true;
            } else {
              // Short response, flush buffer
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: buffer })}\n\n`));
            }
            bufferFlushed = true;
          }

          // Calculate cost
          const totalTokens = usage.input_tokens + usage.output_tokens;
          const cost = calculateCost(engine.model, usage.input_tokens, usage.output_tokens);

          if (isTransfer) {
            // === TRANSFER FLOW ===
            const cleanMessage = fullResponse.replace(TRANSFER_TAG, '').trim();

            // Stream the cleaned transition message to client (all at once)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: cleanMessage })}\n\n`));

            // Save AI transition message
            const transferMessage = await prisma.chatMessage.create({
              data: {
                sessionId,
                role: 'assistant',
                content: cleanMessage,
                provider: engine.provider,
                model: engine.model,
                promptTokens: usage.input_tokens || null,
                completionTokens: usage.output_tokens || null,
                totalTokens: totalTokens || null,
                estimatedCost: cost || null,
              },
            });
            await recordAIUsageEvent({
              source: 'chat_reply',
              provider: engine.provider,
              model: engine.model,
              inputTokens: usage.input_tokens || 0,
              outputTokens: usage.output_tokens || 0,
              estimatedCost: cost || 0,
              relatedChatMessageId: transferMessage.id,
              metadata: { sessionId, flow: 'transfer' },
            });

            // Update session to transferred
            await prisma.chatSession.update({
              where: { id: sessionId },
              data: { status: 'transferred' },
            });

            // Send transfer notification to Telegram
            const telegramMsgId = await notifyTransfer(sessionId, session, cleanMessage, aiMessages);

            // Update session with latest telegram_message_id (for threading)
            if (telegramMsgId) {
              await prisma.chatSession.update({
                where: { id: sessionId },
                data: { telegramMessageId: telegramMsgId },
              });
            }

            // Send done event with transfer flag
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, transferred: true })}\n\n`));

          } else {
            // === NORMAL FLOW ===
            const cleanMessage = fullResponse.trim();

            // Save AI message with token tracking
            const aiMessage = await prisma.chatMessage.create({
              data: {
                sessionId,
                role: 'assistant',
                content: cleanMessage,
                provider: engine.provider,
                model: engine.model,
                promptTokens: usage.input_tokens || null,
                completionTokens: usage.output_tokens || null,
                totalTokens: totalTokens || null,
                estimatedCost: cost || null,
              },
            });
            await recordAIUsageEvent({
              source: 'chat_reply',
              provider: engine.provider,
              model: engine.model,
              inputTokens: usage.input_tokens || 0,
              outputTokens: usage.output_tokens || 0,
              estimatedCost: cost || 0,
              relatedChatMessageId: aiMessage.id,
              metadata: { sessionId, flow: 'normal' },
            });

            // Budget warning check (80%)
            const newSpend = currentSpend + cost;
            if (newSpend >= monthlyBudget * 0.8 && currentSpend < monthlyBudget * 0.8) {
              budgetWarning(newSpend, monthlyBudget).catch(console.error);
            }

            // Send done event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));

            // Fire-and-forget: extract customer info from the full conversation
            extractAndProcessCustomerInfo(sessionId, aiMessages, engine, session.source).catch(console.error);
          }

        } catch (error: any) {
          console.error('AI stream error:', error?.message, error?.stack);
          const errorMsg = '\u62b1\u6b49\uff0cAI \u5ba2\u670d\u76ee\u524d\u66ab\u6642\u7121\u6cd5\u56de\u8986\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66\uff0c\u6216\u76f4\u63a5\u4f86\u96fb 02-7730-1158 \u7531\u5c08\u4eba\u5354\u52a9\u3002';
          
          // Save error as assistant message
          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'assistant',
              content: errorMsg,
            },
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: errorMsg, error: true })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat message error:', error);
    return NextResponse.json({ error: '\u8a0a\u606f\u8655\u7406\u5931\u6557\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66\u3002' }, { status: 500 });
  }
}

/**
 * GET /api/public/chat/sessions/[id]/messages
 * Get message history for polling.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json({ error: '\u627e\u4e0d\u5230\u804a\u5929\u5de5\u4f5c\u968e\u6bb5\u3002' }, { status: 404 });
    }

    // Optional: only get messages after a certain timestamp
    const afterParam = request.nextUrl.searchParams.get('after');
    const after = afterParam ? new Date(afterParam) : undefined;

    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
        ...(after ? { createdAt: { gt: after } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        senderName: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      messages,
      status: session.status,
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: '\u53d6\u5f97\u8a0a\u606f\u5931\u6557\u3002' }, { status: 500 });
  }
}

// =========================================
// Helper functions
// =========================================

/**
 * Send transfer notification to Telegram with conversation summary.
 * Returns the telegram message_id for threading.
 */
async function notifyTransfer(
  sessionId: string,
  session: any,
  transitionMessage: string,
  conversationMessages: ChatMessage[],
): Promise<number | undefined> {
  try {
    const { sendTelegramNotification, escapeHtml } = await import('@/lib/notifications/telegram');
    const chatId = await getSetting<string>('telegram_chat_id_customer_service', '');
    if (!chatId) return undefined;

    const appUrl = getConfiguredSiteOrigin();
    const sourceLabel = session.source === 'web_quote' ? '\u5831\u50f9\u9801' : '\u7db2\u7ad9\u804a\u5929';
    const recentMsgs = conversationMessages.slice(-3);
    const summaryLines = recentMsgs.map((message) => {
      const icon = message.role === 'user' ? '\u5ba2\u6236' : 'AI';
      const label = message.role === 'user' ? '\u5ba2\u6236' : 'AI';
      const content = escapeHtml(message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''));
      return `${icon} ${label}: ${content}`;
    }).join('\n');

    const message = [
      '<b>AI \u5df2\u8f49\u4ea4\u771f\u4eba\u5ba2\u670d</b>',
      '',
      `\u4f86\u6e90\uff1a${sourceLabel}`,
      ...(session.quote ? [`\u5831\u50f9\u55ae\uff1a${session.quote.quoteNumber}`] : []),
      `\u8a2a\u5ba2\uff1a${escapeHtml(session.visitorName || '\u672a\u63d0\u4f9b')}`,
      `\u8f49\u63a5\u539f\u56e0\uff1a${escapeHtml(transitionMessage.substring(0, 200))}`,
      '',
      '<b>\u6700\u8fd1\u5c0d\u8a71\uff1a</b>',
      summaryLines,
      '',
      '\u8acb\u76e1\u5feb\u63a5\u624b\u9019\u6bb5\u5c0d\u8a71\u3002',
      `<a href="${appUrl}/admin/chat?session=${sessionId}">\u524d\u5f80\u5f8c\u53f0\u804a\u5929</a>`,
    ].join('\n');

    const result = await sendTelegramNotification(message, {
      type: 'chat_transfer',
      entityType: 'chat_session',
      entityId: sessionId,
      chatIdSettingKey: 'telegram_chat_id_customer_service',
      replyToMessageId: session.telegramMessageId || undefined,
    });

    return result.messageId;
  } catch (e) {
    console.error('Failed to notify transfer:', e);
    return undefined;
  }
}

/**
 * Forward customer message to Telegram in transferred state (for reply thread).
 */
async function forwardCustomerMessageToTelegram(
  sessionId: string,
  telegramMessageId: number | null,
  customerMessage: string,
  visitorName: string | null,
) {
  try {
    if (!telegramMessageId) return;

    const { sendTelegramNotification, escapeHtml } = await import('@/lib/notifications/telegram');
    const chatId = await getSetting<string>('telegram_chat_id_customer_service', '');
    if (!chatId) return;

    const name = escapeHtml(visitorName || '\u5ba2\u6236');
    const content = escapeHtml(customerMessage.substring(0, 2000));
    const message = `<b>${name}:</b>
${content}`;

    await sendTelegramNotification(message, {
      type: 'chat_forwarded',
      entityType: 'chat_session',
      entityId: sessionId,
      chatIdSettingKey: 'telegram_chat_id_customer_service',
      replyToMessageId: telegramMessageId,
    });
  } catch (e) {
    console.error('Failed to forward customer message to Telegram:', e);
  }
}

/**
 * Background task: extract customer info from conversation using a separate lightweight AI call.
 * This runs fire-and-forget after the streaming response is complete.
 */
async function extractAndProcessCustomerInfo(
  sessionId: string,
  conversationMessages: ChatMessage[],
  engine: { chat: (msgs: ChatMessage[], prompt: string) => Promise<any>; provider: string; model: string },
  sessionSource?: string,
) {
  try {
    // Only extract if there are enough user messages
    const userMsgCount = conversationMessages.filter(m => m.role === 'user').length;
    if (userMsgCount < 1) return;

    // Build a condensed conversation summary for extraction
    const convoText = conversationMessages
      .map(m => `${m.role === 'user' ? '\u5ba2\u6236' : 'AI'}\uff1a${m.content}`)
      .join('\n');

    const extractionResult = await engine.chat(
      [{ role: 'user', content: convoText }],
      EXTRACTION_SYSTEM_PROMPT,
    );
    await recordAIUsageEvent({
      source: 'chat_extraction',
      provider: extractionResult.provider,
      model: extractionResult.model,
      inputTokens: extractionResult.usage?.input_tokens || 0,
      outputTokens: extractionResult.usage?.output_tokens || 0,
      estimatedCost: calculateCost(
        extractionResult.model,
        extractionResult.usage?.input_tokens || 0,
        extractionResult.usage?.output_tokens || 0,
      ),
      metadata: { sessionId, source: sessionSource || 'website' },
    });

    // Parse extraction result
    let info: ExtractedCustomerInfo | null = null;
    try {
      const jsonStr = extractionResult.content
        .replace(/```json\s*/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      // Only keep non-null fields
      info = {};
      if (parsed.contactName && parsed.contactName !== 'null') info.contactName = parsed.contactName;
      if (parsed.mobile && parsed.mobile !== 'null') info.mobile = parsed.mobile;
      if (parsed.phone && parsed.phone !== 'null') info.phone = parsed.phone;
      if (parsed.address && parsed.address !== 'null') info.address = parsed.address;
      if (parsed.companyName && parsed.companyName !== 'null') info.companyName = parsed.companyName;
      if (parsed.email && parsed.email !== 'null') info.email = parsed.email;
      if (parsed.services?.length) info.services = parsed.services;
      if (parsed.requirements && parsed.requirements !== 'null') info.requirements = parsed.requirements;
    } catch (e) {
      console.error('[Chat] Failed to parse extraction result:', e);
      return;
    }

    // Check if we have any meaningful info
    if (!info || Object.keys(info).length === 0) return;

    // Update the latest assistant message with extracted info
    const latestAssistantMsg = await prisma.chatMessage.findFirst({
      where: { sessionId, role: 'assistant' },
      orderBy: { createdAt: 'desc' },
    });
    if (latestAssistantMsg) {
      await prisma.chatMessage.update({
        where: { id: latestAssistantMsg.id },
        data: { extractedInfo: JSON.parse(JSON.stringify(info)) },
      });
    }

    // Update session with visitor info
    const updateData: any = {};
    if (info.contactName) updateData.visitorName = info.contactName;
    if (info.mobile || info.phone) {
      updateData.visitorContact = info.mobile || info.phone;
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.chatSession.update({ where: { id: sessionId }, data: updateData });
    }

    // Check if all required info collected (name + phone/mobile + address)
    // Skip auto-create for consultation/transfer_request sessions because the
    // customer record was already created earlier in the flow.
    const skipAutoCreate = sessionSource === 'consultation' || sessionSource === 'transfer_request';
    const infoComplete = !!(info.contactName && (info.mobile || info.phone) && info.address);
    if (infoComplete && !skipAutoCreate) {
      autoCreateCustomerAndQuote(sessionId, info).catch(console.error);
    }

  } catch (error) {
    console.error('[Chat] extractAndProcessCustomerInfo error:', error);
  }
}

/**
 * Auto-create customer and draft quote when all required info is collected
 */
async function autoCreateCustomerAndQuote(
  sessionId: string,
  info: AICustomerServiceResponse['extractedInfo']
) {
  if (!info) return;

  try {
    const { contactName, mobile, phone, address, companyName, email, services, requirements } = info;
    if (!contactName || (!mobile && !phone)) return;

    const { getNextNumber } = await import('@/lib/daily-counter');
    const { getSetting: getSet } = await import('@/lib/settings');

    // Check for duplicate: search by mobile or phone
    let existingCustomer = null;
    if (mobile) {
      const cleanMobile = mobile.replace(/[^0-9]/g, '');
      existingCustomer = await prisma.customer.findFirst({
        where: { contacts: { some: { mobile: { contains: cleanMobile } } } },
      });
    }
    if (!existingCustomer && phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      existingCustomer = await prisma.customer.findFirst({
        where: { contacts: { some: { phone: { contains: cleanPhone } } } },
      });
    }

    let customerId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Generate customer number
      const customerNumber = await getNextNumber('customer');

      const customer = await prisma.customer.create({
        data: {
          customerNumber,
          notes: 'AI \u5ba2\u670d\u81ea\u52d5\u5efa\u7acb',
          contacts: {
            create: {
              name: contactName,
              mobile: mobile?.replace(/[^0-9]/g, '') || null,
              phone: phone?.replace(/[^0-9]/g, '') || null,
              email: email || null,
              isPrimary: true,
            },
          },
          ...(address ? {
            locations: {
              create: {
                name: address.substring(0, 20) + (address.length > 20 ? '...' : ''),
                address,
                isPrimary: true,
              },
            },
          } : {}),
          ...(companyName ? {
            companyNames: {
              create: {
                companyName,
                isPrimary: true,
              },
            },
          } : {}),
        },
      });
      customerId = customer.id;
    }

    // Create draft quote
    const quoteNumber = await getNextNumber('quote');
    const taxRate = await getSet<number>('default_tax_rate', 5);
    const validDays = await getSet<number>('quote_valid_days', 60);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Get customer's primary contact for QuoteContact
    const primaryContact = await prisma.contact.findFirst({
      where: { customerId, isPrimary: true },
    });

    const summaryParts = [];
    if (services?.length) summaryParts.push(`\u9700\u6c42\u670d\u52d9\uff1a${services.join('\u3001')}`);
    if (requirements) summaryParts.push(`\u9700\u6c42\u8aaa\u660e\uff1a${requirements}`);
    if (address) summaryParts.push(`\u5730\u5740\uff1a${address}`);
    const summary = summaryParts.join('\n') || 'AI \u5ba2\u670d\u5c0d\u8a71\u6458\u8981';

    const primaryLocation = await prisma.location.findFirst({
      where: { customerId, isPrimary: true },
    });

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId,
        locationId: primaryLocation?.id || null,
        status: 'draft',
        taxRate,
        validUntil,
        createdBy: SYSTEM_USER_ID,
        internalNote: `[AI \u5ba2\u670d\u81ea\u52d5\u5efa\u7acb]\n${summary}`,
        ...(primaryContact ? {
          contacts: {
            create: {
              contactId: primaryContact.id,
              isPrimary: true,
            },
          },
        } : {}),
      },
    });

    // Update session with customer and quote
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { customerId, quoteId: quote.id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: SYSTEM_USER_ID,
        action: 'create',
        tableName: 'quotes',
        recordId: quote.id,
        after: { quoteNumber, source: 'ai_chat', sessionId },
      },
    });

    // Telegram notification: info collected
    notifyInfoCollected(sessionId, info, quoteNumber).catch(console.error);

  } catch (error) {
    console.error('Auto-create customer/quote error:', error);
  }
}

async function notifyInfoCollected(
  sessionId: string,
  info: AICustomerServiceResponse['extractedInfo'],
  quoteNumber: string,
) {
  try {
    const { sendTelegramNotification, escapeHtml } = await import('@/lib/notifications/telegram');
    const chatId = await getSetting<string>('telegram_chat_id_customer_service', '');
    if (!chatId) return;

    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    const appUrl = getConfiguredSiteOrigin();
    const message = [
      '<b>\u5df2\u6536\u96c6\u5ba2\u6236\u8cc7\u8a0a</b>',
      '',
      `\u59d3\u540d\uff1a${escapeHtml(info?.contactName || '\u672a\u63d0\u4f9b')}`,
      `\u624b\u6a5f\uff1a${info?.mobile || '\u672a\u63d0\u4f9b'}`,
      `\u96fb\u8a71\uff1a${info?.phone || '\u672a\u63d0\u4f9b'}`,
      `\u5730\u5740\uff1a${escapeHtml(info?.address || '\u672a\u63d0\u4f9b')}`,
      ...(info?.companyName ? [`\u516c\u53f8\u540d\u7a31\uff1a${escapeHtml(info.companyName)}`] : []),
      `\u5831\u50f9\u55ae\uff1a${quoteNumber}`,
      '',
      `<a href="${appUrl}/admin/chat?session=${sessionId}">\u524d\u5f80\u5f8c\u53f0\u804a\u5929</a>`,
    ].join('\n');

    const result = await sendTelegramNotification(message, {
      type: 'chat_info_collected',
      entityType: 'chat_session',
      entityId: sessionId,
      chatIdSettingKey: 'telegram_chat_id_customer_service',
      replyToMessageId: session?.telegramMessageId || undefined,
    });

    if (result.messageId && session && !session.telegramMessageId) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { telegramMessageId: result.messageId },
      });
    }
  } catch (e) {
    console.error('Failed to notify info collected:', e);
  }
}

async function budgetWarning(currentSpend: number, budget: number) {
  try {
    const { sendTelegramNotification } = await import('@/lib/notifications/telegram');
    const pct = ((currentSpend / budget) * 100).toFixed(1);
    const message = [
      '<b>AI \u9810\u7b97\u8b66\u793a</b>',
      '',
      `\u4f7f\u7528\u7387\uff1a${pct}%`,
      `\u76ee\u524d\u82b1\u8cbb\uff1a${currentSpend.toFixed(4)} USD`,
      `\u6708\u9810\u7b97\uff1a${budget.toFixed(2)} USD`,
      '',
      '\u7576\u4f7f\u7528\u7387\u9054\u5230 100% \u6642\uff0cAI \u5ba2\u670d\u6703\u81ea\u52d5\u505c\u6b62\u56de\u8986\u3002',
    ].join('\n');

    await sendTelegramNotification(message, {
      type: 'ai_budget_warning',
      entityType: 'system',
    });
  } catch (e) {
    console.error('Failed to send budget warning:', e);
  }
}
