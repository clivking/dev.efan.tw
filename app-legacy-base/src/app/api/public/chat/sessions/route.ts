import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import { writeAudit } from '@/lib/audit';
import { getNextNumber } from '@/lib/daily-counter';
import { SYSTEM_USER_ID } from '@/lib/system-user';
import { DEFAULT_CUSTOMER_NOTE } from '@/lib/quote-defaults';
import { getDefaultCustomerNoteSetting } from '@/lib/server-quote-defaults';
import { verifyTurnstile } from '@/lib/turnstile';
import { buildConsultationSummary, buildInternalNoteSummary, buildServiceShorthand } from '@/lib/utils/consultation-summary';
import { TIER_NAMES } from '@/lib/types/consultation-types';
import { sendConsultationConfirmation } from '@/lib/email';
import {
    sendTelegramNotification,
    formatConsultationNotification,
    formatTransferNotification,
} from '@/lib/notifications/telegram';
import { getConfiguredSiteOrigin, getOriginFromRequest } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

/**
 * POST /api/public/chat/sessions — Create a new chat session
 * Public endpoint, no auth required.
 *
 * Handles three source modes:
 * - web_quote: original PreChatForm flow (no changes)
 * - consultation: Step 3 submit (creates ContactRequest + ChatSession + Customer)
 * - transfer_request: transfer to human (creates ContactRequest + ChatSession(transferred) + Customer)
 */
export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const clientIp = typeof ip === 'string' ? ip.split(',')[0].trim() : 'unknown';

        // Rate limiting: max 10 sessions per IP per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentSessions = await prisma.chatSession.count({
            where: {
                metadata: { path: ['ip'], equals: clientIp },
                createdAt: { gte: oneHourAgo },
            },
        });
        if (recentSessions >= 10) {
            return NextResponse.json({ error: '請求過於頻繁，請稍後再試' }, { status: 429 });
        }

        // Check if AI chat is enabled
        const chatEnabled = await getSetting<boolean>('ai_chat_enabled', true);
        if (!chatEnabled) {
            return NextResponse.json({ error: 'AI 客服目前已暫停' }, { status: 503 });
        }

        const body = await request.json().catch(() => ({}));
        const source = body.source || 'web_home';

        // ─── Route by source ────────────────────────────────────────

        if (source === 'consultation') {
            return handleConsultation(body, clientIp, request);
        }

        if (source === 'transfer_request') {
            return handleTransfer(body, clientIp, request);
        }

        // ─── Default: web_home / web_quote (original flow) ──────────

        return handleLegacy(body, clientIp, request);

    } catch (error: any) {
        console.error('Create chat session error:', error);
        return NextResponse.json({ error: '建立對話失敗' }, { status: 500 });
    }
}

// ═══════════════════════════════════════════════════════════════════
// Consultation (Step 3 submit)
// ═══════════════════════════════════════════════════════════════════

