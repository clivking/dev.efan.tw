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

// GET: list all videos (including unpublished)
export async function GET(req: NextRequest) {
    return withAdmin(req, async () => {
        const videos = await prisma.portalVideo.findMany({
            orderBy: { sortOrder: 'asc' },
        });
        return NextResponse.json(videos);
    });
}

// POST: create video
export async function POST(req: NextRequest) {
    return withAdmin(req, async () => {
        try {
            const data = await req.json();
            const video = await prisma.portalVideo.create({
                data: {
                    title: data.title,
                    description: data.description || null,
                    youtubeUrl: data.youtubeUrl,
                    categoryTag: data.categoryTag || null,
                    thumbnailUrl: data.thumbnailUrl || getYoutubeThumbnail(data.youtubeUrl) || null,
                    sortOrder: data.sortOrder || 0,
                    isPublished: data.isPublished ?? true,
                },
            });
            return NextResponse.json(video, { status: 201 });
        } catch (error) {
            console.error('[Admin Portal Videos POST]', error);
            return NextResponse.json({ error: '建立影片項目失敗' }, { status: 500 });
        }
    });
}
