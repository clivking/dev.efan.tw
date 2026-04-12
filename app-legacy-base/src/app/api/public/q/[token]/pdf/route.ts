import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { generateQuotePdf } from '@/lib/pdf/generator';
import { unstable_noStore as noStore } from 'next/cache';
import { getOriginFromRequest } from '@/lib/site-url';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    noStore();
    const { token } = await params;

    const quoteToken = await prisma.quoteToken.findUnique({
        where: { token },
        include: {
            quote: {
                include: {
                    customer: true,
                    companyName: true,
                    contacts: { include: { contact: true } },
                    location: true,
                    items: { orderBy: { sortOrder: 'asc' } },
                    variants: { orderBy: { sortOrder: 'asc' } },
                    signatures: { orderBy: { createdAt: 'desc' }, take: 1 }
                }
            }
        }
    });

    if (!quoteToken || quoteToken.quote.isDeleted || !quoteToken.isActive) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const quote = quoteToken.quote;

    const pdf = await generateQuotePdf(quote, getOriginFromRequest(request));
    const { extractArea, simplifyCompanyName } = await import('@/lib/utils');

    const contactNames = quote.contacts?.map((qc: any) => qc.contact?.name).filter(Boolean).join('-') || '';
    const shortCompanyName = simplifyCompanyName(quote.companyName?.companyName || '');
    const areaStr = quote.area || extractArea(quote.location?.address);
    const areaPart = areaStr ? `[${areaStr}] ` : '';

    const fileName = `${quote.quoteNumber} ${areaPart}${shortCompanyName}-${contactNames}-${quote.name || ''}`.trim().replace(/-+$/, '') + '.pdf';
    const encodedFileName = encodeURIComponent(fileName);

    // Standard filename should be ASCII only to avoid header errors
    const asciiFileName = `${quote.quoteNumber}.pdf`;

    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === '1';

    return new NextResponse(pdf as any, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`
        }
    });
}
