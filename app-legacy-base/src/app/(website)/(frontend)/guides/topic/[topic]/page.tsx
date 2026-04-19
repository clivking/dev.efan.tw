import { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbTrail from '@/components/common/BreadcrumbTrail';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getCompanyInfo } from '@/lib/company';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getPublishedGuides } from '@/lib/guide-content';
import { GUIDE_CONTENT_TYPE_LABELS } from '@/lib/guide-schema';
import { getGuideTopicConfig, getGuideTopicKey } from '@/lib/guide-topics';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildBreadcrumbSchema } from '@/lib/structured-data';

type Props = {
  params: Promise<{ topic: string }>;
};

export const dynamic = 'force-dynamic';

function getFallbackTopicConfig(topic: string) {
  return {
    key: topic,
    label: topic,
    description: '此主題的採購文章、比較文與導入判斷。',
    accent: 'from-slate-200 to-slate-50 text-slate-900',
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const [site, company] = await Promise.all([getRequestSiteContext(), getCompanyInfo()]);
  const config = getGuideTopicConfig(topic) || getFallbackTopicConfig(topic);

  const title = `${config.label}指南與採購重點整理｜${company.name}`;
  const description = `整理 ${config.label} 的採購重點、規劃流程、比較文與 FAQ，協助企業在導入或升級前快速收斂方向。`;

  return buildContentMetadata({
    site,
    pathname: `/guides/topic/${config.key}`,
    title,
    description,
    siteName: company.name,
    type: 'website',
  });
}

export default async function GuideTopicPage({ params }: Props) {
  const { topic } = await params;
  const site = await getRequestSiteContext();
  const config = getGuideTopicConfig(topic) || getFallbackTopicConfig(topic);
  const guides = (await getPublishedGuides()).filter((guide) => getGuideTopicKey(guide.topic) === config.key);
  const featuredGuide = guides[0] || null;
  const breadcrumbs = withHomeBreadcrumb({ label: '知識指南', href: '/guides' }, config.label);
  const breadcrumbSchema = buildBreadcrumbSchema(toBreadcrumbSchemaItems(breadcrumbs, site.origin, `/guides/topic/${config.key}`));

  return (
    <div className="bg-[#f4f1ea] text-slate-900">
      <JsonLdScript data={breadcrumbSchema} />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <BreadcrumbTrail items={breadcrumbs} tone="light" />

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-end">
            <div>
              <div className={`inline-flex rounded-full bg-gradient-to-r px-4 py-2 text-xs font-bold tracking-[0.18em] ${config.accent}`}>
                TOPIC HUB
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{config.label}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                {config.description} 這一頁會集中顯示同主題的指南、比較文與後續可採取的下一步，讓採購與管理層可以快速收斂方向。
              </p>
            </div>

            <aside className="rounded-[2rem] border border-slate-200 bg-[#fcfbf8] p-6 shadow-sm">
              <div className="text-sm font-bold tracking-[0.18em] text-slate-400">本主題內容量</div>
              <div className="mt-4 text-3xl font-black text-slate-950">{guides.length}</div>
              <div className="mt-1 text-sm text-slate-500">已發布文章</div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/guides?topic=${config.key}`}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:border-slate-900"
                >
                  篩選這個主題
                </Link>
                <Link
                  href="/quote-request"
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
                >
                  詢問規劃建議
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        {featuredGuide ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              {featuredGuide.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featuredGuide.coverImage} alt={featuredGuide.title} className="h-72 w-full object-cover" />
              ) : (
                <div className="flex h-72 items-center justify-center bg-stone-100 text-sm font-bold text-slate-400">
                  {GUIDE_CONTENT_TYPE_LABELS[featuredGuide.contentType] || featuredGuide.contentType}
                </div>
              )}
              <div className="p-8">
                <div className="text-xs font-bold tracking-[0.16em] text-slate-400">
                  {GUIDE_CONTENT_TYPE_LABELS[featuredGuide.contentType] || featuredGuide.contentType}
                </div>
                <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950">
                  <Link href={`/guides/${featuredGuide.slug}`} className="hover:text-[#1d4ed8]">
                    {featuredGuide.title}
                  </Link>
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  {featuredGuide.excerpt || '這篇內容最適合當作主題入口閱讀。'}
                </p>
              </div>
            </article>

            <div className="space-y-4">
              {guides.slice(1, 5).map((guide) => (
                <article
                  key={guide.id}
                  className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="grid sm:grid-cols-[148px_minmax(0,1fr)]">
                    {guide.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={guide.coverImage} alt={guide.title} className="h-36 w-full object-cover sm:h-full" />
                    ) : (
                      <div className="flex h-36 items-center justify-center bg-stone-100 text-sm font-bold text-slate-400">
                        {GUIDE_CONTENT_TYPE_LABELS[guide.contentType] || guide.contentType}
                      </div>
                    )}
                    <div className="p-5">
                      <div className="text-xs font-bold tracking-[0.16em] text-slate-400">
                        {GUIDE_CONTENT_TYPE_LABELS[guide.contentType] || guide.contentType}
                      </div>
                      <h3 className="mt-3 text-xl font-black text-slate-950">
                        <Link href={`/guides/${guide.slug}`} className="hover:text-[#1d4ed8]">
                          {guide.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {guide.excerpt || '延伸閱讀這篇文章，補齊決策細節。'}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            這個主題目前還沒有已發布內容。
          </div>
        )}
      </section>
    </div>
  );
}
