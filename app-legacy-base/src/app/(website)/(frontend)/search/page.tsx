import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Search } from 'lucide-react';
import JsonLdScript from '@/components/common/JsonLdScript';
import { prisma } from '@/lib/prisma';
import { getCompanyInfo } from '@/lib/company';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getCategoryTree } from '@/lib/category-tree';
import { getPublishedGuides } from '@/lib/guide-content';
import { getProductMainImages } from '@/lib/product-helpers';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildSiteSearchIndex, getMatchingSiteItems, getTypeLabel } from '@/components/layout/site-search';
import PageBanner from '@/components/common/PageBanner';
import { buildBreadcrumbSchema } from '@/lib/structured-data';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams?: Promise<{ q?: string }>;
};

async function searchProducts(keyword: string) {
  if (!keyword) return [];

  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      isHiddenItem: false,
      showOnWebsite: true,
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { brand: { contains: keyword, mode: 'insensitive' } },
        { model: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      brand: true,
      model: true,
      seoSlug: true,
      description: true,
      category: {
        select: {
          name: true,
          parent: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 12,
  });

  const imageMap = await getProductMainImages(products.map((product) => product.id));

  return products.map((product) => ({
    ...product,
    imageUrl: imageMap.get(product.id) ?? null,
  }));
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [site, company] = await Promise.all([getRequestSiteContext(), getCompanyInfo()]);
  const params = (await searchParams) || {};
  const keyword = typeof params.q === 'string' ? params.q.trim() : '';
  const title = keyword ? `搜尋「${keyword}」｜${company.name}` : `全站搜尋｜${company.name}`;
  const description = '搜尋產品、服務、知識指南、工具與常用頁面。';
  const base = buildContentMetadata({
    site,
    pathname: '/search',
    title,
    description,
    siteName: company.name,
    type: 'website',
  });

  return {
    ...base,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const keyword = typeof params.q === 'string' ? params.q.trim() : '';
  const site = await getRequestSiteContext();
  const breadcrumbs = withHomeBreadcrumb('全站搜尋');
  const breadcrumbSchema = buildBreadcrumbSchema(toBreadcrumbSchemaItems(breadcrumbs, site.origin, '/search'));

  const [products, categories, guides] = await Promise.all([
    searchProducts(keyword),
    getCategoryTree(),
    getPublishedGuides(),
  ]);

  const staticResults = keyword
    ? getMatchingSiteItems(
        buildSiteSearchIndex(
          categories,
          guides.map((guide) => ({
            title: guide.title,
            slug: guide.slug,
            excerpt: guide.excerpt || '',
          })),
        ),
        keyword,
        18,
      )
    : [];

  const totalResults = products.length + staticResults.length;

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-slate-900">
      <JsonLdScript data={breadcrumbSchema} />
      <PageBanner
        title="全站搜尋"
        subtitle="一次找產品、服務、知識指南、工具與常用頁面。輸入型號、服務名稱或主題都可以。"
        breadcrumbs={breadcrumbs}
      />

      <section className="mx-auto max-w-5xl px-4 py-10 md:py-12">
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <form action="/search" method="get" className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" strokeWidth={2} />
              <input
                type="text"
                name="q"
                defaultValue={keyword}
                placeholder="搜尋產品型號、門禁、監視、總機、指南..."
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            <button type="submit" className="rounded-[1.2rem] bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
              搜尋
            </button>
          </form>

          {!keyword ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {['門禁系統', '監視器', '電話總機', '快速報價', '知識指南'].map((item) => (
                <Link
                  key={item}
                  href={`/search?q=${encodeURIComponent(item)}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                >
                  {item}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 text-sm text-slate-500">
              {totalResults > 0 ? `找到 ${totalResults} 筆相關結果` : `找不到與「${keyword}」相關的內容`}
            </div>
          )}
        </div>

        {!keyword ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">快速開始</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                { href: '/products', label: '產品目錄', description: '直接看型號、分類與設備' },
                { href: '/guides', label: '知識指南', description: '看採購與規劃文章' },
                { href: '/services/access-control', label: '門禁系統服務', description: '看門禁規劃與安裝服務' },
                { href: '/tools', label: '實用工具', description: '容量、焦距與快速諮詢工具' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-slate-300 hover:bg-white">
                  <div className="text-base font-bold text-slate-900">{item.label}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.description}</div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold tracking-[0.18em] text-slate-400">產品</div>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">產品結果</h2>
                </div>
                <Link href={keyword ? `/products?search=${encodeURIComponent(keyword)}` : '/products'} className="text-sm font-semibold text-efan-primary hover:underline">
                  查看完整產品搜尋
                </Link>
              </div>

              {products.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.seoSlug || product.id}`}
                      className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-slate-300">
                              NO IMAGE
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-base font-bold text-slate-900">{product.name}</div>
                              <div className="mt-1 text-sm text-slate-500">
                                {[product.brand, product.model].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500">
                              產品
                            </span>
                          </div>
                          {product.description ? <div className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</div> : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-500">
                  目前沒有找到對應產品，可以試試更短的型號、品牌或關鍵字。
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <div className="text-sm font-bold tracking-[0.18em] text-slate-400">站內內容</div>
                <h2 className="mt-1 text-2xl font-black text-slate-950">服務、指南與工具</h2>
              </div>

              {staticResults.length > 0 ? (
                <div className="space-y-3">
                  {staticResults.map((item) => (
                    <Link
                      key={`${item.type}-${item.href}`}
                      href={item.href}
                      className="flex items-start justify-between gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="min-w-0">
                        <div className="text-base font-bold text-slate-900">{item.label}</div>
                        {item.description ? <div className="mt-1 text-sm leading-6 text-slate-600">{item.description}</div> : null}
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500">
                        {getTypeLabel(item.type)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-500">
                  目前沒有找到對應內容，可以試試更接近主題的關鍵字，例如「門禁系統」、「監視器容量」、「電話總機」。
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
