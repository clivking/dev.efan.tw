import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { calculateQuote } from '@/lib/quote-calculator';
import { canDeleteQuote, canDirectEdit } from '@/lib/quote-status';
import { resolveQuoteId } from '@/lib/resolveQuoteId';
import { getDefaultCustomerNoteSetting } from '@/lib/server-quote-defaults';
import { resolveCustomerQuoteDefaults } from '@/lib/customer-defaults';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                customer: {
                    include: {
                        companyNames: true,
                        contacts: true,
                        locations: true
                    }
                },
                companyName: true,
                contacts: { include: { contact: true } },
                location: true,
                items: {
                    orderBy: { sortOrder: 'asc' }
                },
                variants: {
                    orderBy: { sortOrder: 'asc' }
                },
                payments: {
                    select: { id: true },
                    orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
                    take: 1
                },
                _count: {
                    select: { payments: true }
                },
                parentQuote: true,
                childQuotes: true
            }
        });

        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        const defaultCustomerNote = await getDefaultCustomerNoteSetting();

        return NextResponse.json({
            quote: {
                ...quote,
                customerNote: quote.customerNote || defaultCustomerNote,
                latestPaymentId: quote.payments[0]?.id ?? null,
                paymentCount: quote._count.payments
            }
        });
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const body = await request.json();
        const {
            customerId,
            companyNameId,
            contactIds,
            locationId,
            taxRate,
            discountAmount,
            discountNote,
            internalNote,
            customerNote,
            completion_note,
            name,
            nameEn,
            transportFee,
            transportFeeCost,
            hasTransportFee,
            completedAt,
            invoiceIssuedAt,
            warrantyMonths,
            warrantyStartDate,
            discountExpiryAt,
        } = body;

        const before = await prisma.quote.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!before) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        const isDirectEdit = canDirectEdit(before.status as any);
        const isEditingCoreFields =
            customerId !== undefined ||
            companyNameId !== undefined ||
            contactIds !== undefined ||
            locationId !== undefined ||
            taxRate !== undefined ||
            discountAmount !== undefined ||
            transportFee !== undefined ||
            hasTransportFee !== undefined ||
            name !== undefined ||
            nameEn !== undefined;

        if (isEditingCoreFields && !isDirectEdit) {
            return NextResponse.json({ error: '報價單已確認，核心欄位無法直接修改。如需變更品項或金額，請建立新版本。' }, { status: 403 });
        }

        // Handle warranty date calculation if warrantyStartDate, completedAt, or warrantyMonths changes
        let finalWarrantyExpiresAt = undefined;
        if (warrantyStartDate !== undefined || completedAt !== undefined || warrantyMonths !== undefined) {
            const startVal = warrantyStartDate !== undefined
                ? warrantyStartDate
                : ((before as any).warrantyStartDate || (completedAt !== undefined ? completedAt : before.completedAt));
            const months = warrantyMonths !== undefined ? Number(warrantyMonths) : (before.warrantyMonths ?? 12);

            if (startVal) {
                const start = new Date(startVal);
                const expiresAt = new Date(start);
                expiresAt.setMonth(expiresAt.getMonth() + months);
                finalWarrantyExpiresAt = expiresAt;
            } else {
                finalWarrantyExpiresAt = null;
            }
        }

        // If customerId changed, we might need to pick different default IDs
        let finalCustomerId = customerId || before.customerId;
        let finalCompanyNameId = companyNameId;
        let finalContactIds = contactIds;
        let finalLocationId = locationId;

        if (customerId && customerId !== before.customerId) {
            const newCust = await prisma.customer.findUnique({
                where: { id: customerId },
                include: {
                    companyNames: true,
                    contacts: true,
                    locations: true
                }
            });
            if (newCust) {
                const defaults = resolveCustomerQuoteDefaults(newCust);
                if (!finalCompanyNameId) finalCompanyNameId = defaults.defaultCompanyNameId;
                if (!finalContactIds) finalContactIds = defaults.defaultContactIds;
                if (!finalLocationId) finalLocationId = defaults.defaultLocationId;
            }
        }

        let finalArea = undefined;
        if (finalLocationId !== undefined) {
            if (finalLocationId === null) {
                finalArea = null;
            } else {
                const loc = await prisma.location.findUnique({ where: { id: finalLocationId } });
                if (loc) {
                    const { extractArea } = await import('@/lib/utils');
                    finalArea = extractArea(loc.address);
                }
            }
        }


        const items = before.items.map(i => ({
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            costPrice: Number(i.costPrice)
        }));

        const currentHasTransportFee = hasTransportFee !== undefined ? hasTransportFee : (before as any).hasTransportFee;
        const currentTransportFee = transportFee !== undefined ? Number(transportFee) : Number((before as any).transportFee);
        const currentTransportFeeCost = transportFeeCost !== undefined ? Number(transportFeeCost) : Number((before as any).transportFeeCost || 0);

        const calc = await calculateQuote(
            items,
            discountAmount ?? Number((before as any).discountAmount),
            taxRate ?? Number((before as any).taxRate),
            currentHasTransportFee ? currentTransportFee : 0,
            currentHasTransportFee ? currentTransportFeeCost : 0
        );

        const updatedQuote = await prisma.$transaction(async (tx) => {
            // Update QuoteContact join table if contactIds provided
            if (finalContactIds) {
                await tx.quoteContact.deleteMany({ where: { quoteId: id } });
                await tx.quoteContact.createMany({
                    data: finalContactIds.map((cid: string, index: number) => ({
                        quoteId: id,
                        contactId: cid,
                        isPrimary: index === 0
                    }))
                });
            }

            const updated = await tx.quote.update({
                where: { id },
                data: {
                    customerId: finalCustomerId,
                    companyNameId: finalCompanyNameId !== undefined ? finalCompanyNameId : (before as any).companyNameId,
                    locationId: finalLocationId !== undefined ? finalLocationId : (before as any).locationId,
                    area: finalArea,
                    taxRate: taxRate ?? (before as any).taxRate,
                    discountAmount: discountAmount !== undefined ? Number(discountAmount) : (before as any).discountAmount,
                    discountNote,
                    discountExpiryAt: discountExpiryAt !== undefined ? (discountExpiryAt ? new Date(discountExpiryAt) : null) : undefined,
                    internalNote,
                    customerNote,
                    completion_note,
                    name: name as any,
                    nameEn: nameEn as any,
                    transportFee: transportFee !== undefined ? Number(transportFee) : (before as any).transportFee,
                    transportFeeCost: transportFeeCost !== undefined ? Number(transportFeeCost) : (before as any).transportFeeCost,
                    hasTransportFee: hasTransportFee !== undefined ? hasTransportFee : (before as any).hasTransportFee,
                    completedAt: completedAt !== undefined ? (completedAt ? new Date(completedAt) : null) : undefined,
                    invoiceIssuedAt: invoiceIssuedAt !== undefined ? (invoiceIssuedAt ? new Date(invoiceIssuedAt) : null) : undefined,
                    warrantyStartDate: warrantyStartDate !== undefined ? (warrantyStartDate ? new Date(warrantyStartDate) : null) : undefined,
                    warrantyMonths: warrantyMonths !== undefined ? Number(warrantyMonths) : undefined,
                    warrantyExpiresAt: finalWarrantyExpiresAt,
                    subtotalAmount: calc.subtotalAmount,
                    totalAmount: calc.totalAmount,
                    totalCost: calc.totalCost,
                    totalProfit: calc.totalProfit,
                    taxCost: calc.taxCost,
                    actualProfit: calc.actualProfit
                } as any,
                include: {
                    customer: { include: { companyNames: true, contacts: true, locations: true } },
                    companyName: true,
                    contacts: { include: { contact: true } },
                    location: true,
                    items: {
                        orderBy: { sortOrder: 'asc' }
                    },
                    variants: {
                        orderBy: { sortOrder: 'asc' }
                    }
                }
            });

            // Update lastQuoteAt for both old and new customer if changed, or just the current one
            if (finalCustomerId) {
                const lastQuote = await tx.quote.findFirst({
                    where: { customerId: finalCustomerId, isDeleted: false },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                });
                await tx.customer.update({
                    where: { id: finalCustomerId },
                    data: { lastQuoteAt: lastQuote?.createdAt || null }
                });
            }

            if (before.customerId && before.customerId !== finalCustomerId) {
                const lastQuote = await tx.quote.findFirst({
                    where: { customerId: before.customerId, isDeleted: false },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                });
                await tx.customer.update({
                    where: { id: before.customerId },
                    data: { lastQuoteAt: lastQuote?.createdAt || null }
                });
            }

            return updated;
        });

        // 交易後同步整單金額 (針對多方案或複雜場景)
        const { recalculateQuoteAmounts } = await import('@/lib/recalculateQuoteAmounts');
        await recalculateQuoteAmounts(id);

        // 重新讀取，確保回傳的是重算後的正確資料
        const finalQuote = await prisma.quote.findUnique({
            where: { id },
            include: {
                customer: { include: { companyNames: true, contacts: true, locations: true } },
                companyName: true,
                contacts: { include: { contact: true } },
                location: true,
                items: { orderBy: { sortOrder: 'asc' } },
                variants: { orderBy: { sortOrder: 'asc' } },
                payments: {
                    select: { id: true },
                    orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
                    take: 1
                },
                _count: {
                    select: { payments: true }
                }
            }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'update',
            tableName: 'quotes',
            recordId: id,
            before: before as any,
            after: finalQuote as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({
            ...finalQuote,
            latestPaymentId: finalQuote?.payments[0]?.id ?? null,
            paymentCount: finalQuote?._count.payments ?? 0
        });
    });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const before = await prisma.quote.findUnique({ where: { id } });

        if (!before) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        if (!(await canDeleteQuote(before.status as any))) {
            return NextResponse.json({ error: 'Quotes with this status cannot be deleted.' }, { status: 403 });
        }

        const quote = await prisma.$transaction(async (tx) => {
            const updated = await tx.quote.update({
                where: { id },
                data: { isDeleted: true }
            });

            if (before.customerId) {
                const lastQuote = await tx.quote.findFirst({
                    where: { customerId: before.customerId, isDeleted: false },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                });
                await tx.customer.update({
                    where: { id: before.customerId },
                    data: { lastQuoteAt: lastQuote?.createdAt || null }
                });
            }

            return updated;
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'quotes',
            recordId: id,
            before: before as any,
            after: quote as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true });
    });
}
