import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import GuideToc from '@/components/common/GuideToc';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getCompanyInfo } from '@/lib/company';
import { getServiceEntitiesBySlugs, getServiceLabel } from '@/lib/content-entities';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getPublishedGuideBySlug } from '@/lib/guide-content';
import { GUIDE_CONTENT_TYPE_LABELS, GUIDE_SEARCH_INTENT_LABELS } from '@/lib/guide-schema';
import { shouldBypassImageOptimization } from '@/lib/image-paths';
import { prisma } from '@/lib/prisma';
import { getProductMainImages } from '@/lib/product-helpers';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqSchema } from '@/lib/structured-data';

type Props = {
  params: Promise<{ slug: string }>;
};

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function toIsoString(value: unknown): string | undefined {
  return toDate(value)?.toISOString();
}

function formatDate(value: unknown): string {
  const parsed = toDate(value);
  return parsed ? parsed.toLocaleDateString('zh-TW') : '待確認';
}

function formatDateTime(value: unknown): string {
  const parsed = toDate(value);
  return parsed ? parsed.toLocaleString('zh-TW') : '待確認';
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function slugifyHeading(value: string) {
  const normalized = stripHtml(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

  return normalized || 'section';
}

type GuideHeading = {
  id: string;
  text: string;
};

function normalizeGuideArticleHtml(content: string) {
  return content
    .replace(/<p>\s*(?:&nbsp;|\s|<br\s*\/?>)*<\/p>/gi, '')
    .replace(/<p>([\s\S]*?)<\/p>/gi, (_match, inner: string) => {
      const normalizedInner = inner
        .replace(/^\s*(<br\s*\/?>\s*)+/gi, '')
        .replace(/(<br\s*\/?>\s*)+$/gi, '')
        .replace(/(?:<br\s*\/?>\s*){2,}/gi, '</p><p>');

      return `<p>${normalizedInner}</p>`;
    })
    .replace(/(<\/(?:h2|h3|ul|ol|blockquote|table|figure)>)\s*(?:<br\s*\/?>\s*)+/gi, '$1')
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br />');
}

function buildGuideContentWithAnchors(content: string) {
  const usedIds = new Map<string, number>();
  const headings: GuideHeading[] = [];
  const normalizedContent = normalizeGuideArticleHtml(content);

  const html = normalizedContent.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_match, attrs: string, inner: string) => {
    const text = stripHtml(inner);
    const baseId = slugifyHeading(text);
    const count = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
    headings.push({ id, text });

    if (/\sid=/.test(attrs)) {
      return `<h2${attrs}>${inner}</h2>`;
    }

    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });

  return { html, headings };
}

async function getRelatedProducts(slugs: string[]) {
  if (slugs.length === 0) return [];

  const products = await prisma.product.findMany({
    where: {
      seoSlug: { in: slugs },
      isDeleted: false,
      showOnWebsite: true,
    },
    select: {
      id: true,
      name: true,
      seoSlug: true,
      brand: true,
      model: true,
      websiteDescription: true,
    },
  });

  const order = new Map(slugs.map((slug, index) => [slug, index]));
  const sortedProducts = products.sort((a, b) => (order.get(a.seoSlug || '') ?? 999) - (order.get(b.seoSlug || '') ?? 999));
  const imageMap = await getProductMainImages(sortedProducts.map((product) => product.id));

  return sortedProducts.map((product) => ({
    ...product,
    imageUrl: imageMap.get(product.id) ?? null,
  }));
}

