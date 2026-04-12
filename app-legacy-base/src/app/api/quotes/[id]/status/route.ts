import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

import { writeAudit } from '@/lib/audit';

import { getStatusTimestamp } from '@/lib/quote-status';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * 狀態變更
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const body = await request.json();
        const { status, closeReason } = body;
        console.log(`[StatusAPI] Changing quote ${id} to status: ${status}, reason: ${closeReason}`);

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        const before = await prisma.quote.findUnique({ where: { id } });
        if (!before) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        const timestamps = getStatusTimestamp(status as any);
        const data: any = {
            status,
            ...timestamps
        };

        // Handle closed status with reason
        if (status === 'closed' && closeReason) {
            const now = new Date();
            const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;
            const noteEntry = `[${dateStr} 未成交] ${closeReason}`;
            data.internalNote = before.internalNote ? `${before.internalNote}\n${noteEntry}` : noteEntry;
        }

        // Build final update data
        const finalData: any = { ...data };
        let paidAt = (before as any).paidAt;

        // Completed → fill warrantyStartDate + warrantyExpiresAt
        if (status === 'completed') {
            const completedAt = (before as any).completedAt || new Date();
            const warrantyMonths = (before as any).warrantyMonths ?? 12;
            // Don't overwrite warrantyStartDate if already set (manual override)
            const warrantyStartDate = (before as any).warrantyStartDate || completedAt;
            const warrantyExpiresAt = new Date(warrantyStartDate);
            warrantyExpiresAt.setMonth(warrantyExpiresAt.getMonth() + warrantyMonths);

            finalData.completedAt = completedAt;
            finalData.warrantyStartDate = warrantyStartDate;
            finalData.warrantyMonths = warrantyMonths;
            finalData.warrantyExpiresAt = warrantyExpiresAt;
        }

        // Paid → fill paidAt
        if (status === 'paid' && !paidAt) {
            paidAt = new Date();
            finalData.paidAt = paidAt;
        }


        const updatedQuote = await prisma.quote.update({
            where: { id },
            data: finalData
        });

        // 狀態變更為成交 (signed, construction, completed, paid) 時更新客戶的 lastDealAt
        if (updatedQuote.customerId && ['signed', 'construction', 'completed', 'paid'].includes(status)) {
            await prisma.customer.update({
                where: { id: updatedQuote.customerId },
                data: { lastDealAt: new Date() }
            });
        }

        // Auto-generate token if status is sent and no active token exists
        if (status === 'sent') {
            const existingToken = await prisma.quoteToken.findFirst({
                where: { quoteId: id, isActive: true }
            });

            if (!existingToken) {
                const { nanoid } = await import('nanoid');
                await prisma.quoteToken.create({
                    data: {
                        quoteId: id,
                        token: nanoid(21),
                        isActive: true,
                        createdBy: req.user!.id,
                    }
                });
            }
        }

        await writeAudit({
            userId: req.user!.id,
            action: 'status_change',
            tableName: 'quotes',
            recordId: id,
            before: before as any,
            after: updatedQuote as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(updatedQuote);
    });
}
