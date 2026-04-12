import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

import { writeAudit } from '@/lib/audit';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * 存為模板
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const body = await request.json();
        const { name, categoryId } = body;

        if (!name) {
            return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
        }

        const original = await prisma.quote.findUnique({
            where: { id },
            include: {
                items: true,
                variants: true
            }
        });

        if (!original) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        // Prepare variantConfig for multi-variant quotes
        let variantConfig = null;
        if (original.variants && original.variants.length > 0) {
            const mappings = original.items
                .filter(item => item.variantId)
                .map(item => ({
                    sortOrder: item.sortOrder,
                    variantId: item.variantId
                }));

            variantConfig = {
                variants: original.variants.map(v => ({
                    id: v.id,
                    name: v.name,
                    isRecommended: v.isRecommended,
                    sortOrder: v.sortOrder
                })),
                mappings
            };
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create template
            const template = await (tx.quoteTemplate as any).create({
                data: {
                    name,
                    categoryId,
                    notes: original.internalNote || original.customerNote || null,
                    createdBy: req.user!.id,
                    taxRate: original.taxRate,
                    discountAmount: original.discountAmount,
                    discountNote: original.discountNote,
                    hasTransportFee: original.hasTransportFee,
                    transportFee: original.transportFee,
                    transportFeeCost: original.transportFeeCost,
                    internalNote: original.internalNote,
                    customerNote: original.customerNote,
                    warrantyMonths: original.warrantyMonths,
                    variantConfig: variantConfig as any
                }
            });

            // 2. Store a full item snapshot so template reloads do not collapse to current product defaults.
            const itemsToCreate = original.items
                .map(item => ({
                    templateId: template.id,
                    productId: item.productId,
                    name: item.name,
                    description: item.description,
                    unit: item.unit,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    costPrice: item.costPrice,
                    isHiddenItem: item.isHiddenItem,
                    internalNote: item.internalNote,
                    customerNote: item.customerNote,
                    variantSourceId: item.variantId,
                    sortOrder: item.sortOrder
                }));

            if (itemsToCreate.length > 0) {
                await tx.templateItem.createMany({ data: itemsToCreate });
            }

            return template;
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'save_as_template',
            tableName: 'quote_templates',
            recordId: result.id,
            after: result as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(result);
    });
}
