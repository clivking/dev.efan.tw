import { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbTrail from '@/components/common/BreadcrumbTrail';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getCompanyInfo } from '@/lib/company';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getPublishedGuides } from '@/lib/guide-content';
import { GUIDE_CONTENT_TYPE_LABELS } from '@/lib/guide-schema';
import { GUIDE_TOPIC_CONFIGS, getGuideTopicKey } from '@/lib/guide-topics';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildBreadcrumbSchema } from '@/lib/structured-data';

type Props = {
  searchParams?: Promise<{ topic?: string }>;
};

export const dynamic = 'force-dynamic';

function toTimestamp(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }
  return 0;
}

function formatDisplayDate(value: unknown) {
  if (value instanceof Date) return value.toLocaleDateString('zh-TW');
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('zh-TW');
    }
  }
  return '';
}

function formatGuideType(type: string) {
  return GUIDE_CONTENT_TYPE_LABELS[type] || type;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [site, company] = await Promise.all([getRequestSiteContext(), getCompanyInfo()]);
  const params = (await searchParams) || {};
  const activeTopic = GUIDE_TOPIC_CONFIGS.find((item) => item.key === params.topic) || null;
  const title = activeTopic ? `${activeTopic.label}指南與採購重點整理｜${company.name}` : `知識指南與採購判斷整理｜${company.name}`;
  const description = activeTopic
    ? `整理 ${activeTopic.label} 的採購重點、規劃流程、比較文與常見問題，協助企業在導入或升級前更快掌握評估方向。`
    : '集中整理門禁、對講、電話總機、監視與弱電整合的採購指南、比較文、案例與 FAQ。';

  return buildContentMetadata({
    site,
    pathname: activeTopic ? `/guides/topic/${activeTopic.key}` : '/guides',
    title,
    description,
    siteName: company.name,
    type: 'website',
  });
}

