import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalUser } from '@/lib/portal-auth';

// GET: single video (includes youtube_url, requires login)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const portalUser = await getPortalUser();
        if (!portalUser) {
            return NextResponse.json({ error: '請先登入' }, { status: 401 });
        }

        const { id } = await params;
        const video = await prisma.portalVideo.findFirst({
            where: { id, isPublished: true },
        });

        if (!video) {
            return NextResponse.json({ error: '影片不存在' }, { status: 404 });
        }

        return NextResponse.json(video);
    } catch (error) {
        console.error('[Portal Video Detail]', error);
        return NextResponse.json({ error: '系統錯誤' }, { status: 500 });
    }
}
