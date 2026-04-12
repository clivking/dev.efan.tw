import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getNextNumber } from '@/lib/daily-counter';
import { getSetting } from '@/lib/settings';
import { calculateQuote } from '@/lib/quote-calculator';
import { writeAudit } from '@/lib/audit';
import { fireAndForgetNotification } from '@/lib/notifications/telegram';
import { SYSTEM_USER_ID } from '@/lib/system-user';
import { DEFAULT_CUSTOMER_NOTE } from '@/lib/quote-defaults';
import { getDefaultCustomerNoteSetting } from '@/lib/server-quote-defaults';
import { verifyTurnstile } from '@/lib/turnstile';
import { sendInquiryCompanyNotification, sendInquiryCustomerConfirmation } from '@/lib/email';
import { getOriginFromRequest } from '@/lib/site-url';

import { createRateLimiter } from '@/lib/rate-limit';

// 3 requests per minute per IP
const checkRateLimit = createRateLimiter(3, 60_000);

/**
 * POST /api/public/inquiry
 * Submit an inquiry with selected products.
 * Auto-creates Customer + Quote (draft) + QuoteItems.
 * NO authentication required.
 */
export async function POST(request: NextRequest) {
    try {
        const baseUrl = getOriginFromRequest(request);
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const clientIp = typeof ip === 'string' ? ip.split(',')[0].trim() : 'unknown';

        if (!checkRateLimit(clientIp)) {
            return NextResponse.json(
                { error: '提交過於頻繁，請稍後再試' },
                { status: 429 }
            );
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
            companyName,
            contactName,
            mobile,
            email,
            message,
            items,
        } = body;

        // Validation
        if (!contactName || !mobile || !email) {
            return NextResponse.json(
                { error: '聯絡人姓名、手機號碼、Email 為必填欄位' },
                { status: 400 }
            );
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: '詢價清單不能為空' },
                { status: 400 }
            );
        }

        // Fetch all requested products (verify they exist and are not deleted/hidden)
        const productIds = items.map((i: any) => i.productId);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                isDeleted: false,
            },
            select: {
                id: true,
                name: true,
                quoteName: true,
                description: true,
                quoteDesc: true,
                unit: true,
                sellingPrice: true,
                costPrice: true,
                isHiddenItem: true,
            },
        });

        if (products.length === 0) {
            return NextResponse.json(
                { error: '無法找到有效的產品' },
                { status: 400 }
            );
        }

        const productMap = new Map(products.map(p => [p.id, p]));

        // Build the quote inside a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Customer: detect duplicate by mobile
            const cleanMobile = mobile.replace(/[-\s]/g, '');
            let customer = await tx.customer.findFirst({
                where: {
                    contacts: {
                        some: {
                            mobile: { in: [mobile, cleanMobile] },
                        },
                    },
                    isDeleted: false,
                },
                include: {
                    contacts: { where: { isPrimary: true }, take: 1 },
                    companyNames: { where: { isPrimary: true }, take: 1 },
                },
            });

            let customerId: string;
            let contactId: string;
            let companyNameId: string | null = null;

            if (customer) {
                // Use existing customer
                customerId = customer.id;
                contactId = customer.contacts[0]?.id || '';

                // If no contact found with isPrimary, get any contact
                if (!contactId) {
                    const anyContact = await tx.contact.findFirst({
                        where: { customerId: customer.id },
                    });
                    contactId = anyContact?.id || '';
                }

                companyNameId = customer.companyNames[0]?.id || null;
            } else {
                // Create new customer
                const customerNumber = await getNextNumber('customer');
                const newCustomer = await tx.customer.create({
                    data: { customerNumber },
                });
                customerId = newCustomer.id;

                // Create contact
                const newContact = await tx.contact.create({
                    data: {
                        customerId,
                        name: contactName,
                        mobile,
                        email: email || null,
                        isPrimary: true,
                    },
                });
                contactId = newContact.id;

                // Create company name if provided
                if (companyName && companyName.trim()) {
                    const newCompanyName = await tx.companyName.create({
                        data: {
                            customerId,
                            companyName: companyName.trim(),
                            isPrimary: true,
                        },
                    });
                    companyNameId = newCompanyName.id;
                }

                await writeAudit({
                    userId: SYSTEM_USER_ID,
                    action: 'create',
                    tableName: 'customers',
                    recordId: customerId,
                    after: { customerNumber, contactName, mobile, companyName } as any,
                    ipAddress: clientIp,
                });
            }

            // 2. Create Quote (draft)
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
                    status: 'draft',
                    taxRate,
                    validUntil,
                    name: '線上詢價',
                    nameEn: 'Online Inquiry',
                    internalNote: message ? `[線上詢價備註] ${message}` : '[線上詢價]',
                    customerNote: defaultCustomerNote || DEFAULT_CUSTOMER_NOTE,
                    createdBy: SYSTEM_USER_ID,
                },
            });

            // 3. Create QuoteContact link
            if (contactId) {
                await tx.quoteContact.create({
                    data: {
                        quoteId: newQuote.id,
                        contactId,
                        isPrimary: true,
                    },
                });
            }

            // 4. Create QuoteItems (snapshot product data)
            const quoteItems = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const product = productMap.get(item.productId);
                if (!product) continue;

                const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

                quoteItems.push({
                    quoteId: newQuote.id,
                    productId: product.id,
                    name: product.quoteName || product.name,
                    description: product.quoteDesc || product.description,
                    unit: product.unit || '式',
                    quantity,
                    unitPrice: product.sellingPrice,
                    costPrice: product.costPrice,
                    subtotal: Number(product.sellingPrice) * quantity,
                    isHiddenItem: product.isHiddenItem,
                    sortOrder: i,
                });
            }

            if (quoteItems.length > 0) {
                await tx.quoteItem.createMany({ data: quoteItems });
            }

            // 5. Calculate totals
            const calcItems = quoteItems.map(qi => ({
                quantity: qi.quantity,
                unitPrice: Number(qi.unitPrice),
                costPrice: Number(qi.costPrice),
            }));
            const totals = await calculateQuote(calcItems, 0, taxRate);

            await tx.quote.update({
                where: { id: newQuote.id },
                data: {
                    subtotalAmount: totals.subtotalAmount,
                    totalAmount: totals.totalAmount,
                    totalCost: totals.totalCost,
                    totalProfit: totals.totalProfit,
                    taxCost: totals.taxCost,
                    actualProfit: totals.actualProfit,
                },
            });

            // 6. Update customer lastQuoteAt
            await tx.customer.update({
                where: { id: customerId },
                data: { lastQuoteAt: new Date() },
            });

            // 7. Audit log
            await writeAudit({
                userId: SYSTEM_USER_ID,
                action: 'create',
                tableName: 'quotes',
                recordId: newQuote.id,
                after: {
                    quoteNumber,
                    source: 'online_inquiry',
                    contactName,
                    mobile,
                    itemCount: quoteItems.length,
                    totalAmount: totals.totalAmount,
                } as any,
                ipAddress: clientIp,
            });

            return {
                quoteNumber,
                quoteId: newQuote.id,
                totalAmount: totals.totalAmount,
                itemCount: quoteItems.length,
                contactName,
            };
        });

        // 8. Telegram notification (fire-and-forget, outside transaction)
        const notifyMsg = [
            `📩 新線上詢價單`,
            `報價單號：${result.quoteNumber}`,
            `聯絡人：${result.contactName}`,
            companyName ? `公司：${companyName}` : '',
            `${result.itemCount} 項產品`,
            `總報價：$${result.totalAmount.toLocaleString()}`,
            ``,
            `👉 後台查看：${baseUrl}/admin/quotes/${result.quoteNumber}`,
        ].filter(Boolean).join('\n');

        fireAndForgetNotification(notifyMsg);

        // ── Email Notifications (fire-and-forget) ──
        // We need product names for the email, get them from the DB
        const emailProducts = await prisma.quoteItem.findMany({
            where: { quoteId: result.quoteId },
            select: { name: true, quantity: true },
        });
        const emailData = {
            contactName: result.contactName,
            mobile,
            email,
            companyName,
            quoteNumber: result.quoteNumber,
            quoteId: result.quoteId,
            products: emailProducts.map(p => ({ name: p.name, quantity: p.quantity })),
            message,
            baseUrl,
        };
        sendInquiryCompanyNotification(emailData).catch(e => console.error('[Email] company notify failed:', e));
        sendInquiryCustomerConfirmation(emailData).catch(e => console.error('[Email] customer confirm failed:', e));

        return NextResponse.json({
            success: true,
            quoteNumber: result.quoteNumber,
            message: '詢價已送出，我們將盡快與您聯繫',
        });
    } catch (error) {
        console.error('Inquiry submission error:', error);
        return NextResponse.json(
            { error: '提交失敗，請稍後再試或直接撥打電話聯繫我們' },
            { status: 500 }
        );
    }
}
