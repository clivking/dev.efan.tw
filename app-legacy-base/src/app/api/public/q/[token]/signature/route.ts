import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;

        const quoteToken = await prisma.quoteToken.findUnique({
            where: { token },
            include: {
                quote: {
                    include: {
                        signatures: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        if (!quoteToken || !quoteToken.isActive || quoteToken.quote.isDeleted) {
            return NextResponse.json({ error: 'not_found', message: '找不到報價單' }, { status: 404 });
        }

        const signature = quoteToken.quote.signatures[0];

        if (!signature) {
            return NextResponse.json({ signature: null });
        }

        return NextResponse.json({
            signature: {
                id: signature.id,
                signerName: signature.signerName,
                signerTitle: signature.signerTitle,
                signatureImage: `/api/public/q/${token}/signature/${signature.id}`,
                signedAt: signature.signedAt
            }
        });

    } catch (error) {
        console.error('Error fetching signature:', error);
        return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
}
