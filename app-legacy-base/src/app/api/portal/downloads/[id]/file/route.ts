import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

// GET: download file (public)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const download = await prisma.portalDownload.findFirst({
            where: { id, isPublished: true },
        });

        if (!download) {
            return NextResponse.json({ error: '檔案不存在' }, { status: 404 });
        }

        // If external URL, redirect
        if (download.externalUrl && !download.filePath) {
            return NextResponse.redirect(download.externalUrl);
        }

        // If local file
        if (download.filePath) {
            const filePath = path.join(process.cwd(), 'public', download.filePath);
            if (!fs.existsSync(filePath)) {
                return NextResponse.json({ error: '檔案不存在' }, { status: 404 });
            }

            const fileBuffer = fs.readFileSync(filePath);
            const downloadName = path.basename(download.filePath);

            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
                    'Content-Length': fileBuffer.length.toString(),
                },
            });
        }

        return NextResponse.json({ error: '無下載來源' }, { status: 404 });
    } catch (error) {
        console.error('[Portal Download File]', error);
        return NextResponse.json({ error: '系統錯誤' }, { status: 500 });
    }
}