async function handleConsultation(body: any, clientIp: string, request: NextRequest) {
    const baseUrl = getOriginFromRequest(request);
    // Turnstile verification
    const turnstileEnabled = await getSetting('turnstile_enabled', true);
    if (turnstileEnabled) {
        const ok = await verifyTurnstile(body.turnstileToken);
        if (!ok) {
            return NextResponse.json({ error: '驗證失敗，請重新整理頁面' }, { status: 403 });
        }
    }

    const {
        visitorName, visitorContact, visitorEmail, visitorLineId,
        consultationData, installLocation, companyName, message,
        otherDescription,
    } = body;

    // Validation
    if (!visitorName?.trim()) {
        return NextResponse.json({ error: '聯絡人姓名為必填' }, { status: 400 });
    }
    if (!visitorContact?.trim()) {
        return NextResponse.json({ error: '手機或電話為必填' }, { status: 400 });
    }

    // Build summary using shared function
    const summary = consultationData
        ? buildConsultationSummary(consultationData)
        : '';

    // 1. Create ContactRequest
    const contactRequest = await prisma.contactRequest.create({
        data: {
            name: visitorName.trim(),
            phone: visitorContact.trim(),
            email: visitorEmail || null,
            services: consultationData?.services || [],
            consultationData: consultationData || null,
            address: installLocation || null,
            lineId: visitorLineId || null,
            source: 'ai_consultation',
            status: 'new',
            ipAddress: clientIp,
        },
    });

    // 2. Create ChatSession
    const session = await prisma.chatSession.create({
        data: {
            source: 'consultation',
            visitorName: visitorName.trim(),
            visitorContact: visitorContact.trim(),
            visitorEmail: visitorEmail || null,
            visitorLineId: visitorLineId || null,
            contactRequestId: contactRequest.id,
            metadata: {
                ip: clientIp,
                userAgent: request.headers.get('user-agent') || '',
            },
        },
    });

    // 3. Auto-create customer (phone dedup) — returns IDs for quote creation
    const customerResult = await autoCreateCustomer({
        contactName: visitorName.trim(),
        phone: visitorContact.trim(),
        email: visitorEmail,
        companyName,
        address: installLocation,
        sessionId: session.id,
        contactRequestId: contactRequest.id,
        clientIp,
    });

    // 4. Auto-create draft Quote (same as quote-request flow)
    let quoteNumber = '';
    let quoteId = '';
    if (customerResult && consultationData?.services?.length) {
        try {
            const internalNote = buildInternalNoteSummary({
                services: consultationData.services,
                details: consultationData.details || {},
                budgetTiers: consultationData.budgetTiers || [],
                address: installLocation,
                message,
            });

            quoteNumber = await getNextNumber('quote');
            const validDays = Number(await getSetting('quote_valid_days', 60));
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + validDays);
            const taxRate = Number(await getSetting('default_tax_rate', 5));
            const defaultCustomerNote = await getDefaultCustomerNoteSetting();



            const newQuote = await prisma.quote.create({
                data: {
                    quoteNumber,
                    customerId: customerResult.customerId,
                    companyNameId: customerResult.companyNameId || null,
                    locationId: customerResult.locationId || null,
                    status: 'draft',
                    taxRate,
                    validUntil,
                    name: '線上報價需求',
                    nameEn: 'Online Quote Request',
                    internalNote,
                    customerNote: defaultCustomerNote || DEFAULT_CUSTOMER_NOTE,
                    createdBy: SYSTEM_USER_ID,
                },
            });
            quoteId = newQuote.id;

            // QuoteContact link
            if (customerResult.contactId) {
                await prisma.quoteContact.create({
                    data: { quoteId: newQuote.id, contactId: customerResult.contactId, isPrimary: true },
                });
            }

            // Update customer lastQuoteAt
            await prisma.customer.update({
                where: { id: customerResult.customerId },
                data: { lastQuoteAt: new Date() },
            });

            // Audit log for quote
            writeAudit({
                userId: SYSTEM_USER_ID,
                action: 'create',
                tableName: 'quotes',
                recordId: newQuote.id,
                after: {
                    quoteNumber,
                    source: 'ai_consultation',
                    contactName: visitorName,
                    phone: visitorContact,
                    services: consultationData.services,
                } as any,
                ipAddress: clientIp,
            }).catch(console.error);
        } catch (quoteErr) {
            console.error('[Consultation] Auto-create quote error:', quoteErr);
        }
    }

    // 5. Welcome message (indicating submission received)
    const quoteInfo = quoteNumber ? `（報價單：${quoteNumber}）` : '';
    await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            role: 'assistant',
            content: `✅ 已收到${visitorName}的報價諮詢${quoteInfo}！我們會在一個工作日內與您聯繫。`,
        },
    });

    // 6. Email confirmation (fire-and-forget)
    if (visitorEmail) {
        sendConsultationConfirmation({
            contactName: visitorName.trim(),
            email: visitorEmail,
            services: consultationData?.services || [],
            budgetTiers: consultationData?.budgetTiers || [],
            summary,
            address: installLocation,
            lineId: visitorLineId,
        }).catch(e => console.error('[Email] consultation confirm failed:', e));
    }

    // 7. Telegram notification (fire-and-forget) — include quote info
    const serviceShort = consultationData?.services?.length
        ? buildServiceShorthand(consultationData.services, consultationData.details || {})
        : '';
    const tierText = consultationData?.budgetTiers?.length
        ? consultationData.budgetTiers.map((t: string) => TIER_NAMES[t] || t).join('、')
        : '';
    const appUrl = baseUrl;

    const telegramLines = [
        `📋 新的報價諮詢`,
        `聯絡人：${visitorName.trim()}`,
        `手機：${visitorContact.trim()}`,
        visitorEmail ? `Email：${visitorEmail}` : '',
        installLocation ? `安裝地址：${installLocation}` : '',
        companyName ? `公司名稱：${companyName}` : '',
        '',
        summary,
        '',
        quoteNumber ? `報價單：${quoteNumber}` : '',
        quoteNumber ? `👉 ${appUrl}/admin/quotes/${quoteNumber}` : `👉 後台查看`,
    ].filter(Boolean).join('\n');

    sendTelegramNotification(telegramLines, {
        type: 'chat_consultation',
        entityType: 'chat_session',
        entityId: session.id,
    }).then(result => {
        if (result.messageId) {
            prisma.chatSession.update({
                where: { id: session.id },
                data: { telegramMessageId: result.messageId },
            }).catch(console.error);
        }
    }).catch(console.error);

    // 8. Audit log
    writeAudit({
        userId: SYSTEM_USER_ID,
        action: 'create',
        tableName: 'contact_requests',
        recordId: contactRequest.id,
        after: { source: 'ai_consultation', contactName: visitorName, phone: visitorContact } as any,
        ipAddress: clientIp,
    }).catch(console.error);

    return NextResponse.json({
        sessionId: session.id,
        contactRequestId: contactRequest.id,
        quoteNumber: quoteNumber || undefined,
        quoteId: quoteId || undefined,
    });
}

