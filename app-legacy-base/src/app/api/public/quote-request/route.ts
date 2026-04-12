import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getNextNumber } from '@/lib/daily-counter';
import { getSetting } from '@/lib/settings';
import { writeAudit } from '@/lib/audit';
import { fireAndForgetNotification } from '@/lib/notifications/telegram';
import { SYSTEM_USER_ID } from '@/lib/system-user';
import { DEFAULT_CUSTOMER_NOTE } from '@/lib/quote-defaults';
import { getDefaultCustomerNoteSetting } from '@/lib/server-quote-defaults';
import { verifyTurnstile } from '@/lib/turnstile';
import { sendQuoteRequestCompanyNotification, sendQuoteRequestCustomerConfirmation } from '@/lib/email';
import { SERVICE_NAMES, TIER_NAMES } from '@/lib/types/consultation-types';
import { buildInternalNoteSummary, buildServiceShorthand } from '@/lib/utils/consultation-summary';
import { getOriginFromRequest } from '@/lib/site-url';

import { createRateLimiter } from '@/lib/rate-limit';

// 3 requests per minute per IP
const checkRateLimit = createRateLimiter(3, 60_000);




/**
 * POST /api/public/quote-request
 * Submit a quote request from the multi-step form.
 * Creates Customer + Quote (draft, no items).
 * Needs summary is stored in internalNote.
 */
