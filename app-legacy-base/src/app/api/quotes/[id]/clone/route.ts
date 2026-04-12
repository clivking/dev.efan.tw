import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

import { getNextNumber } from '@/lib/daily-counter';

import { getSetting } from '@/lib/settings';

import { writeAudit } from '@/lib/audit';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * 複製報價單
 * 將指定報價單的所有資訊（客戶、抬頭、地址、項目、金額、備註）複製到一個新的報價單中
 * 並產生新的報價編號
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

        // 1. 取得原始報價單
        const sourceQuote = await prisma.quote.findUnique({
            where: { id },
            include: {
                items: true,
                contacts: true,
            }
        });

        if (!sourceQuote) {
            return NextResponse.json({ error: 'Source quote not found' }, { status: 404 });
        }

        // 2. 準備新報價單資料
        const quoteNumber = await getNextNumber('quote');
        const validDays = Number(await getSetting('quote_valid_days', 60));
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validDays);

        // 3. 執行複製事務
        const newQuote = await prisma.$transaction(async (tx) => {
            // 3.1 建立新的報價單主檔
            const cloned = await tx.quote.create({
                data: {
                    quoteNumber,
                    customerId: sourceQuote.customerId,
                    companyNameId: sourceQuote.companyNameId,
                    locationId: sourceQuote.locationId,
                    status: 'draft',
                    taxRate: sourceQuote.taxRate,
                    validUntil,
                    internalNote: sourceQuote.internalNote,
                    customerNote: sourceQuote.customerNote,
                    name: (sourceQuote as any).name || '報價單',
                    nameEn: (sourceQuote as any).nameEn || 'Quotation',
                    discountAmount: sourceQuote.discountAmount,
                    discountNote: sourceQuote.discountNote,
                    transportFee: sourceQuote.transportFee,
                    hasTransportFee: sourceQuote.hasTransportFee,
                    transportFeeCost: sourceQuote.transportFeeCost,
                    subtotalAmount: sourceQuote.subtotalAmount,
                    totalAmount: sourceQuote.totalAmount,
                    totalCost: sourceQuote.totalCost,
                    totalProfit: sourceQuote.totalProfit,
                    taxCost: sourceQuote.taxCost,
                    actualProfit: sourceQuote.actualProfit,
                    area: sourceQuote.area,
                    warrantyMonths: sourceQuote.warrantyMonths,
                    discountExpiryAt: sourceQuote.discountExpiryAt,
                    createdBy: req.user!.id,
                }
            });

            // 3.2 複製產品項目
            if (sourceQuote.items.length > 0) {
                await tx.quoteItem.createMany({
                    data: sourceQuote.items.map(item => ({
                        quoteId: cloned.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        name: item.name,
                        description: item.description,
                        unit: item.unit,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        costPrice: item.costPrice,
                        subtotal: item.subtotal,
                        sortOrder: item.sortOrder,
                        isHiddenItem: item.isHiddenItem,
                        internalNote: item.internalNote,
                        customerNote: item.customerNote,
                    }))
                });
            }

            // 3.3 複製聯絡人關聯
            if (sourceQuote.contacts.length > 0) {
                await tx.quoteContact.createMany({
                    data: sourceQuote.contacts.map(qc => ({
                        quoteId: cloned.id,
                        contactId: qc.contactId,
                        isPrimary: qc.isPrimary
                    }))
                });
            }

            return cloned;
        });

        // 4. 寫入稽核日誌
        await writeAudit({
            userId: req.user!.id,
            action: 'create',
            tableName: 'quotes',
            recordId: newQuote.id,
            after: newQuote as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ id: newQuote.id, quoteNumber: newQuote.quoteNumber });
    });
}
