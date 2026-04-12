import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { generateReceiptPdf } from '@/lib/pdf/receiptPdf';
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

        const requestedPaymentId = request.nextUrl.searchParams.get('paymentId');
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                customer: true,
                companyName: true,
                contacts: { include: { contact: true } },
                location: true,
                items: { orderBy: { sortOrder: 'asc' } },
                variants: { orderBy: { sortOrder: 'asc' } },
                payments: {
                    include: {
                        recorder: {
                            select: { name: true }
                        }
                    },
                    orderBy: [{ paidAt: 'asc' }, { createdAt: 'asc' }]
                }
            }
        });

        if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

        const payment = requestedPaymentId
            ? quote.payments.find((entry: any) => entry.id === requestedPaymentId)
            : quote.payments[quote.payments.length - 1] ?? null;

        if (requestedPaymentId && !payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        try {
            const pdf = await generateReceiptPdf(quote, payment, getOriginFromRequest(request));
            const { extractArea, simplifyCompanyName } = await import('@/lib/utils');

            const contactNames = quote.contacts?.map((qc: any) => qc.contact?.name).filter(Boolean).join('-') || '';
            const shortCompanyName = simplifyCompanyName(quote.companyName?.companyName || '');
            const areaStr = quote.area || extractArea(quote.location?.address);
            const areaPart = areaStr ? `[${areaStr}] ` : '';
            const formattedTitle = formatDocTitle(quote.name, '收據單');
            const fileName = `${quote.quoteNumber} ${areaPart}${shortCompanyName}-${contactNames}-${formattedTitle}`.trim().replace(/-+$/, '') + '.pdf';
            const encodedFileName = encodeURIComponent(fileName);

            return new NextResponse(pdf as any, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${quote.quoteNumber}-receipt.pdf"; filename*=UTF-8''${encodedFileName}`
                }
            });
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    });
}
