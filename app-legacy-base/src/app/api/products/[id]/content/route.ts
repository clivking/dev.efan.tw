import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { extractPlainText } from '@/lib/tiptap';

// GET — 取得產品 content 相關欄位 + 分類模板 + 文件
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                brand: true,
                model: true,
                content: true,
                specifications: true,
                videoUrl: true,
                faqs: true,
                seoRatingValue: true,
                seoRatingCount: true,
                seoReviews: true,
                websiteDescription: true,
                categoryId: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        specTemplate: true,
                    },
                },
            },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Get documents
        const documents = await prisma.uploadedFile.findMany({
            where: { entityType: 'product_document', entityId: id },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                filename: true,
                filepath: true,
                mimetype: true,
                size: true,
                sortOrder: true,
                title: true,
                description: true,
                docType: true,
            },
        });

        return NextResponse.json({
            product,
            documents,
            specTemplate: product.category?.specTemplate || null,
        });
    });
}

// PUT — 只更新 content 相關欄位（不影響 ProductForm 基本欄位）
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const body = await request.json();
        const { content, specifications, videoUrl, faqs, seoRatingValue, seoRatingCount, seoReviews } = body;

        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Validate specifications format if provided
        if (specifications !== undefined && specifications !== null) {
            if (!Array.isArray(specifications)) {
                return NextResponse.json({ error: 'specifications 必須是陣列格式' }, { status: 400 });
            }
        }

        // Validate faqs format if provided
        if (faqs !== undefined && faqs !== null) {
            if (!Array.isArray(faqs)) {
                return NextResponse.json({ error: 'faqs 必須是陣列格式' }, { status: 400 });
            }
            for (const faq of faqs) {
                if (!faq.question || !faq.answer) {
                    return NextResponse.json({ error: '每個 FAQ 必須有 question 和 answer' }, { status: 400 });
                }
            }
        }

        // Validate YouTube URL if provided
        if (videoUrl !== undefined && videoUrl !== null && videoUrl.trim() !== '') {
            const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
            if (!ytMatch) {
                return NextResponse.json({ error: '請提供有效的 YouTube 影片網址' }, { status: 400 });
            }
        }

        // Build update data
        const updateData: any = {};
        if (content !== undefined) updateData.content = content;
        if (specifications !== undefined) updateData.specifications = specifications;
        if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;
        if (faqs !== undefined) updateData.faqs = faqs;
        if (seoRatingValue !== undefined) updateData.seoRatingValue = (seoRatingValue !== '' && seoRatingValue !== null) ? Number(seoRatingValue) : null;
        if (seoRatingCount !== undefined) updateData.seoRatingCount = (seoRatingCount !== '' && seoRatingCount !== null) ? Number(seoRatingCount) : null;
        if (seoReviews !== undefined) updateData.seoReviews = seoReviews;

        // Auto-fill websiteDescription from content if empty
        if (content && !existing.websiteDescription) {
            let plainText = '';
            if (typeof content === 'string') {
                // HTML string: strip tags to get plain text
                plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            } else {
                plainText = extractPlainText(content);
            }
            if (plainText) {
                updateData.websiteDescription = plainText.slice(0, 150);
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'update',
            tableName: 'products',
            recordId: id,
            before: { content: existing.content, specifications: existing.specifications, videoUrl: existing.videoUrl, faqs: existing.faqs } as any,
            after: { content: product.content, specifications: product.specifications, videoUrl: product.videoUrl, faqs: product.faqs } as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true, product });
    });
}
