import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

import { writeAudit } from '@/lib/audit';
import { resolveQuoteId } from '@/lib/resolveQuoteId';
import { getOriginFromRequest } from '@/lib/site-url';

async function getPaymentSummary(quoteId: string) {
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        select: { totalAmount: true, taxRate: true }
    });
    const payments = await prisma.payment.findMany({
        where: { quoteId: quoteId }
    });
    const paidAmount = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const preTaxAmount = Number(quote?.totalAmount || 0);
    const taxRate = Number(quote?.taxRate || 0);
    const taxAmount = Math.round(preTaxAmount * taxRate / 100);
    const totalPayable = preTaxAmount + taxAmount;

    return {
        totalAmount: totalPayable,
        paidAmount,
        remainingAmount: Math.max(0, totalPayable - paidAmount),
        isOverpaid: paidAmount > totalPayable
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const payments = await prisma.payment.findMany({
            where: { quoteId: id },
            orderBy: { paidAt: 'desc' },
            include: {
                recorder: {
                    select: { name: true }
                }
            }
        });
        const summary = await getPaymentSummary(id);
        return NextResponse.json({ payments, summary });
    });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const body = await request.json();
        const { type, amount, method, paidAt, notes } = body;

        const payment = await prisma.payment.create({
            data: {
                quoteId: id,
                type,
                amount,
                method,
                paidAt: new Date(paidAt),
                notes,
                recordedBy: req.user!.id
            }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'create',
            tableName: 'payments',
            recordId: payment.id,
            after: payment as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        const summary = await getPaymentSummary(id);

        // Send Telegram notification (Fire-and-forget)
        try {
            const { formatPaymentMessage, fireAndForgetNotification } = await import('@/lib/notifications/telegram');
            const quote = await prisma.quote.findUnique({
                where: { id },
                include: {
                    customer: {
                        include: {
                            companyNames: { where: { isPrimary: true }, take: 1 },
                            contacts: { where: { isPrimary: true }, take: 1 }
                        }
                    }
                }
            });
            if (quote) {
                const message = formatPaymentMessage({
                    id: quote.id,
                    quoteNumber: quote.quoteNumber,
                    customerName: quote.customer?.companyNames[0]?.companyName || quote.customer?.contacts[0]?.name || '未知客戶',
                    amount: payment.amount,
                    remainingAmount: summary.remainingAmount,
                    isFullPayment: summary.remainingAmount <= 0,
                    baseUrl: getOriginFromRequest(request)
                });
                fireAndForgetNotification(message, { type: 'payment_received', entityType: 'quotes', entityId: quote.id });
            }
        } catch (e) {
            console.error('Payment notification failed:', e);
        }

        return NextResponse.json({ payment, summary });
    });
}
