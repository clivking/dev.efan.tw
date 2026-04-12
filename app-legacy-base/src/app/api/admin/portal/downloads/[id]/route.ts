import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware/auth';

// PUT: update download
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(req, async () => {
        try {
            const { id } = await params;
            const data = await req.json();
            const download = await prisma.portalDownload.update({
                where: { id },
                data: {
                    title: data.title,
                    description: data.description,
                    filePath: data.filePath,
                    externalUrl: data.externalUrl,
                    version: data.version,
                    categoryTag: data.categoryTag,
                    fileSize: data.fileSize,
                    manualPath: data.manualPath,
                    imagePath: data.imagePath,
                    sortOrder: data.sortOrder,
                    isPublished: data.isPublished,
                },
            });
            return NextResponse.json(download);
        } catch (error) {
            console.error('[Admin Portal Downloads PUT]', error);
            return NextResponse.json({ error: '更新下載項目失敗' }, { status: 500 });
        }
    });
}

// DELETE: delete download
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(req, async () => {
        try {
            const { id } = await params;
            await prisma.portalDownload.delete({ where: { id } });
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('[Admin Portal Downloads DELETE]', error);
            return NextResponse.json({ error: '刪除下載項目失敗' }, { status: 500 });
        }
    });
}
