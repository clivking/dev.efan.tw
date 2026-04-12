import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

import { withAuth } from '@/lib/middleware/auth';

import { generateInvoicePdf } from '@/lib/pdf/invoicePdf';

import { unstable_noStore as noStore } from 'next/cache';

import { formatDocTitle } from '@/lib/utils';
import { resolveQuoteId } from '@/lib/resolveQuoteId';
import { getOriginFromRequest } from '@/lib/site-url';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        noStore();
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                customer: true,
                companyName: true,
                contacts: { include: { contact: true } },
                location: true,
                items: { orderBy: { sortOrder: 'asc' } },
                variants: { orderBy: { sortOrder: 'asc' } },
                signatures: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });

        if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

        try {
            const pdf = await generateInvoicePdf(quote, getOriginFromRequest(request));
            const { extractArea, simplifyCompanyName } = await import('@/lib/utils');

            const contactNames = quote.contacts?.map((qc: any) => qc.contact?.name).filter(Boolean).join('-') || '';
            const shortCompanyName = simplifyCompanyName(quote.companyName?.companyName || '');
            const areaStr = quote.area || extractArea(quote.location?.address);
            const areaPart = areaStr ? `[${areaStr}] ` : '';

            const formattedTitle = formatDocTitle(quote.name, '請款單');
            const fileName = `${quote.quoteNumber} ${areaPart}${shortCompanyName}-${contactNames}-${formattedTitle}`.trim().replace(/-+$/, '') + '.pdf';
            const encodedFileName = encodeURIComponent(fileName);

            return new NextResponse(pdf as any, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${quote.quoteNumber}-invoice.pdf"; filename*=UTF-8''${encodedFileName}`
                }
            });
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    });
}
