import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

import { writeAudit } from '@/lib/audit';

import { getNextNumber } from '@/lib/daily-counter';

import { getSetting } from '@/lib/settings';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * 複製報價單
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

        const original = await prisma.quote.findUnique({
            where: { id },
            include: {
                items: true,
                contacts: true
            }
        });

        if (!original) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        const quoteNumber = await getNextNumber('quote');
        const validDays = Number(await getSetting('quote_valid_days', 60));
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validDays);

        const result = await prisma.$transaction(async (tx) => {
            const newQuote = await tx.quote.create({
                data: {
                    quoteNumber,
                    customerId: original.customerId,
                    companyNameId: original.companyNameId,
                    locationId: original.locationId,
                    status: 'draft',
                    taxRate: original.taxRate,
                    subtotalAmount: original.subtotalAmount,
                    discountAmount: original.discountAmount,
                    discountNote: original.discountNote,
                    discountExpiryAt: original.discountExpiryAt,
                    totalAmount: original.totalAmount,
                    totalCost: original.totalCost,
                    totalProfit: original.totalProfit,
                    taxCost: original.taxCost,
                    actualProfit: original.actualProfit,
                    internalNote: original.internalNote,
                    customerNote: original.customerNote,
                    transportFee: original.transportFee,
                    hasTransportFee: original.hasTransportFee,
                    transportFeeCost: original.transportFeeCost,
                    name: (original as any).name || '報價單',
                    nameEn: (original as any).nameEn || 'Quotation',
                    warrantyMonths: original.warrantyMonths,
                    area: original.area,
                    validUntil,
                    createdBy: req.user!.id,
                }
            });

            // Update Customer's lastQuoteAt
            if (original.customerId) {
                await tx.customer.update({
                    where: { id: original.customerId },
                    data: { lastQuoteAt: new Date() }
                });
            }

            // 1.1 Duplicate QuoteContact links
            if (original.contacts.length > 0) {
                await tx.quoteContact.createMany({
                    data: original.contacts.map((qc: any) => ({
                        quoteId: newQuote.id,
                        contactId: qc.contactId,
                        isPrimary: qc.isPrimary
                    }))
                });
            }

            // Map items
            const itemsToCreate = original.items.map(item => ({
                quoteId: newQuote.id,
                productId: item.productId,
                name: item.name,
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                costPrice: item.costPrice,
                subtotal: item.subtotal,
                variantId: item.variantId,
                isHiddenItem: item.isHiddenItem,
                internalNote: item.internalNote,
                customerNote: item.customerNote,
                sortOrder: item.sortOrder
            }));

            if (itemsToCreate.length > 0) {
                await tx.quoteItem.createMany({ data: itemsToCreate });
            }

            return newQuote;
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'duplicate',
            tableName: 'quotes',
            recordId: result.id,
            after: result as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(result);
    });
}
