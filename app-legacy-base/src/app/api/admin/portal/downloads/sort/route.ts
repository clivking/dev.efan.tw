import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware/auth';

// PUT: batch update download sort order
export async function PUT(req: NextRequest) {
    return withAdmin(req, async () => {
        try {
            const { items } = await req.json();
            await prisma.$transaction(
                items.map((item: { id: string; sortOrder: number }) =>
                    prisma.portalDownload.update({
                        where: { id: item.id },
                        data: { sortOrder: item.sortOrder },
                    })
                )
            );
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('[Admin Portal Downloads Sort]', error);
            return NextResponse.json({ error: '更新下載項目排序失敗' }, { status: 500 });
        }
    });
}