// ═══════════════════════════════════════════════════════════════════
// Transfer to Human
// ═══════════════════════════════════════════════════════════════════

async function handleTransfer(body: any, clientIp: string, request: NextRequest) {
    const baseUrl = getOriginFromRequest(request);
    // Turnstile verification
    const turnstileEnabled = await getSetting('turnstile_enabled', true);
    if (turnstileEnabled) {
        const ok = await verifyTurnstile(body.turnstileToken);
        if (!ok) {
            return NextResponse.json({ error: '驗證失敗，請重新整理頁面' }, { status: 403 });
        }
    }

    const {
        visitorName, visitorContact, visitorEmail, visitorLineId,
        consultationData, installLocation, companyName, message,
    } = body;

    // Validation
    if (!visitorName?.trim()) {
        return NextResponse.json({ error: '聯絡人姓名為必填' }, { status: 400 });
    }
    if (!visitorContact?.trim()) {
        return NextResponse.json({ error: '手機或電話為必填' }, { status: 400 });
    }

    // Build summary if consultation data present (from Step 4 transfer)
    const summary = consultationData
        ? buildConsultationSummary(consultationData)
        : undefined;

    // 1. Create ContactRequest
    const contactRequest = await prisma.contactRequest.create({
        data: {
            name: visitorName.trim(),
            phone: visitorContact.trim(),
            email: visitorEmail || null,
            services: consultationData?.services || [],
            consultationData: consultationData || null,
            address: installLocation || null,
            lineId: visitorLineId || null,
            source: 'ai_transfer',
            status: 'new',
            ipAddress: clientIp,
        },
    });

    // 2. Create ChatSession (status = transferred)
    const session = await prisma.chatSession.create({
        data: {
            source: 'transfer_request',
            status: 'transferred',
            visitorName: visitorName.trim(),
            visitorContact: visitorContact.trim(),
            visitorEmail: visitorEmail || null,
            visitorLineId: visitorLineId || null,
            contactRequestId: contactRequest.id,
            metadata: {
                ip: clientIp,
                userAgent: request.headers.get('user-agent') || '',
            },
        },
    });

    // 3. Auto-create customer (phone dedup)
    await autoCreateCustomer({
        contactName: visitorName.trim(),
        phone: visitorContact.trim(),
        email: visitorEmail,
        companyName,
        address: installLocation,
        sessionId: session.id,
        contactRequestId: contactRequest.id,
        clientIp,
    });

    // 4. Telegram notification to CS group (fire-and-forget)
    const telegramMsg = formatTransferNotification({
        contactName: visitorName.trim(),
        phone: visitorContact.trim(),
        email: visitorEmail,
        lineId: visitorLineId,
        address: installLocation,
        companyName,
        summary,
        message,
        sessionId: session.id,
        baseUrl,
    });

    sendTelegramNotification(telegramMsg, {
        type: 'chat_transfer_request',
        entityType: 'chat_session',
        entityId: session.id,
        chatIdSettingKey: 'telegram_chat_id_customer_service',
    }).then(result => {
        if (result.messageId) {
            prisma.chatSession.update({
                where: { id: session.id },
                data: { telegramMessageId: result.messageId },
            }).catch(console.error);
        }
    }).catch(console.error);

    // 5. Audit log
    writeAudit({
        userId: SYSTEM_USER_ID,
        action: 'create',
        tableName: 'contact_requests',
        recordId: contactRequest.id,
        after: { source: 'ai_transfer', contactName: visitorName, phone: visitorContact } as any,
        ipAddress: clientIp,
    }).catch(console.error);

    return NextResponse.json({
        sessionId: session.id,
        contactRequestId: contactRequest.id,
    });
}

