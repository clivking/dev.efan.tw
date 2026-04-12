import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalUser } from '@/lib/portal-auth';

// GET: list published videos (requires login, but does NOT expose youtube_url)
export async function GET(req: NextRequest) {
    try {
        const portalUser = await getPortalUser();
        if (!portalUser) {
            return NextResponse.json({ error: '請先登入' }, { status: 401 });
        }

        const categoryTag = req.nextUrl.searchParams.get('category');

        const videos = await prisma.portalVideo.findMany({
            where: {
                isPublished: true,
                ...(categoryTag ? { categoryTag } : {}),
            },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                title: true,
                description: true,
                categoryTag: true,
                thumbnailUrl: true,
                sortOrder: true,
                // NOTE: youtubeUrl deliberately excluded for security
            },
        });

        return NextResponse.json(videos);
    } catch (error) {
        console.error('[Portal Videos]', error);
        return NextResponse.json({ error: '系統錯誤' }, { status: 500 });
    }
}
