import { NextRequest, NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { revalidatePath, revalidateTag } from 'next/cache';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import {
  asGuideJsonField,
  normalizeGuideContentGroup,
  normalizeGuideContentType,
  normalizeGuideRedirectStatus,
  normalizeGuideSearchIntent,
  parseGuideCommaList,
  parseGuideJsonField,
} from '@/lib/guide-schema';

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img', 'a', 'hr', 'pre', 'code'],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'class'],
    img: ['src', 'alt', 'width', 'height', 'class'],
    p: ['class'],
    blockquote: ['class'],
    pre: ['class'],
    code: ['class'],
    h1: ['class'],
    h2: ['class'],
    h3: ['class'],
  },
  allowedSchemes: ['http', 'https'],
};

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const guides = await prisma.guideArticle.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        contentGroup: true,
        contentType: true,
        topic: true,
        legacyPath: true,
        redirectStatus: true,
        targetGuideSlug: true,
        searchIntent: true,
        secondaryKeywords: true,
        faq: true,
        authorName: true,
        reviewedAt: true,
        relatedServiceSlugs: true,
        relatedProductSlugs: true,
        isPublished: true,
        publishedAt: true,
        updatedAt: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json(guides);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const body = await request.json();

    const created = await prisma.guideArticle.create({
      data: {
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt || null,
        coverImage: body.coverImage || null,
        content: sanitizeHtml(body.content || '', sanitizeOptions),
        contentGroup: normalizeGuideContentGroup(body.contentGroup),
        contentType: normalizeGuideContentType(body.contentType),
        topic: body.topic || null,
        targetKeyword: body.targetKeyword || null,
        searchIntent: normalizeGuideSearchIntent(body.searchIntent) || null,
        secondaryKeywords: asGuideJsonField(parseGuideCommaList(body.secondaryKeywords)),
        faq: asGuideJsonField(parseGuideJsonField(body.faq)),
        authorName: body.authorName || null,
        reviewedAt: body.reviewedAt ? new Date(body.reviewedAt) : null,
        relatedServiceSlugs: asGuideJsonField(parseGuideCommaList(body.relatedServiceSlugs)),
        relatedProductSlugs: asGuideJsonField(parseGuideCommaList(body.relatedProductSlugs)),
        legacyPath: body.legacyPath || null,
        redirectStatus: normalizeGuideRedirectStatus(body.redirectStatus),
        targetGuideSlug: body.targetGuideSlug || null,
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        isPublished: Boolean(body.isPublished),
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        sortOrder: Number(body.sortOrder) || 0,
        updatedBy: req.user!.id,
      },
    });

    await writeAudit({
      userId: req.user!.id,
      action: 'create',
      tableName: 'guide_articles',
      recordId: created.id,
      before: null,
      after: { slug: created.slug, title: created.title },
    });

    revalidateTag('guides', 'max');
    revalidatePath('/guides');

    return NextResponse.json(created, { status: 201 });
  });
}