export async function POST(request: NextRequest) {
    try {
        const baseUrl = getOriginFromRequest(request);
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const clientIp = typeof ip === 'string' ? ip.split(',')[0].trim() : 'unknown';

        if (!checkRateLimit(clientIp)) {
            return NextResponse.json({ error: '提交過於頻繁，請稍後再試' }, { status: 429 });
        }

        const body = await request.json();

        // ── Layer 1: Honeypot ──
        if (body.website) {
            return NextResponse.json({
                success: true,
                quoteNumber: 'RECEIVED',
                message: '詢價已送出，我們將盡快與您聯繫',
            });
        }

        // ── Layer 2: Turnstile ──
        const turnstileEnabled = await getSetting('turnstile_enabled', true);
        if (turnstileEnabled) {
            const isValid = await verifyTurnstile(body.turnstileToken);
            if (!isValid) {
                return NextResponse.json({ error: '驗證失敗，請重試' }, { status: 403 });
            }
        }

        const {
            services, details, otherDescription,
            companyName, contactName, mobile, phone,
            address, email, message,
        } = body;

        // budgetTiers kept for backward compat (now optional)
        const budgetTiers = body.budgetTiers || [];

        // Validation
        if (!contactName || !contactName.trim()) {
            return NextResponse.json({ error: '聯絡人姓名為必填' }, { status: 400 });
        }
        if (!mobile && !phone) {
            return NextResponse.json({ error: '手機或電話至少填一個' }, { status: 400 });
        }
        if (!email || !email.trim()) {
            return NextResponse.json({ error: 'Email 為必填' }, { status: 400 });
        }
        if (!address || !address.trim()) {
            return NextResponse.json({ error: '安裝地址為必填' }, { status: 400 });
        }
        if (!services || !Array.isArray(services) || services.length === 0) {
            return NextResponse.json({ error: '請至少選擇一項服務' }, { status: 400 });
        }

        // Build needs summary for internalNote
        const summary = buildInternalNoteSummary({ services, details, budgetTiers, address, message, otherDescription });

        // Build Telegram service shorthand
        const serviceShort = buildServiceShorthand(services, details);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Customer: detect duplicate by mobile or phone
            const cleanMobile = mobile ? mobile.replace(/[-\s]/g, '') : '';
            const cleanPhone = phone ? phone.replace(/[-\s]/g, '') : '';

            let customer = null;
            if (cleanMobile) {
                customer = await tx.customer.findFirst({
                    where: {
                        contacts: { some: { mobile: { in: [mobile, cleanMobile] } } },
                        isDeleted: false,
                    },
                    include: {
                        contacts: { where: { isPrimary: true }, take: 1 },
                        companyNames: { where: { isPrimary: true }, take: 1 },
                    },
                });
            }
            if (!customer && cleanPhone) {
                customer = await tx.customer.findFirst({
                    where: {
                        contacts: { some: { phone: { in: [phone, cleanPhone] } } },
                        isDeleted: false,
                    },
                    include: {
                        contacts: { where: { isPrimary: true }, take: 1 },
                        companyNames: { where: { isPrimary: true }, take: 1 },
                    },
                });
            }

            let customerId: string;
            let contactId: string;
            let companyNameId: string | null = null;
            let locationId: string | null = null;

            if (customer) {
                customerId = customer.id;
                contactId = customer.contacts[0]?.id || '';
                if (!contactId) {
                    const anyContact = await tx.contact.findFirst({ where: { customerId } });
                    contactId = anyContact?.id || '';
                }
                companyNameId = customer.companyNames[0]?.id || null;
            } else {
                // Create new customer
                const customerNumber = await getNextNumber('customer');
                const newCustomer = await tx.customer.create({ data: { customerNumber } });
                customerId = newCustomer.id;

                // Create contact
                const newContact = await tx.contact.create({
                    data: {
                        customerId,
                        name: contactName.trim(),
                        mobile: mobile || null,
                        phone: phone || null,
                        email: email || null,
                        isPrimary: true,
                    },
                });
                contactId = newContact.id;

                // Company name
                if (companyName && companyName.trim()) {
                    const cn = await tx.companyName.create({
                        data: { customerId, companyName: companyName.trim(), isPrimary: true },
                    });
                    companyNameId = cn.id;
                }

                await writeAudit({
                    userId: SYSTEM_USER_ID,
                    action: 'create',
                    tableName: 'customers',
                    recordId: customerId,
                    after: { customerNumber, contactName, mobile, phone, companyName } as any,
                    ipAddress: clientIp,
                });
            }

            // Location
            if (address && address.trim()) {
                const loc = await tx.location.create({
                    data: { customerId, name: '施工地址', address: address.trim(), isPrimary: true },
                });
                locationId = loc.id;
            }

            // 2. Create Quote (draft, no items)
            const quoteNumber = await getNextNumber('quote');
            const validDays = Number(await getSetting('quote_valid_days', 60));
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + validDays);
            const taxRate = Number(await getSetting('default_tax_rate', 5));
            const defaultCustomerNote = await getDefaultCustomerNoteSetting();



            const newQuote = await tx.quote.create({
                data: {
                    quoteNumber,
                    customerId,
                    companyNameId,
                    locationId,
                    status: 'draft',
                    taxRate,
                    validUntil,
                    name: '線上報價需求',
                    nameEn: 'Online Quote Request',
                    internalNote: summary,
                    customerNote: defaultCustomerNote || DEFAULT_CUSTOMER_NOTE,
                    createdBy: SYSTEM_USER_ID,
                },
            });

            // 3. QuoteContact link
            if (contactId) {
                await tx.quoteContact.create({
                    data: { quoteId: newQuote.id, contactId, isPrimary: true },
                });
            }

            // 4. Update customer lastQuoteAt
            await tx.customer.update({
                where: { id: customerId },
                data: { lastQuoteAt: new Date() },
            });

            // 5. Audit log
            await writeAudit({
                userId: SYSTEM_USER_ID,
                action: 'create',
                tableName: 'quotes',
                recordId: newQuote.id,
                after: {
                    quoteNumber,
                    source: 'online_quote_request',
                    contactName,
                    mobile,
                    phone,
                    services,
                } as any,
                ipAddress: clientIp,
            });

            return { quoteNumber, quoteId: newQuote.id, contactName };
        });

        // 6. Telegram notification
        const tierText = budgetTiers.length > 0
            ? budgetTiers.map((t: string) => TIER_NAMES[t] || t).join('、')
            : '';
        const notifyMsg = [
            `📋 新報價需求`,
            `聯絡人：${result.contactName}`,
            mobile ? `手機：${mobile}` : '',
            phone ? `電話：${phone}` : '',
            email ? `Email：${email}` : '',
            companyName ? `公司：${companyName}` : '',
            `服務：${serviceShort}`,
            tierText ? `方案：${tierText}` : '',
            otherDescription ? `其他需求：${otherDescription}` : '',
            `報價單：${result.quoteNumber}`,
            ``,
            `👉 ${baseUrl}/admin/quotes/${result.quoteNumber}`,
        ].filter(Boolean).join('\n');

        fireAndForgetNotification(notifyMsg);

        // ── Email Notifications (fire-and-forget) ──
        const emailData = {
            contactName: result.contactName,
            mobile, phone, email, companyName, address,
            quoteNumber: result.quoteNumber,
            quoteId: result.quoteId,
            services,
            budgetTiers,
            summary,
            message,
            baseUrl,
        };
        // Don't await — fire and forget
        sendQuoteRequestCompanyNotification(emailData).catch(e => console.error('[Email] company notify failed:', e));
        if (email) {
            sendQuoteRequestCustomerConfirmation(emailData).catch(e => console.error('[Email] customer confirm failed:', e));
        }

        return NextResponse.json({
            success: true,
            quoteNumber: result.quoteNumber,
            message: '詢價已送出，我們將盡快與您聯繫',
        });
    } catch (error) {
        console.error('Quote request submission error:', error);
        return NextResponse.json(
            { error: '提交失敗，請稍後再試或直接撥打電話聯繫我們' },
            { status: 500 }
        );
    }
}