export default async function GuidesPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const [site, guides] = await Promise.all([getRequestSiteContext(), getPublishedGuides()]);
  const activeTopic = GUIDE_TOPIC_CONFIGS.find((item) => item.key === params.topic) || null;
  const breadcrumbs = activeTopic
    ? withHomeBreadcrumb({ label: '知識指南', href: '/guides' }, activeTopic.label)
    : withHomeBreadcrumb('知識指南');
  const breadcrumbSchema = buildBreadcrumbSchema(
    toBreadcrumbSchemaItems(breadcrumbs, site.origin, activeTopic ? `/guides/topic/${activeTopic.key}` : '/guides'),
  );

  const filteredGuides = activeTopic
    ? guides.filter((guide) => getGuideTopicKey(guide.topic) === activeTopic.key)
    : guides;

  const featuredGuide = filteredGuides[0] || null;
  const latestGuides = [...filteredGuides].sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)).slice(0, 6);
  const planningGuides = filteredGuides.filter((guide) => ['comparison', 'guide'].includes(guide.contentType)).slice(0, 4);

  const topicCounts = GUIDE_TOPIC_CONFIGS.map((topic) => ({
    ...topic,
    count: guides.filter((guide) => getGuideTopicKey(guide.topic) === topic.key).length,
  }));

  return (
    <div className="bg-[#f4f1ea] text-slate-900">
      <JsonLdScript data={breadcrumbSchema} />
      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#172554_45%,#1e293b_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.18),transparent_22%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="max-w-4xl">
            <div>
              <BreadcrumbTrail items={breadcrumbs} tone="dark" className="mb-6" />
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.24em] text-amber-200">
                EFAN RESOURCE CENTER
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
                {activeTopic ? `${activeTopic.label} 指南` : '讓企業放心做決策的知識指南'}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
                {activeTopic
                  ? `聚焦 ${activeTopic.label} 的採購風險、升級判斷、導入細節與常見問題，幫你在正式詢價前先釐清判斷基準。`
                  : '把門禁、對講、電話總機與弱電整合的採購知識，整理成可以直接拿去內部討論的判斷材料。不是堆資訊，而是幫客戶降低決策風險。'}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/quote-request"
                  className="rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
                >
                  取得規劃與報價
                </Link>
                <Link
                  href={activeTopic ? `/guides/topic/${activeTopic.key}` : '/services/access-control'}
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  {activeTopic ? '進入主題頁' : '先看服務項目'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/guides"
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              !activeTopic ? 'bg-slate-950 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-900'
            }`}
          >
            全部內容
          </Link>
          {topicCounts.map((topic) => (
            <Link
              key={topic.key}
              href={`/guides?topic=${topic.key}`}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                activeTopic?.key === topic.key
                  ? 'bg-[#1d4ed8] text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-900'
              }`}
            >
              {topic.label}
              <span className="ml-2 text-xs opacity-70">{topic.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">TOPICS</div>
            <h2 className="mt-2 text-2xl font-black text-slate-950">用主題快速切入</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            如果你已經知道問題在哪一類，直接進主題頁會更快。每個主題都會聚焦在企業實際採購與導入時最常遇到的判斷點。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {topicCounts.map((topic) => (
            <Link
              key={topic.key}
              href={`/guides/topic/${topic.key}`}
              className={`rounded-[1.75rem] border border-white/60 bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${topic.accent}`}
            >
              <div className="text-xs font-bold tracking-[0.18em] opacity-70">TOPIC</div>
              <div className="mt-3 text-xl font-black">{topic.label}</div>
              <p className="mt-2 text-sm leading-6 opacity-80">{topic.description}</p>
              <div className="mt-5 text-sm font-bold">{topic.count} 篇內容</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FEATURED</div>
              <h2 className="mt-2 text-2xl font-black text-slate-950">精選文章</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              先從最常被客戶拿來比較與內部討論的文章開始。這些內容比較接近實際決策場景，而不是單純 SEO 文章。
            </p>
          </div>

          {featuredGuide ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[#fcfbf8] shadow-sm">
                {featuredGuide.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featuredGuide.coverImage} alt={featuredGuide.title} className="h-72 w-full object-cover" />
                ) : (
                  <div className="flex h-72 items-center justify-center bg-slate-100 text-sm font-bold text-slate-400">
                    {formatGuideType(featuredGuide.contentType)}
                  </div>
                )}
                <div className="p-8">
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                    <span className="rounded-full bg-white px-3 py-1">{formatGuideType(featuredGuide.contentType)}</span>
                    {featuredGuide.topic ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{featuredGuide.topic}</span> : null}
                  </div>
                  <h3 className="mt-4 text-3xl font-black leading-tight text-slate-950">
                    <Link href={`/guides/${featuredGuide.slug}`} className="hover:text-[#1d4ed8]">
                      {featuredGuide.title}
                    </Link>
                  </h3>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    {featuredGuide.excerpt || '這篇內容整理了採購前最需要先搞懂的核心判斷，適合拿來當第一篇閱讀。'}
                  </p>
                  <Link href={`/guides/${featuredGuide.slug}`} className="mt-6 inline-flex font-bold text-[#1d4ed8] hover:underline">
                    閱讀完整內容
                  </Link>
                </div>
              </article>

              <div className="grid gap-4">
                {filteredGuides.slice(1, 4).map((guide) => (
                  <article
                    key={guide.id}
                    className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="grid sm:grid-cols-[168px_minmax(0,1fr)]">
                      {guide.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={guide.coverImage} alt={guide.title} className="h-40 w-full object-cover sm:h-full" />
                      ) : (
                        <div className="flex h-40 items-center justify-center bg-stone-100 text-sm font-bold text-slate-400">
                          {formatGuideType(guide.contentType)}
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                          <span className="rounded-full bg-stone-100 px-3 py-1">{formatGuideType(guide.contentType)}</span>
                          {guide.topic ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{guide.topic}</span> : null}
                        </div>
                        <h3 className="mt-4 text-xl font-black text-slate-950">
                          <Link href={`/guides/${guide.slug}`} className="hover:text-[#1d4ed8]">
                            {guide.title}
                          </Link>
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {guide.excerpt || '快速掌握這篇文章的比較重點、適用情境與下一步判斷。'}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <article className="rounded-[2rem] border border-dashed border-slate-300 bg-stone-50 p-8 text-slate-500">
              目前還沒有已發布內容。
            </article>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-6">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">LATEST</div>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{activeTopic ? `${activeTopic.label}最新文章` : '最新發布'}</h2>
          </div>
          <div className="space-y-4">
            {latestGuides.map((guide) => (
              <article key={guide.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>{formatDisplayDate(guide.updatedAt)}</span>
                  <span className="text-slate-300">/</span>
                  <span>{formatGuideType(guide.contentType)}</span>
                  {guide.topic ? (
                    <>
                      <span className="text-slate-300">/</span>
                      <span>{guide.topic}</span>
                    </>
                  ) : null}
                </div>
                <h3 className="mt-3 text-xl font-black text-slate-950">
                  <Link href={`/guides/${guide.slug}`} className="hover:text-[#1d4ed8]">
                    {guide.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {guide.excerpt || '文章重點、採購情境與導入判斷整理。'}
                </p>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">BUYING</div>
            <h2 className="mt-2 text-2xl font-black">採購前先看這些</h2>
            <div className="mt-5 space-y-4">
              {planningGuides.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.slug}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10"
                >
                  <div className="text-xs font-bold tracking-[0.16em] text-slate-400">{formatGuideType(guide.contentType)}</div>
                  <div className="mt-2 text-base font-bold leading-7 text-white">{guide.title}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">NEXT STEP</div>
            <h2 className="mt-2 text-2xl font-black text-slate-950">需要實際規劃？</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              如果你已經從文章找到方向，下一步通常不是再看更多內容，而是把需求整理成可估價、可施工、可管理的規格表。
            </p>
            <div className="mt-5 space-y-3">
              <Link href="/services/access-control" className="block rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-900 transition hover:border-slate-900">
                看服務項目
              </Link>
              <Link href="/products" className="block rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-900 transition hover:border-slate-900">
                看產品目錄
              </Link>
              <Link href="/quote-request" className="block rounded-2xl bg-amber-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-amber-300">
                直接詢價
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
