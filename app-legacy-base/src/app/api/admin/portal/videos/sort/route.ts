import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware/auth';

// PUT: batch update sort order
export async function PUT(req: NextRequest) {
    return withAdmin(req, async () => {
        try {
            const { items } = await req.json(); // [{ id, sortOrder }]
            await prisma.$transaction(
                items.map((item: { id: string; sortOrder: number }) =>
                    prisma.portalVideo.update({
                        where: { id: item.id },
                        data: { sortOrder: item.sortOrder },
                    })
                )
            );
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('[Admin Portal Videos Sort]', error);
            return NextResponse.json({ error: '更新影片排序失敗' }, { status: 500 });
        }
    });
}