// ═══════════════════════════════════════════════════════════════════
// Legacy: web_home / web_quote (original flow, unchanged logic)
// ═══════════════════════════════════════════════════════════════════

async function handleLegacy(body: any, clientIp: string, request: NextRequest) {
    const source = body.source === 'web_quote' ? 'web_quote' : 'web_home';
    const quoteId = body.quoteId || null;
    const visitorName = body.visitorName || null;
    const visitorContact = body.visitorContact || null;

    const welcomeMessage = await getSetting<string>(
        'ai_chat_welcome_message',
        '您好！我是一帆的 AI 客服，有什麼可以幫您的嗎？😊'
    );

    const session = await prisma.chatSession.create({
        data: {
            source: source as any,
            quoteId,
            visitorName,
            visitorContact,
            metadata: {
                ip: clientIp,
                userAgent: request.headers.get('user-agent') || '',
                pageUrl: body.pageUrl || '',
            },
        },
    });

    await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            role: 'assistant',
            content: welcomeMessage,
        },
    });

    // Fire and forget: Telegram notification for new chat
    notifyNewChat(session.id, source, visitorName, visitorContact).catch(console.error);

    return NextResponse.json({
        sessionId: session.id,
        welcomeMessage,
    });
}

// ═══════════════════════════════════════════════════════════════════
// Shared Helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Auto-create customer from contact info, with phone dedup.
 * Same logic as Phase 15 inquiry cart.
 */
