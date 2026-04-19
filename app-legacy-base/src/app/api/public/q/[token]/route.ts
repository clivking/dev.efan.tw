import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import { extractArea, simplifyCompanyName } from '@/lib/utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        const quoteToken = await prisma.quoteToken.findUnique({
            where: { token },
            include: {
                quote: {
                    include: {
                        customer: true,
                        companyName: true,
                        contacts: {
                            include: { contact: true }
                        },
                        location: true,
                        items: {
                            orderBy: { sortOrder: 'asc' },
                        },
                        signatures: {
                            orderBy: { createdAt: 'desc' },
                            take: 1, // Get the latest signature if any
                        },
                    },
                },
            },
        });

        if (!quoteToken || quoteToken.quote.isDeleted) {
            return NextResponse.json(
                { error: 'not_found', message: '此連結不存在' },
                { status: 404 }
            );
        }

        if (!quoteToken.isActive) {
            return NextResponse.json(
                { error: 'deactivated', message: '此連結已失效' },
                { status: 410 }
            );
        }

        if (quoteToken.expiresAt && quoteToken.expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'expired', message: '此連結已過期' },
                { status: 410 }
            );
        }

        const validStatusesForPublic = ['sent', 'signed', 'construction', 'completed', 'paid'];
        if (!validStatusesForPublic.includes(quoteToken.quote.status)) {
            return NextResponse.json(
                { error: 'not_ready', message: '報價單尚未送出' },
                { status: 403 }
            );
        }

        const quote = quoteToken.quote;
        const isExpired = quote.validUntil && quote.validUntil < new Date();

        // Determine the main response status for the frontend
        let statusEnum = 'ok';
        if (quote.status === 'signed' || quote.status === 'construction' || quote.status === 'completed' || quote.status === 'paid') {
            statusEnum = 'signed';
        } else if (isExpired) {
            statusEnum = 'expired_quote';
        }

        // Fetch variants for this quote
        const variants = await prisma.quoteVariant.findMany({
            where: { quoteId: quote.id },
            orderBy: { sortOrder: 'asc' },
        });

        const hasVariants = variants.length > 0;

        // Filter items (remove sensitive info)
        const allFilteredItems = quote.items.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            customerNote: item.customerNote,
            isHiddenItem: item.isHiddenItem,
            sortOrder: item.sortOrder,
            variantId: item.variantId,
        }));

        const sharedItems = allFilteredItems.filter(i => !i.variantId);

        const variantsData = variants.map(v => {
            const variantItems = allFilteredItems.filter(i => i.variantId === v.id);
            const subtotal = Number(v.subtotalAmount);
            const discountAmount = Number(quote.discountAmount);
            const totalAmount = Number(v.totalAmount);

            const taxableAmount = totalAmount; // Actually this is the pre-tax amount from DB
            let taxAmount = 0;
            let inclusiveTotal = taxableAmount;

            if (Number(quote.taxRate) > 0) {
                const taxRate = Number(quote.taxRate);
                taxAmount = Math.round(taxableAmount * taxRate / 100);
                inclusiveTotal = taxableAmount + taxAmount;
            }

            return {
                id: v.id,
                name: v.name,
                isRecommended: v.isRecommended,
                sortOrder: v.sortOrder,
                items: variantItems,
                pricing: {
                    beforeTax: taxableAmount,
                    taxAmount,
                    subtotalWithTax: subtotal,
                    discountAmount,
                    discountNote: quote.discountNote,
                    transportFee: Number(quote.transportFee || 0),
                    totalAmount: inclusiveTotal,
                }
            };
        });

        // Current totals (based on recommended or main table)
        const subtotalAmount = Number(quote.subtotalAmount);
        const taxRate = Number(quote.taxRate);
        const discountAmount = Number(quote.discountAmount);
        const totalAmount = Number(quote.totalAmount);

        const taxableAmount = totalAmount; // Pre-tax amount from DB
        let taxAmount = 0;
        let inclusiveTotal = taxableAmount;
        if (taxRate > 0) {
            taxAmount = Math.round(taxableAmount * taxRate / 100);
            inclusiveTotal = taxableAmount + taxAmount;
        }

        const pricing = {
            beforeTax: taxableAmount,
            taxAmount,
            subtotalWithTax: subtotalAmount,
            discountAmount,
            discountNote: quote.discountNote,
            transportFee: Number(quote.transportFee || 0),
            totalAmount: inclusiveTotal,
        };

        // Prepare customer info
        const quoteContact = quote.contacts && quote.contacts.length > 0 ? quote.contacts[0].contact : null;

        const customerInfo = {
            companyName: quote.companyName ? quote.companyName.companyName : null,
            taxId: quote.companyName ? quote.companyName.taxId : null,
            contactName: quoteContact ? quoteContact.name : null,
            contactPhone: quoteContact ? quoteContact.phone : null,
            contactMobile: quoteContact ? quoteContact.mobile : null,
            locationName: quote.location?.name || null,
            locationAddress: quote.location?.address || null,
        };

        // Prepare company info from settings
        const companyInfo = {
            name: await getSetting('company_name', '一帆安全整合有限公司'),
            phone: await getSetting('company_phone', '02-7730-1158'),
            email: await getSetting('company_email', 'safekings@gmail.com'),
            address: await getSetting('company_address', '台北市大安區四維路14巷15號7樓之1'),
            logoUrl: await getSetting('pdf_logo_url', '') || await getSetting('company_logo_url', '/images/logo.png'),
            stampUrl: await getSetting('company_stamp_url', ''),
        };

        const latestSignature = quote.signatures.length > 0 ? quote.signatures[0] : null;

        // Prepare page title exactly as PDF filename
        const contactNames = quote.contacts?.map((qc: any) => qc.contact?.name).filter(Boolean).join('-') || '';
        const shortCompanyName = simplifyCompanyName(quote.companyName?.companyName || '');
        const areaStr = (quote as any).area || extractArea(quote.location?.address);
        const areaPart = areaStr ? `[${areaStr}] ` : '';
        const pageTitle = `${quote.quoteNumber} ${areaPart}${shortCompanyName}-${contactNames}-${quote.name || ''}`.trim().replace(/-+$/, '');

        return NextResponse.json({
            status: statusEnum,
            quote: {
                id: quote.id,
                quoteNumber: quote.quoteNumber,
                status: quote.status,
                createdAt: quote.createdAt.toISOString(),
                validUntil: quote.validUntil ? quote.validUntil.toISOString() : null,
                discountExpiryAt: quote.discountExpiryAt ? quote.discountExpiryAt.toISOString() : null,
                isExpired,
                taxRate,
                customer: customerInfo,
                hasVariants,
                variants: variantsData,
                sharedItems,
                items: allFilteredItems,
                selectedVariantId: quote.selectedVariantId,
                pricing: pricing,
                customerNote: quote.customerNote,
                name: quote.name,
                nameEn: quote.nameEn,
                pageTitle: pageTitle,
            },
            company: companyInfo,
            signature: latestSignature ? {
                id: latestSignature.id,
                signerName: latestSignature.signerName,
                signerTitle: latestSignature.signerTitle,
                signatureImage: `/api/public/q/${token}/signature/${latestSignature.id}`,
                signedAt: latestSignature.signedAt.toISOString(),
            } : null,
        });
    } catch (error) {
        console.error('Error fetching public quote:', error);
        return NextResponse.json(
            { error: 'internal_server_error' },
            { status: 500 }
        );
    }
}
