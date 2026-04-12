import { NextResponse, NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { SLUG_TO_PATH } from '@/lib/page-content';
import { revalidatePath } from 'next/cache';
import sanitizeHtml from 'sanitize-html';

const sanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
        'ul', 'ol', 'li', 'blockquote', 'img', 'a', 'hr',
        'pre', 'code',
    ],
    allowedAttributes: {
        'a': ['href', 'target', 'rel', 'class'],
        'img': ['src', 'alt', 'width', 'height', 'class'],
        'p': ['class'],
        'blockquote': ['class'],
        'pre': ['class'],
        'code': ['class'],
    },
    allowedSchemes: ['http', 'https'],
};

function parseCommaList(value: unknown) {
    if (value === undefined) return undefined;
    if (typeof value !== 'string') return null;
    if (!value.trim()) return null;
    const items = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return items.length ? items : null;
}

function parseDateTime(value: unknown) {
    if (!value || typeof value !== 'string') return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// GET /api/pages/[slug] — get single page (admin, all fields)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { slug } = await params;

        const page = await prisma.page.findUnique({
            where: { slug },
        });

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        return NextResponse.json(page);
    });
}

// PUT /api/pages/[slug] — update page content (admin)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { slug } = await params;
        const body = await request.json();

        const existing = await prisma.page.findUnique({ where: { slug } });
        if (!existing) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        // Build update data
        const updateData: any = {
            updatedBy: req.user!.id,
        };

        // sections (structured pages: home, service, contact)
        if (body.sections !== undefined) {
            updateData.sections = body.sections;
        }

        // richContent (richtext pages: about) — sanitize HTML
        if (body.richContent !== undefined) {
            updateData.richContent = existing.pageType === 'richtext' && body.richContent
                ? sanitizeHtml(body.richContent, sanitizeOptions)
                : body.richContent;
        }

        // SEO fields
        if (body.excerpt !== undefined) updateData.excerpt = body.excerpt || null;
        if (body.targetKeyword !== undefined) updateData.targetKeyword = body.targetKeyword || null;
        if (body.searchIntent !== undefined) updateData.searchIntent = body.searchIntent || null;
        if (body.secondaryKeywords !== undefined) updateData.secondaryKeywords = parseCommaList(body.secondaryKeywords);
        if (body.reviewedAt !== undefined) updateData.reviewedAt = parseDateTime(body.reviewedAt);
        if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle;
        if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription;
        if (body.ogImage !== undefined) updateData.ogImage = body.ogImage;

        // Publish status
        if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;

        const updated = await prisma.page.update({
            where: { slug },
            data: updateData,
        });

        // Audit log
        await writeAudit({
            userId: req.user!.id,
            action: 'update',
            tableName: 'pages',
            recordId: updated.id,
            before: { slug, title: existing.title },
            after: {
                slug,
                title: existing.title,
                excerpt: updated.excerpt,
                targetKeyword: updated.targetKeyword,
                searchIntent: updated.searchIntent,
                seoTitle: updated.seoTitle,
            },
        });

        // Revalidate frontend paths
        const frontendPath = SLUG_TO_PATH[slug];
        if (frontendPath) {
            revalidatePath(frontendPath);
        }
        return NextResponse.json(updated);
    });
}
