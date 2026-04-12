import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { resolveQuoteId } from '@/lib/resolveQuoteId';
import { privateFileExists, readPrivateFile } from '@/lib/private-files';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; signatureId: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id: rawId, signatureId } = await params;
            const quoteId = await resolveQuoteId(rawId);
            if (!quoteId) {
                return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
            }

            const signature = await prisma.quoteSignature.findFirst({
                where: {
                    id: signatureId,
                    quoteId,
                },
                select: {
                    signatureImage: true,
                },
            });

            if (!signature || !privateFileExists(signature.signatureImage)) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }

            const buffer = await readPrivateFile(signature.signatureImage);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'private, no-store',
                    'X-Robots-Tag': 'noindex, nofollow',
                },
            });
        } catch (error) {
            console.error('Error fetching admin signature image:', error);
            return NextResponse.json({ error: 'internal_error' }, { status: 500 });
        }
    });
}