async function autoCreateCustomer(info: {
    contactName: string;
    phone: string;
    email?: string;
    companyName?: string;
    address?: string;
    sessionId: string;
    contactRequestId: string;
    clientIp: string;
}): Promise<{ customerId: string; contactId: string; companyNameId: string | null; locationId: string | null } | null> {
    try {
        const cleanPhone = info.phone.replace(/[-\s]/g, '');

        // Check for existing customer by phone
        let customer = null;
        if (cleanPhone) {
            customer = await prisma.customer.findFirst({
                where: {
                    contacts: { some: { mobile: { in: [info.phone, cleanPhone] } } },
                    isDeleted: false,
                },
                include: {
                    contacts: { where: { isPrimary: true }, take: 1 },
                    companyNames: { where: { isPrimary: true }, take: 1 },
                    locations: { where: { isPrimary: true }, take: 1 },
                },
            });
            if (!customer) {
                customer = await prisma.customer.findFirst({
                    where: {
                        contacts: { some: { phone: { in: [info.phone, cleanPhone] } } },
                        isDeleted: false,
                    },
                    include: {
                        contacts: { where: { isPrimary: true }, take: 1 },
                        companyNames: { where: { isPrimary: true }, take: 1 },
                        locations: { where: { isPrimary: true }, take: 1 },
                    },
                });
            }
        }

        let customerId: string;
        let contactId: string;
        let companyNameId: string | null = null;
        let locationId: string | null = null;

        if (customer) {
            customerId = customer.id;
            contactId = (customer as any).contacts?.[0]?.id || '';
            if (!contactId) {
                const anyContact = await prisma.contact.findFirst({ where: { customerId } });
                contactId = anyContact?.id || '';
            }
            companyNameId = (customer as any).companyNames?.[0]?.id || null;
            locationId = (customer as any).locations?.[0]?.id || null;
        } else {
            // Create new customer
            const customerNumber = await getNextNumber('customer');
            const newCustomer = await prisma.customer.create({
                data: {
                    customerNumber,
                    notes: 'AI 諮詢自動建立',
                    contacts: {
                        create: {
                            name: info.contactName,
                            mobile: cleanPhone.startsWith('09') ? cleanPhone : null,
                            phone: cleanPhone.startsWith('09') ? null : cleanPhone,
                            email: info.email || null,
                            isPrimary: true,
                        },
                    },
                    ...(info.address ? {
                        locations: {
                            create: {
                                name: '施工地址',
                                address: info.address,
                                isPrimary: true,
                            },
                        },
                    } : {}),
                    ...(info.companyName ? {
                        companyNames: {
                            create: {
                                companyName: info.companyName,
                                isPrimary: true,
                            },
                        },
                    } : {}),
                },
                include: {
                    contacts: { where: { isPrimary: true }, take: 1 },
                    companyNames: { where: { isPrimary: true }, take: 1 },
                    locations: { where: { isPrimary: true }, take: 1 },
                },
            });
            customerId = newCustomer.id;
            contactId = newCustomer.contacts[0]?.id || '';
            companyNameId = newCustomer.companyNames[0]?.id || null;
            locationId = newCustomer.locations[0]?.id || null;

            writeAudit({
                userId: SYSTEM_USER_ID,
                action: 'create',
                tableName: 'customers',
                recordId: customerId,
                after: { source: 'ai_consultation', contactName: info.contactName, phone: info.phone } as any,
                ipAddress: info.clientIp,
            }).catch(console.error);
        }

        // Link customer to session and contact request
        await prisma.chatSession.update({
            where: { id: info.sessionId },
            data: { customerId },
        });
        await prisma.contactRequest.update({
            where: { id: info.contactRequestId },
            data: { customerId },
        });

        return { customerId, contactId, companyNameId, locationId };
    } catch (error) {
        console.error('Auto-create customer error:', error);
        return null;
    }
}

/**
 * Notify new legacy chat via Telegram (original flow).
 */
async function notifyNewChat(sessionId: string, source: string, visitorName?: string | null, visitorContact?: string | null) {
    try {
        const { sendTelegramNotification: send, escapeHtml } = await import('@/lib/notifications/telegram');
        const chatId = await getSetting<string>('telegram_chat_id_customer_service', '');
        if (!chatId) return;

        const appUrl = getConfiguredSiteOrigin();
        const sourceLabel = source === 'web_quote' ? '互動頁' : '官網';
        const time = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

        const contactInfo = visitorName
            ? `姓名：${escapeHtml(visitorName)}\n電話：${visitorContact || '未提供'}`
            : '[客戶尚未留下聯絡資訊]';

        const message =
            `💬 <b>新客戶對話</b>\n\n` +
            `來源：${sourceLabel}\n` +
            `時間：${time}\n` +
            `${contactInfo}\n\n` +
            `💬 回覆此訊息即可直接回覆客戶\n` +
            `<a href="${appUrl}/admin/chat?session=${sessionId}">或到後台操作</a>`;

        const result = await send(message, {
            type: 'chat_new',
            entityType: 'chat_session',
            entityId: sessionId,
            chatIdSettingKey: 'telegram_chat_id_customer_service',
        });

        if (result.messageId) {
            await prisma.chatSession.update({
                where: { id: sessionId },
                data: { telegramMessageId: result.messageId },
            });
        }
    } catch (e) {
        console.error('Failed to notify new chat:', e);
    }
}
