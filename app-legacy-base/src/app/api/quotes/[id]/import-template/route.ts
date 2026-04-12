import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { recalculateQuoteAmounts } from '@/lib/recalculateQuoteAmounts';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * 匯入報價模板到指定報價單
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

        const body = await request.json();
        const { templateId, variantId } = body;

        if (!templateId) {
            return NextResponse.json({ error: 'Template is required' }, { status: 400 });
        }

        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                items: { select: { sortOrder: true } },
                variants: { select: { id: true } }
            }
        });

        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        if (quote.status !== 'draft') {
            return NextResponse.json({ error: 'Only draft quotes can import templates' }, { status: 400 });
        }

        const hasVariants = quote.variants.length > 0;
        if (hasVariants && variantId === undefined) {
            return NextResponse.json({ error: 'Variant selection is required for this quote' }, { status: 400 });
        }

        if (hasVariants && variantId !== null) {
            const validVariant = quote.variants.some(v => v.id === variantId);
            if (!validVariant) {
                return NextResponse.json({ error: 'Selected variant is invalid' }, { status: 400 });
            }
        }

        const targetVariantId = hasVariants ? (variantId ?? null) : null;

        const template = await prisma.quoteTemplate.findUnique({
            where: { id: templateId },
            include: {
                items: {
                    include: { product: true },
                    orderBy: { sortOrder: 'asc' }
                }
            }
        });

        if (!template || template.isDeleted) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        const maxSortOrder = quote.items.length > 0
            ? Math.max(...quote.items.map(i => i.sortOrder))
            : -1;

        const skipped: { name: string; reason: string }[] = [];
        const itemsToCreate: any[] = [];
        let sortCounter = maxSortOrder + 1;

        for (const ti of template.items) {
            const product = ti.product;

            if (product?.isDeleted) {
                skipped.push({
                    name: ti.name || product.quoteName || product.name,
                    reason: 'product_deleted'
                });
                continue;
            }

            itemsToCreate.push({
                quoteId: id,
                productId: product?.id || ti.productId || null,
                name: ti.name,
                description: ti.description,
                unit: ti.unit,
                quantity: ti.quantity,
                unitPrice: ti.unitPrice,
                costPrice: ti.costPrice,
                subtotal: Number(ti.unitPrice) * ti.quantity,
                isHiddenItem: ti.isHiddenItem,
                internalNote: ti.internalNote,
                customerNote: ti.customerNote,
                sortOrder: sortCounter++,
                variantId: targetVariantId
            });
        }

        if (itemsToCreate.length > 0) {
            await prisma.quoteItem.createMany({ data: itemsToCreate });
        }

        await prisma.quote.update({
            where: { id },
            data: {
                taxRate: template.taxRate,
                discountAmount: template.discountAmount,
                discountNote: template.discountNote,
                hasTransportFee: template.hasTransportFee,
                transportFee: template.transportFee,
                transportFeeCost: template.transportFeeCost,
                internalNote: template.internalNote,
                customerNote: template.customerNote,
                warrantyMonths: template.warrantyMonths ?? undefined,
                templateId: template.id,
            }
        });

        await recalculateQuoteAmounts(id);

        const updatedQuote = await prisma.quote.findUnique({
            where: { id },
            include: {
                items: { orderBy: { sortOrder: 'asc' } },
                variants: { orderBy: { sortOrder: 'asc' } }
            }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'import_template',
            tableName: 'quotes',
            recordId: id,
            after: { templateId, imported: itemsToCreate.length, skipped } as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({
            imported: itemsToCreate.length,
            skipped,
            quote: updatedQuote
        });
    });
}
