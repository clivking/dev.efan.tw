import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { resolveQuoteId } from '@/lib/resolveQuoteId';
import { createWorkbookBuffer } from '@/lib/excel';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                items: { orderBy: { sortOrder: 'asc' } }
            }
        });

        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        const rows = quote.items.map(item => ({
            '項目': item.name,
            '說明': item.description || '',
            '數量': item.quantity,
            '單位': item.unit || '',
            '單價': Number(item.unitPrice),
            '小計': Number(item.subtotal)
        }));

        rows.push({ '項目': '', '說明': '', '數量': null, '單位': '', '單價': null, '小計': null } as any);
        rows.push({ '項目': '小計', '說明': '', '數量': null, '單位': '', '單價': null, '小計': Number(quote.subtotalAmount) } as any);
        if (Number(quote.discountAmount) > 0) {
            rows.push({ '項目': `折扣 (${quote.discountNote || ''})`, '說明': '', '數量': null, '單位': '', '單價': null, '小計': -Number(quote.discountAmount) } as any);
        }
        rows.push({ '項目': '總計（含稅）', '說明': '', '數量': null, '單位': '', '單價': null, '小計': Number(quote.totalAmount) } as any);

        const buffer = await createWorkbookBuffer('報價單', rows);

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Quote_${quote.quoteNumber}.xlsx"`
            }
        });
    });
}
