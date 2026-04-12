import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { getNextNumber } from '@/lib/daily-counter';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * 建立新版本
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

        if (original.status === 'draft') {
            return NextResponse.json({ error: 'Only confirmed or higher status quotes can be versioned.' }, { status: 403 });
        }

        const quoteNumber = await getNextNumber('quote');

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create new version
            const newQuote = await tx.quote.create({
                data: {
                    quoteNumber,
                    customerId: original.customerId,
                    companyNameId: original.companyNameId,
                    locationId: original.locationId,
                    parentQuoteId: original.id,
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
                    validUntil: original.validUntil,
                    transportFee: original.transportFee,
                    hasTransportFee: original.hasTransportFee,
                    transportFeeCost: original.transportFeeCost,
                    name: original.name || '報價單',
                    nameEn: original.nameEn || 'Quotation',
                    warrantyMonths: original.warrantyMonths,
                    area: original.area,
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

            // 2. Map items
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

            // 3. Mark original as superseded
            await tx.quote.update({
                where: { id: original.id },
                data: { isSuperseded: true }
            });

            return newQuote;
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'new_version',
            tableName: 'quotes',
            recordId: result.id,
            after: result as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(result);
    });
}
