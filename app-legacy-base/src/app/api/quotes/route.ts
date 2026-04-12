import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { getNextNumber } from '@/lib/daily-counter';
import { getSetting } from '@/lib/settings';
import { calculateQuote } from '@/lib/quote-calculator';
import { DEFAULT_CUSTOMER_NOTE } from '@/lib/quote-defaults';
import { getDefaultCustomerNoteSetting } from '@/lib/server-quote-defaults';
import { resolveCustomerQuoteDefaults } from '@/lib/customer-defaults';
import { addDays, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const search = searchParams.get('search') || '';
        const stageView = searchParams.get('stageView') || '';
        const status = searchParams.get('status') || '';
        const invoiceStatus = searchParams.get('invoiceStatus') || '';
        const warrantyStatus = searchParams.get('warrantyStatus') || '';
        const customerId = searchParams.get('customerId') || '';
        const dateFrom = searchParams.get('dateFrom') || '';
        const dateTo = searchParams.get('dateTo') || '';
        const includeDeleted = searchParams.get('includeDeleted') === 'true';
        const includeSuperseded = searchParams.get('includeSuperseded') === 'true';

        const where: any = {
            isDeleted: includeDeleted ? undefined : false,
            isSuperseded: includeSuperseded ? undefined : false,
        };

        if (search) {
            where.OR = [
                { quoteNumber: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                {
                    customer: {
                        OR: [
                            { companyNames: { some: { companyName: { contains: search, mode: 'insensitive' } } } },
                            { contacts: { some: { name: { contains: search, mode: 'insensitive' } } } },
                        ]
                    }
                }
            ];
        }

        if (stageView === 'quoting' && !status) {
            where.status = { in: ['draft', 'confirmed', 'sent'] };
        } else if (stageView === 'fulfillment' && !status) {
            where.status = { in: ['signed', 'construction', 'completed', 'paid'] };
        } else if (status) {
            where.status = status;
        }

        if (invoiceStatus === 'pending') {
            where.status = 'completed';
            where.taxRate = { gt: 0 };
            where.invoiceIssuedAt = null;
        } else if (invoiceStatus === 'issued') {
            where.taxRate = { gt: 0 };
            where.invoiceIssuedAt = { not: null };
        } else if (invoiceStatus === 'none-required') {
            where.taxRate = 0;
            if (!status) {
                where.status = stageView === 'quoting'
                    ? { in: ['draft', 'confirmed', 'sent'] }
                    : stageView === 'fulfillment'
                        ? { in: ['signed', 'construction', 'completed', 'paid'] }
                        : { not: 'closed' };
            }
        }

        if (warrantyStatus === 'active') {
            where.status = { in: ['completed', 'paid'] };
            where.warrantyMonths = { not: 0 };
            where.warrantyStartDate = { not: null };
            where.warrantyExpiresAt = { gte: new Date() };
        } else if (warrantyStatus === 'expired') {
            where.status = { in: ['completed', 'paid'] };
            where.warrantyMonths = { not: 0 };
            where.warrantyStartDate = { not: null };
            where.warrantyExpiresAt = { lt: new Date() };
        } else if (warrantyStatus === 'expiring_30') {
            where.status = { in: ['completed', 'paid'] };
            where.warrantyMonths = { not: 0 };
            where.warrantyStartDate = { not: null };
            where.warrantyExpiresAt = {
                gte: new Date(),
                lte: endOfDay(addDays(new Date(), 30)),
            };
        } else if (warrantyStatus === 'no_warranty') {
            where.status = { in: ['completed', 'paid'] };
            where.warrantyMonths = 0;
        }

        if (customerId) {
            where.customerId = customerId;
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const [total, quotes] = await Promise.all([
            prisma.quote.count({ where }),
            prisma.quote.findMany({
                where,
                include: {
                    customer: {
                        include: {
                            companyNames: { where: { isPrimary: true }, take: 1 },
                            contacts: { where: { isPrimary: true }, take: 1 },
                        }
                    },
                    companyName: true,
                    contacts: { include: { contact: true } },
                    location: true,
                    payments: { select: { amount: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        const { extractArea } = await import('@/lib/utils');

        return NextResponse.json({
            quotes: quotes.map(q => ({
                ...q,
                area: q.area || extractArea(q.location?.address),
                customer: q.customer ? {
                    id: q.customer.id,
                    customerNumber: q.customer.customerNumber,
                    primaryCompanyName: q.customer.companyNames[0]?.companyName || '',
                    primaryContact: q.customer.contacts[0]?.name || ''
                } : null,
                companyName: q.companyName?.companyName || '',
                contacts: q.contacts.map((qc: any) => qc.contact),
                totalPaid: q.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
            })),
            total,
            page,
            pageSize
        });
    });
}


export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const body = await request.json();
        const {
            customerId,
            companyNameId,
            contactIds,
            locationId,
            templateId,
            taxRate: customTaxRate,
            internalNote,
            customerNote,
            name,
            nameEn
        } = body;

        const quoteNumber = await getNextNumber('quote');
        const validDays = Number(await getSetting('quote_valid_days', 60));
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validDays);
        const taxRate = customTaxRate ?? Number(await getSetting('default_tax_rate', 5));
        const defaultCustomerNote = await getDefaultCustomerNoteSetting();
        let finalCompanyNameId = companyNameId ?? null;
        let finalContactIds = Array.isArray(contactIds) ? contactIds : [];
        let finalLocationId = locationId ?? null;

        if (customerId && (!finalCompanyNameId || finalContactIds.length === 0 || !finalLocationId)) {
            const customer = await prisma.customer.findUnique({
                where: { id: customerId },
                include: {
                    companyNames: true,
                    contacts: true,
                    locations: true,
                },
            });

            if (customer) {
                const defaults = resolveCustomerQuoteDefaults(customer);
                if (!finalCompanyNameId) finalCompanyNameId = defaults.defaultCompanyNameId;
                if (finalContactIds.length === 0) finalContactIds = defaults.defaultContactIds;
                if (!finalLocationId) finalLocationId = defaults.defaultLocationId;
            }
        }

        let area = null;
        if (finalLocationId) {
            const loc = await prisma.location.findUnique({ where: { id: finalLocationId } });
            if (loc) {
                const { extractArea } = await import('@/lib/utils');
                area = extractArea(loc.address);
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create quote
            const newQuote = await tx.quote.create({
                data: {
                    quoteNumber,
                    customerId: customerId || null,
                    companyNameId: finalCompanyNameId,
                    locationId: finalLocationId,
                    area,
                    templateId,
                    status: 'draft',
                    taxRate,
                    validUntil,
                    internalNote,
                    customerNote: customerNote || defaultCustomerNote || DEFAULT_CUSTOMER_NOTE,
                    name: (name || '報價單') as any,
                    nameEn: (nameEn || 'Quotation') as any,
                    createdBy: req.user!.id,
                }
            });

            // 1.0.1 Update Customer's lastQuoteAt (if provided)
            if (customerId) {
                await tx.customer.update({
                    where: { id: customerId },
                    data: { lastQuoteAt: new Date() }
                });
            }

            // 1.1 Create QuoteContact links (if any)
            if (finalContactIds.length > 0) {
                await tx.quoteContact.createMany({
                    data: finalContactIds.map((cid: string, index: number) => ({
                        quoteId: newQuote.id,
                        contactId: cid,
                        isPrimary: index === 0
                    }))
                });
            }

            // 2. Add template items if provided
            if (templateId) {
                const template = await tx.quoteTemplate.findUnique({
                    where: { id: templateId },
                    include: { items: { include: { product: true } } }
                });

                if (template) {
                    const variantConfig = (template as any).variantConfig;
                    const oldToNewVariantId: Record<string, string> = {};

                    // Handle Variants
                    if (variantConfig && variantConfig.variants) {
                        for (const v of variantConfig.variants) {
                            const newVariant = await tx.quoteVariant.create({
                                data: {
                                    quoteId: newQuote.id,
                                    name: v.name,
                                    isRecommended: v.isRecommended,
                                    sortOrder: v.sortOrder
                                }
                            });
                            oldToNewVariantId[v.id] = newVariant.id;
                        }
                    }

                    const itemsToCreate = [];
                    for (const ti of template.items) {
                        const p = ti.product;
                        if (p?.isDeleted) continue;

                        let variantId = null;
                        if (ti.variantSourceId) {
                            variantId = oldToNewVariantId[ti.variantSourceId] || null;
                        } else if (variantConfig && variantConfig.mappings) {
                            const mapping = variantConfig.mappings.find((m: any) => m.sortOrder === ti.sortOrder);
                            if (mapping && mapping.variantId) {
                                variantId = oldToNewVariantId[mapping.variantId] || null;
                            }
                        }

                        itemsToCreate.push({
                            quoteId: newQuote.id,
                            productId: p?.id || ti.productId || null,
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
                            sortOrder: ti.sortOrder,
                            variantId: variantId
                        });
                    }

                    if (itemsToCreate.length > 0) {
                        await tx.quoteItem.createMany({
                            data: itemsToCreate
                        });
                    }

                    await tx.quote.update({
                        where: { id: newQuote.id },
                        data: {
                            taxRate: template.taxRate,
                            discountAmount: template.discountAmount,
                            discountNote: template.discountNote,
                            hasTransportFee: template.hasTransportFee,
                            transportFee: template.transportFee,
                            transportFeeCost: template.transportFeeCost,
                            internalNote: template.internalNote,
                            customerNote: template.customerNote || defaultCustomerNote || DEFAULT_CUSTOMER_NOTE,
                            warrantyMonths: template.warrantyMonths ?? undefined,
                        }
                    });

                    // 3. Re-calculate totals (Phase 9: using the common utility)
                    // We'll call this outside the loop to be more consistent
                }
            } else {
                // 2.1 OR Add one default blank item if no template
                await tx.quoteItem.create({
                    data: {
                        quoteId: newQuote.id,
                        name: '新項目',
                        unit: '式',
                        quantity: 1,
                        unitPrice: 0,
                        costPrice: 0,
                        subtotal: 0,
                        sortOrder: 0
                    }
                });
            }

            const fullQuote = await tx.quote.findUnique({
                where: { id: newQuote.id },
                include: { items: true }
            });

            await writeAudit({
                userId: req.user!.id,
                action: 'create',
                tableName: 'quotes',
                recordId: newQuote.id,
                after: fullQuote as any,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return fullQuote;
        });

        // 4. Re-calculate totals if template was used (to handle multi-variant logic)
        if (templateId || (result && (result as any).items && (result as any).items.length > 0)) {
            const { recalculateQuoteAmounts } = await import('@/lib/recalculateQuoteAmounts');
            await recalculateQuoteAmounts((result as any).id);
        }

        return NextResponse.json(result);
    });
}
