import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { savePrivateFile } from '@/lib/private-files';

const MIN_SIGNATURE_LENGTH = 5000;

function isSignatureBlank(base64: string): boolean {
    // Basic length-based heuristic for blank canvas detection
    const data = base64.replace(/^data:image\/\w+;base64,/, '');
    return data.length < MIN_SIGNATURE_LENGTH;
}

async function saveSignatureImage(base64Data: string, quoteId: string): Promise<string> {
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const filename = `${quoteId}_${Date.now()}.png`;
    return savePrivateFile(`signatures/${filename}`, buffer);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const { signerName, signerTitle, signatureImage, variantId } = await request.json();

        // 1. Verify token and find active quote
        const quoteToken = await prisma.quoteToken.findUnique({
            where: { token },
            include: {
                quote: {
                    include: {
                        customer: {
                            include: {
                                companyNames: { where: { isPrimary: true }, take: 1 },
                                contacts: { where: { isPrimary: true }, take: 1 },
                            }
                        }
                    }
                }
            }
        });

        if (!quoteToken || !quoteToken.isActive || quoteToken.quote.isDeleted) {
            return NextResponse.json({ error: 'invalid_token', message: '無效的令牌或報價單已刪除' }, { status: 404 });
        }

        const quote = quoteToken.quote;

        // 2. Validate multi-variant selection
        const hasVariants = await prisma.quoteVariant.count({ where: { quoteId: quote.id } }) > 0;
        if (hasVariants && !variantId) {
            return NextResponse.json({ error: 'variant_required', message: '請先選擇一個方案再進行簽回' }, { status: 400 });
        }

        // 3. Validate status (only 'sent' can be signed)
        if (quote.status !== 'sent') {
            if (['signed', 'construction', 'completed', 'paid'].includes(quote.status)) {
                return NextResponse.json({ error: 'already_signed', message: '此報價單已簽回' }, { status: 409 });
            }
            return NextResponse.json({ error: 'invalid_status', message: '報價單尚未送出或狀態不符合簽回條件' }, { status: 403 });
        }

        // 3. Validate required fields
        if (!signerName || signerName.trim() === '') {
            return NextResponse.json({ error: 'missing_name', message: '請填寫簽名人姓名' }, { status: 400 });
        }

        if (!signatureImage || isSignatureBlank(signatureImage)) {
            return NextResponse.json({ error: 'invalid_signature', message: '請在簽名板上簽名' }, { status: 400 });
        }

        // 4. Save image and update records
        const signaturePath = await saveSignatureImage(signatureImage, quote.id);
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';

        const now = new Date();

        // Execute in transaction (core business logic only)
        const result = await prisma.$transaction(async (tx) => {
            // Create signature record
            const signature = await tx.quoteSignature.create({
                data: {
                    quoteId: quote.id,
                    signerName,
                    signerTitle,
                    signatureImage: signaturePath,
                    ipAddress,
                    userAgent,
                    signedAt: now
                }
            });

            // Update quote status
            await tx.quote.update({
                where: { id: quote.id },
                data: {
                    status: 'signed',
                    signedAt: now,
                    selectedVariantId: variantId
                }
            });

            return signature;
        });

        // Create audit log (non-critical, don't block signature)
        try {
            if (quote.createdBy) {
                await prisma.auditLog.create({
                    data: {
                        userId: quote.createdBy,
                        action: 'QUOTE_SIGNED_PUBLIC',
                        tableName: 'quotes',
                        recordId: quote.id,
                        before: { status: quote.status },
                        after: { status: 'signed', signedAt: now },
                        ipAddress: ipAddress
                    }
                });
            }
        } catch (auditErr) {
            console.warn('Audit log creation failed (non-critical):', auditErr);
        }


        // 6. Send Telegram notification (Fire-and-forget)
        try {
            const { formatQuoteMessage, fireAndForgetNotification } = await import('@/lib/notifications/telegram');
            const customerName = (quote as any).customer?.companyNames[0]?.companyName || (quote as any).customer?.contacts[0]?.name || '未知客戶';

            // Get selected variant name if any
            let variantName = '';
            if (variantId) {
                const variant = await prisma.quoteVariant.findUnique({ where: { id: variantId } });
                variantName = variant?.name || '';
            }

            const message = formatQuoteMessage('signed', {
                id: quote.id,
                quoteNumber: quote.quoteNumber,
                customerName: customerName,
                totalAmount: quote.totalAmount,
                signerName: signerName,
                variantName: variantName
            });
            fireAndForgetNotification(message, { type: 'quote_signed', entityType: 'quotes', entityId: quote.id });
        } catch (e) {
            console.error('Failed to trigger Telegram notification logic:', e);
        }

        return NextResponse.json({
            success: true,
            message: '感謝簽回！我們將盡快為您安排。',
            signature: {
                signerName: result.signerName,
                signerTitle: result.signerTitle,
                signedAt: result.signedAt
            }
        });

    } catch (error: any) {
        console.error('Signature submission error:', error);
        return NextResponse.json({ error: 'server_error', message: '伺服器錯誤，請稍後再試' }, { status: 500 });
    }
}
