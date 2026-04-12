import { prisma } from '@/lib/prisma';

type GuideFaq = {
  question: string;
  answer: string;
};

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function normalizeFaq(value: unknown): GuideFaq[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const record = item as Record<string, unknown>;
      const question = typeof record.question === 'string' ? record.question.trim() : '';
      const answer = typeof record.answer === 'string' ? record.answer.trim() : '';

      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is GuideFaq => Boolean(item));
}

export function normalizeGuide(guide: Awaited<ReturnType<typeof prisma.guideArticle.findFirst>>) {
  if (!guide) return null;

  const createdAt = toDate(guide.createdAt) ?? new Date();
  const updatedAt = toDate(guide.updatedAt) ?? createdAt;
  const publishedAt = toDate(guide.publishedAt);
  const reviewedAt = toDate(guide.reviewedAt);

  return {
    ...guide,
    createdAt,
    updatedAt,
    publishedAt,
    reviewedAt,
    faqItems: normalizeFaq(guide.faq),
    secondaryKeywordList: normalizeStringArray(guide.secondaryKeywords),
    relatedServiceSlugList: normalizeStringArray(guide.relatedServiceSlugs),
    relatedProductSlugList: normalizeStringArray(guide.relatedProductSlugs),
  };
}

export async function getPublishedGuides() {
  const guides = await prisma.guideArticle.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { updatedAt: 'desc' }],
  });

  return guides.map((guide) => normalizeGuide(guide)!);
}

export async function getPublishedGuideBySlug(slug: string) {
  const guide = await prisma.guideArticle.findFirst({
    where: { slug, isPublished: true },
  });

  return normalizeGuide(guide);
}

export async function getPublishedGuideSlugs() {
  const guides = await prisma.guideArticle.findMany({
    where: { isPublished: true },
    select: { slug: true },
    orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { updatedAt: 'desc' }],
  });

  return guides.map((guide) => guide.slug);
}
