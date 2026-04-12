import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware/auth';

/** Extract YouTube video ID and return maxresdefault thumbnail URL */
function getYoutubeThumbnail(youtubeUrl: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
        /(?:youtu\.be\/)([\w-]{11})/,
        /(?:youtube\.com\/embed\/)([\w-]{11})/,
    ];
    for (const p of patterns) {
        const m = youtubeUrl.match(p);
        if (m) return `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg`;
    }
    return null;
}

// PUT: update video
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(req, async () => {
        try {
            const { id } = await params;
            const data = await req.json();
            const video = await prisma.portalVideo.update({
                where: { id },
                data: {
                    title: data.title,
                    description: data.description,
                    youtubeUrl: data.youtubeUrl,
                    categoryTag: data.categoryTag,
                    thumbnailUrl: data.thumbnailUrl || (data.youtubeUrl ? getYoutubeThumbnail(data.youtubeUrl) : undefined),
                    sortOrder: data.sortOrder,
                    isPublished: data.isPublished,
                },
            });
            return NextResponse.json(video);
        } catch (error) {
            console.error('[Admin Portal Videos PUT]', error);
            return NextResponse.json({ error: '更新影片項目失敗' }, { status: 500 });
        }
    });
}

// DELETE: delete video
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(req, async () => {
        try {
            const { id } = await params;
            await prisma.portalVideo.delete({ where: { id } });
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('[Admin Portal Videos DELETE]', error);
            return NextResponse.json({ error: '刪除影片項目失敗' }, { status: 500 });
        }
    });
}