async function getRelatedGuides(currentSlug: string, topic: string | null) {
  const guides = await prisma.guideArticle.findMany({
    where: {
      isPublished: true,
      slug: { not: currentSlug },
      ...(topic ? { topic } : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      topic: true,
      contentType: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { updatedAt: 'desc' }],
    take: 3,
  });

  if (guides.length > 0 || topic) {
    return guides;
  }

  return prisma.guideArticle.findMany({
    where: {
      isPublished: true,
      slug: { not: currentSlug },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      topic: true,
      contentType: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { updatedAt: 'desc' }],
    take: 3,
  });
}

function buildSummaryItems(guide: NonNullable<Awaited<ReturnType<typeof getPublishedGuideBySlug>>>) {
  return [
    {
      label: '適合誰看',
      value: guide.searchIntent
        ? GUIDE_SEARCH_INTENT_LABELS[guide.searchIntent] || guide.searchIntent
        : '正在評估採購與升級的人',
    },
    {
      label: '文章主題',
      value: guide.topic || GUIDE_CONTENT_TYPE_LABELS[guide.contentType] || guide.contentType,
    },
    {
      label: '下一步',
      value: guide.relatedServiceSlugList.length > 0 ? '可直接延伸到服務規劃' : '可先整理需求再詢價',
    },
  ];
}

function splitGuideTitle(title: string) {
  const parts = title.split('：');
  return {
    lead: parts[0] || title,
    remainder: parts.slice(1).join('：').trim(),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [guide, site, company] = await Promise.all([
    getPublishedGuideBySlug(slug),
    getRequestSiteContext(),
    getCompanyInfo(),
  ]);

  if (!guide) return {};

  return buildContentMetadata({
    site,
    pathname: `/guides/${guide.slug}`,
    title: guide.seoTitle || guide.title,
    description: guide.seoDescription || guide.excerpt || guide.title,
    siteName: company.name,
    ogImage: guide.coverImage,
    type: 'article',
  });
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const [guide, site, company] = await Promise.all([getPublishedGuideBySlug(slug), getRequestSiteContext(), getCompanyInfo()]);

  if (!guide) {
    notFound();
  }

  const [relatedProducts, relatedGuides] = await Promise.all([
    getRelatedProducts(guide.relatedProductSlugList),
    getRelatedGuides(guide.slug, guide.topic),
  ]);

  const summaryItems = buildSummaryItems(guide);
  const relatedServices = getServiceEntitiesBySlugs(guide.relatedServiceSlugList);
  const articleContent = buildGuideContentWithAnchors(guide.content);
  const titleParts = splitGuideTitle(guide.title);

  const articleSchema = buildArticleSchema({
    url: `${site.origin}/guides/${guide.slug}`,
    headline: guide.title,
    description: guide.seoDescription || guide.excerpt || '',
    authorName: guide.authorName || company.name,
    publisherName: company.name,
    publisherLogoUrl: `${site.origin}/images/logo.png`,
    datePublished: toIsoString(guide.publishedAt) || toIsoString(guide.createdAt),
    dateModified: toIsoString(guide.updatedAt),
    image: guide.coverImage || undefined,
    speakableCssSelectors: ['#guide-headline', '#guide-body'],
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '首頁', item: `${site.origin}/` },
    { name: '知識指南', item: `${site.origin}/guides` },
    { name: guide.title, item: `${site.origin}/guides/${guide.slug}` },
  ]);

  const faqSchema = buildFaqSchema(guide.faqItems);

  return (
    <div className="bg-[radial-gradient(circle_at_top,#f6f1e7_0%,#f4f1ea_42%,#efe9dd_100%)] text-slate-900">
      <JsonLdScript data={articleSchema} />
      <JsonLdScript data={breadcrumbSchema} />
      <JsonLdScript data={faqSchema} />

      <section className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,#0f172a_0%,#172554_42%,#1e293b_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_22%)]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-14">
            <div className="min-w-0">
              <div className="mt-8 max-w-5xl">
                <div className="text-[11px] font-black tracking-[0.28em] text-slate-300 md:text-xs">EFAN DECISION GUIDE</div>
                <h1 id="guide-headline" className="mt-4 max-w-none text-4xl font-black leading-[1.04] tracking-[-0.04em] text-white md:text-6xl">
                  {guide.title}
                </h1>
                {guide.excerpt ? <p className="mt-6 max-w-none text-lg leading-8 text-slate-200 md:text-[1.2rem]">{guide.excerpt}</p> : null}
              </div>
            </div>

            <aside className="hidden lg:block" aria-hidden="true" />
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-12">
          <aside className="min-w-0">
            <GuideToc headings={articleContent.headings} />
          </aside>

          <div className="min-w-0">
          <section className="mb-10 grid gap-5 rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm md:p-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
            <div>
              <nav className="flex flex-wrap items-center gap-y-2 text-sm leading-7 text-slate-500">
                <Link href="/" className="font-medium text-slate-700 transition hover:text-slate-950">
                  首頁
                </Link>
                <span className="mx-2 text-slate-300">/</span>
                <Link href="/guides" className="font-medium text-slate-700 transition hover:text-slate-950">
                  知識指南
                </Link>
                <span className="mx-2 text-slate-300">/</span>
                <span className="font-medium text-slate-700">{titleParts.lead}</span>
              </nav>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold tracking-[0.16em] md:text-xs">
                <span className="rounded-full border border-slate-200 bg-stone-50 px-3 py-1.5 text-slate-700">
                  {GUIDE_CONTENT_TYPE_LABELS[guide.contentType] || guide.contentType}
                </span>
                {guide.topic ? <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">{guide.topic}</span> : null}
                {guide.searchIntent ? (
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-700">
                    {GUIDE_SEARCH_INTENT_LABELS[guide.searchIntent] || guide.searchIntent}
                  </span>
                ) : null}
              </div>
              {titleParts.remainder ? <div className="mt-4 text-sm leading-7 text-slate-600">{`${GUIDE_CONTENT_TYPE_LABELS[guide.contentType] || guide.contentType}：${titleParts.remainder}`}</div> : null}
              <div className="mt-6 text-sm font-bold tracking-[0.18em] text-slate-400">ARTICLE INFO</div>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                <span className="font-medium text-slate-700">作者：{guide.authorName || '一帆科技'}</span>
                <span>發布：{formatDate(guide.publishedAt || guide.createdAt)}</span>
                <span>更新：{formatDateTime(guide.reviewedAt || guide.updatedAt)}</span>
                <span>章節：{articleContent.headings.length} 個重點章節</span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {summaryItems.map((item) => (
                  <div key={item.label} className="rounded-[1.4rem] border border-slate-200 bg-stone-50/70 p-4">
                    <div className="text-[11px] font-black tracking-[0.16em] text-slate-400">{item.label}</div>
                    <div className="mt-2 text-sm leading-7 text-slate-700">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#faf8f2_0%,#ffffff_100%)] p-5">
              <div className="text-sm font-bold tracking-[0.18em] text-slate-400">NEXT STEP</div>
              {guide.targetKeyword ? (
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  主要關鍵字：<span className="font-semibold text-slate-900">{guide.targetKeyword}</span>
                </p>
              ) : null}
              <div className="mt-5 space-y-3">
                <Link href="/quote-request" className="block rounded-2xl bg-slate-950 px-4 py-3 text-center font-bold text-white transition hover:bg-slate-800">
                  預約需求盤點
                </Link>
                <Link href="/services/access-control" className="block rounded-2xl border border-slate-300 px-4 py-3 text-center font-bold text-slate-900 transition hover:border-slate-900">
                  看門禁服務方案
                </Link>
              </div>
            </div>
          </section>

          {guide.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={guide.coverImage}
              alt={guide.title}
              className="mb-10 h-auto w-full rounded-[2.2rem] border border-black/5 object-cover shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
            />
          ) : null}

          <section className="border-t border-slate-300/70 pt-8 md:pt-10">
            <div
              id="guide-body"
              className="prose prose-slate max-w-none text-[18px] leading-9 prose-headings:scroll-mt-28 prose-headings:font-black prose-headings:tracking-[-0.035em] prose-headings:text-balance prose-headings:text-slate-950 prose-p:my-8 prose-p:max-w-none prose-p:text-slate-700 prose-p:text-[1.2rem] prose-p:font-medium prose-p:leading-[2.15] prose-p:[text-wrap:pretty] prose-p:first-of-type:text-[1.38rem] prose-p:first-of-type:font-semibold prose-p:first-of-type:leading-[1.95] prose-p:first-of-type:text-slate-900 prose-a:font-semibold prose-a:text-[#1d4ed8] prose-strong:font-black prose-strong:text-slate-950 prose-table:my-10 prose-table:overflow-hidden prose-table:rounded-2xl prose-table:border prose-table:border-slate-200 prose-thead:border-b prose-thead:border-slate-200 prose-thead:bg-stone-50 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:text-sm prose-th:font-black prose-th:text-slate-900 prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:leading-7 prose-blockquote:my-12 prose-blockquote:max-w-none prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50/60 prose-blockquote:px-6 prose-blockquote:py-5 prose-blockquote:text-[1.08rem] prose-blockquote:font-medium prose-blockquote:text-slate-700 [&_h2]:mt-20 [&_h2]:mb-8 [&_h2]:border-t [&_h2]:border-slate-200 [&_h2]:pt-10 [&_h2]:text-[2.7rem] [&_h2]:leading-[1.1] [&_h3]:mt-12 [&_h3]:mb-5 [&_h3]:border-l-4 [&_h3]:border-slate-900 [&_h3]:pl-4 [&_h3]:text-[1.9rem] [&_h3]:leading-tight [&_ul]:my-10 [&_ul]:max-w-none [&_ul]:list-none [&_ul]:space-y-4 [&_ul]:pl-0 [&_ul>li]:rounded-[1.35rem] [&_ul>li]:border [&_ul>li]:border-slate-200 [&_ul>li]:bg-white/75 [&_ul>li]:px-5 [&_ul>li]:py-4 [&_ul>li]:text-[1.08rem] [&_ul>li]:leading-8 [&_ul>li]:shadow-[0_8px_24px_rgba(15,23,42,0.04)] [&_ol]:my-10 [&_ol]:max-w-none [&_ol]:space-y-4 [&_ol]:pl-7 [&_ol>li]:pl-2 [&_ol>li]:text-[1.08rem] [&_ol>li]:leading-8"
              dangerouslySetInnerHTML={{ __html: articleContent.html }}
            />
          </section>

          {guide.faqItems.length > 0 ? (
            <section className="mt-14 rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm md:p-8">
              <div className="mb-5">
                <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FAQ</div>
                <h2 className="mt-2 text-2xl font-black text-slate-950">常見問題</h2>
              </div>
              <div className="space-y-4">
                {guide.faqItems.map((item) => (
                  <div key={item.question} className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf7_100%)] p-5">
                    <h3 className="text-lg font-bold text-slate-950">{item.question}</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {relatedGuides.length > 0 ? (
            <section className="mt-14 rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm md:p-8">
              <div className="mb-5">
                <div className="text-sm font-bold tracking-[0.18em] text-slate-400">RELATED</div>
                <h2 className="mt-2 text-2xl font-black text-slate-950">延伸閱讀</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {relatedGuides.map((item) => (
                  <Link
                    key={item.id}
                    href={`/guides/${item.slug}`}
                    className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#faf8f2_0%,#ffffff_100%)] p-5 transition hover:-translate-y-0.5 hover:border-[#1d4ed8] hover:bg-white hover:shadow-sm"
                  >
                    <div className="text-xs font-bold tracking-[0.16em] text-slate-400">
                      {item.topic || GUIDE_CONTENT_TYPE_LABELS[item.contentType] || item.contentType}
                    </div>
                    <div className="mt-3 text-lg font-black text-slate-950">{item.title}</div>
                    {item.excerpt ? <p className="mt-2 text-sm leading-7 text-slate-600">{item.excerpt}</p> : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {guide.relatedServiceSlugList.length > 0 ? (
            <section className="mt-14 rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm md:p-8">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-bold tracking-[0.18em] text-slate-400">SERVICES</div>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">把判斷延伸成規劃</h2>
                </div>
                <p className="hidden max-w-sm text-sm leading-6 text-slate-500 md:block">
                  如果你已經從文章整理出需求方向，下一步通常是把場景與管理規則收斂成可報價的規格。
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {(relatedServices.length > 0
                  ? relatedServices
                  : guide.relatedServiceSlugList.map((slug) => ({
                      slug,
                      href: `/services/${slug}`,
                      name: getServiceLabel(slug),
                    }))).map((service) => (
                  <Link
                    key={service.slug}
                    href={service.href}
                    className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#faf8f2_0%,#ffffff_100%)] px-5 py-5 font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-sm"
                  >
                    {service.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {relatedProducts.length > 0 ? (
            <section className="mt-14 rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm md:p-8">
              <div className="mb-5">
                <div className="text-sm font-bold tracking-[0.18em] text-slate-400">PRODUCTS</div>
                <h2 className="mt-2 text-2xl font-black text-slate-950">常被一起比較的產品</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {relatedProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.seoSlug}`}
                    className="block overflow-hidden rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#faf8f2_0%,#ffffff_100%)] transition hover:-translate-y-0.5 hover:border-slate-900 hover:bg-white hover:shadow-sm"
                  >
                    <div className="relative aspect-[4/3] bg-white">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          unoptimized={shouldBypassImageOptimization(product.imageUrl)}
                          className="object-contain p-4"
                          sizes="(min-width: 768px) 33vw, 100vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-bold text-slate-300">
                          {product.brand || 'PRODUCT'}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-200 px-4 py-4">
                      <div className="text-[11px] font-bold tracking-[0.18em] text-slate-400">
                        {[product.brand, product.model].filter(Boolean).join(' / ') || 'PRODUCT'}
                      </div>
                      <div className="mt-1 text-sm font-black leading-6 text-slate-950">{product.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-14 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#111827_55%,#1f2937_100%)] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] md:p-8">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px] md:items-end">
              <div>
                <div className="text-sm font-bold tracking-[0.18em] text-slate-400">NEXT STEP</div>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.03em]">把文章裡的判斷，變成可執行規格</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  如果你已經接近採購或升級階段，下一步通常不是再讀更多資料，而是把現場條件、門點數量、權限設計與整合需求整理清楚。
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                <div className="text-[11px] font-black tracking-[0.18em] text-slate-400">READY WHEN YOU ARE</div>
                <div className="mt-2 text-sm leading-7 text-slate-200">適合正在比方案、準備詢價、或需要內部彙整規格的企業團隊。</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/quote-request" className="rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300">
                直接詢價
              </Link>
              <Link href="/services/access-control" className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                看服務項目
              </Link>
              <Link href="/products" className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                看產品目錄
              </Link>
            </div>
          </section>
          </div>
        </div>
      </article>
    </div>
  );
}
