import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { getOriginFromRequest } from '@/lib/site-url';

async function getPaymentSummary(quoteId: string) {
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        select: { totalAmount: true }
    });
    const payments = await prisma.payment.findMany({
        where: { quoteId: quoteId }
    });
    const paidAmount = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const totalAmount = Number(quote?.totalAmount || 0);

    return {
        totalAmount,
        paidAmount,
        remainingAmount: Math.max(0, totalAmount - paidAmount),
        isOverpaid: paidAmount > totalAmount
    };
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ paymentId: string }> }
) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { paymentId } = await params;
        const body = await request.json();
        const { type, amount, method, paidAt, notes } = body;

        const before = await prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!before) {
            return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
        }

        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                type,
                amount,
                method,
                paidAt: paidAt ? new Date(paidAt) : undefined,
                notes
            }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'update',
            tableName: 'payments',
            recordId: paymentId,
            before: before as any,
            after: payment as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        const summary = await getPaymentSummary(payment.quoteId);

        // Send Telegram notification (Update event)
        try {
            const { formatPaymentMessage, fireAndForgetNotification } = await import('@/lib/notifications/telegram');
            const quote = await prisma.quote.findUnique({
                where: { id: payment.quoteId },
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
                const message = `⚠️ <b>收款紀錄已修改</b>\n\n` + formatPaymentMessage({
                    id: quote.id,
                    quoteNumber: quote.quoteNumber,
                    customerName: quote.customer?.companyNames[0]?.companyName || quote.customer?.contacts[0]?.name || '未知客戶',
                    amount: payment.amount,
                    remainingAmount: summary.remainingAmount,
                    isFullPayment: summary.remainingAmount <= 0,
                    baseUrl: getOriginFromRequest(request)
                });
                fireAndForgetNotification(message, { type: 'payment_updated', entityType: 'quotes', entityId: quote.id });
            }
        } catch (e) {
            console.error('Payment update notification failed:', e);
        }

        return NextResponse.json({ payment, summary });
    });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ paymentId: string }> }
) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { paymentId } = await params;

        const before = await prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!before) {
            return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
        }

        const quoteId = before.quoteId;

        await prisma.payment.delete({
            where: { id: paymentId }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'payments',
            recordId: paymentId,
            before: before as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        const summary = await getPaymentSummary(quoteId);
        return NextResponse.json({ success: true, summary });
    });
}
