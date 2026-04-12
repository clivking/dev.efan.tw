import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: list published downloads (public, no login required)
export async function GET() {
    try {
        const downloads = await prisma.portalDownload.findMany({
            where: { isPublished: true },
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json(downloads);
    } catch (error) {
        console.error('[Portal Downloads]', error);
        return NextResponse.json({ error: '系統錯誤' }, { status: 500 });
    }
}
