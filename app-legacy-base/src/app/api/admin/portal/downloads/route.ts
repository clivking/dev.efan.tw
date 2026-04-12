import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware/auth';

// GET: list all downloads (including unpublished)
export async function GET(req: NextRequest) {
    return withAdmin(req, async () => {
        const downloads = await prisma.portalDownload.findMany({
            orderBy: { sortOrder: 'asc' },
        });
        return NextResponse.json(downloads);
    });
}

// POST: create download
export async function POST(req: NextRequest) {
    return withAdmin(req, async () => {
        try {
            const data = await req.json();
            const download = await prisma.portalDownload.create({
                data: {
                    title: data.title,
                    description: data.description || null,
                    filePath: data.filePath || null,
                    externalUrl: data.externalUrl || null,
                    version: data.version || null,
                    categoryTag: data.categoryTag || null,
                    fileSize: data.fileSize || null,
                    manualPath: data.manualPath || null,
                    imagePath: data.imagePath || null,
                    sortOrder: data.sortOrder || 0,
                    isPublished: data.isPublished ?? true,
                },
            });
            return NextResponse.json(download, { status: 201 });
        } catch (error) {
            console.error('[Admin Portal Downloads POST]', error);
            return NextResponse.json({ error: '建立下載項目失敗' }, { status: 500 });
        }
    });
}
