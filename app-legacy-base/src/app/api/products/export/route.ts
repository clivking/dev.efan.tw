import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { createWorkbookBuffer } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const products = await prisma.product.findMany({
            where: { isDeleted: false },
            include: { category: true }
        });

        const data = products.map((product) => ({
            '\u7522\u54c1\u5206\u985e': product.category.name,
            '\u54c1\u724c': product.brand || '',
            '\u578b\u865f': product.model || '',
            '\u7522\u54c1\u540d\u7a31': product.name,
            '\u7522\u54c1\u7c21\u8ff0': product.description || '',
            '\u5831\u50f9\u986f\u793a\u540d\u7a31': product.quoteName || '',
            '\u5831\u50f9\u986f\u793a\u8aaa\u660e': product.quoteDesc || '',
            '\u7522\u54c1\u578b\u614b': product.type === 'bundle' ? '\u7d44\u5408\u5305' : '\u55ae\u54c1',
            '\u55ae\u4f4d': product.unit || '',
            '\u6210\u672c\u50f9': Number(product.costPrice),
            '\u5e02\u5834\u50f9\u683c\u53c3\u8003': product.marketPrice ? Number(product.marketPrice) : '',
            '\u552e\u50f9': Number(product.sellingPrice),
            '\u7dad\u4fee\u5831\u50f9': product.repairPrice ? Number(product.repairPrice) : '',
            '\u96b1\u85cf\u54c1\u9805': product.isHiddenItem ? 'TRUE' : 'FALSE',
            '\u5167\u90e8\u5099\u8a3b': product.notes || ''
        }));

        const buffer = await createWorkbookBuffer('\u7522\u54c1\u8cc7\u6599\u532f\u51fa', data);

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="products.xlsx"'
            }
        });
    });
}
