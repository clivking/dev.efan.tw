import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { privateFileExists, readPrivateFile } from '@/lib/private-files';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ token: string; signatureId: string }> }
) {
    try {
        const { token, signatureId } = await params;

        const quoteToken = await prisma.quoteToken.findUnique({
            where: { token },
            include: {
                quote: {
                    select: {
                        id: true,
                        isDeleted: true,
                    },
                },
            },
        });

        if (!quoteToken || !quoteToken.isActive || quoteToken.quote.isDeleted) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 });
        }

        if (quoteToken.expiresAt && quoteToken.expiresAt < new Date()) {
            return NextResponse.json({ error: 'expired' }, { status: 410 });
        }

        const signature = await prisma.quoteSignature.findFirst({
            where: {
                id: signatureId,
                quoteId: quoteToken.quoteId,
            },
            select: {
                signatureImage: true,
            },
        });

        if (!signature || !privateFileExists(signature.signatureImage)) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 });
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
        console.error('Error fetching public signature image:', error);
        return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
}
