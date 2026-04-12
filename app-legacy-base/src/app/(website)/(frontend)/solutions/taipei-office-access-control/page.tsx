import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getCompanyInfo } from '@/lib/company';
import { getSolutionFaqEntities } from '@/lib/content-entities';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqSchema } from '@/lib/structured-data';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSiteContext();
  const company = await getCompanyInfo();
  const title = `台北辦公室門禁系統規劃指南：安裝、升級與權限管理 | ${company.name}`;
  const description =
    '台北辦公室門禁系統怎麼規劃？整理商辦安裝、權限管理、訪客流程、門口機整合與升級重點，適合企業採購與更新前盤點。';

  return buildContentMetadata({
    site,
    pathname: '/solutions/taipei-office-access-control',
    title,
    description,
    siteName: company.name,
    type: 'article',
  });
}

export default async function TaipeiAccessControlPillarPage() {
  const site = await getRequestSiteContext();
  const company = await getCompanyInfo();
  const faqItems = getSolutionFaqEntities('taipei-office-access-control');
  const articleSchema = buildArticleSchema({
    url: `${site.origin}/solutions/taipei-office-access-control`,
    headline: '台北辦公室門禁系統規劃指南：安裝、升級與權限管理',
    description: '整理台北商辦門禁系統規劃、權限管理、訪客流程、門口機整合與升級重點。',
    authorName: company.name,
    publisherName: company.name,
    publisherLogoUrl: `${site.origin}${company.logoUrl}`,
    datePublished: '2025-06-01',
    dateModified: '2026-04-10',
    image: `${site.origin}/images/portfolio/yisheng-office-card-reader.webp`,
  });
  const faqSchema = buildFaqSchema(faqItems);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '解決方案', item: `${site.origin}/solutions` },
    { name: '台北辦公室門禁系統', item: `${site.origin}/solutions/taipei-office-access-control` },
  ]);

  const guideLinks = [
    { href: '/guides/office-access-control-upgrade-guide', label: '辦公室門禁升級指南' },
    { href: '/guides/2026-enterprise-access-control-guide', label: '企業門禁系統完整指南' },
    { href: '/guides/2026-access-control-tco-analysis', label: '門禁 TCO 採購分析' },
    { href: '/locations/taipei-access-control', label: '台北門禁系統 Location 頁' },
  ];

  return (
    <div className="bg-[#f4f1ea] text-slate-900">
      <JsonLdScript data={articleSchema} />
      <JsonLdScript data={faqSchema} />
      <JsonLdScript data={breadcrumbSchema} />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#0f172a_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.18),transparent_24%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-20 lg:grid-cols-[minmax(0,1.05fr)_460px] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.22em] text-amber-200">
              TAIPEI OFFICE ACCESS CONTROL
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              台北辦公室門禁系統
              <br />
              <span className="text-amber-300">重點是管理流程先成立</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              台北商辦門禁系統最常見的問題不是設備太差，而是權限管理、訪客流程、櫃台放行與既有裝潢限制沒有在第一輪一起定義。
              對辦公室來說，真正好用的門禁系統應該同時解決進出、記錄、權限異動與未來擴充。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quote-request" className="rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300">
                詢問台北辦公室門禁
              </Link>
              <Link href="/services/access-control" className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15">
                看門禁服務
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl shadow-slate-950/20 backdrop-blur">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/portfolio/yisheng-office-card-reader.webp"
                alt="台北辦公室門禁讀卡機安裝示意"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 460px, 100vw"
              />
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">常見場景</div>
                <div className="mt-2 text-sm leading-7 text-white">商辦、共享辦公、診所型辦公室</div>
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">規劃重點</div>
                <div className="mt-2 text-sm leading-7 text-white">權限、訪客、對講、擴充</div>
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">常見需求</div>
                <div className="mt-2 text-sm leading-7 text-white">升級、搬遷、重新配線、整合</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: '權限異動很頻繁',
              body: '台北辦公室人員流動快，若離職停權、跨部門權限與訪客放行仍靠人工，管理很快會失控。',
            },
            {
              title: '訪客與櫃台流程要一起看',
              body: '如果有外部來賓、快遞、外包與清潔人員，入口管理不能只靠一顆讀卡機解決。',
            },
            {
              title: '既有裝潢與施工限制',
              body: '很多商辦空間已完成裝修，門框、玻璃門、配線與供電都會直接影響施工方式。',
            },
          ].map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold tracking-[0.18em] text-slate-400">KEY POINT</div>
              <h2 className="mt-3 text-2xl font-black text-slate-950">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">TAIPEI OFFICE SCENARIOS</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">台北辦公室最常見的 4 種門禁情境</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['舊辦公室升級', '最常見的是原本只有感應卡或單機鎖具，現在需要補權限管理與訪客流程。'],
                ['新辦公室裝修同步導入', '最適合把門禁、對講、監視與網路配線一起整理，避免日後重工。'],
                ['共享或混合辦公', '權限時段、訪客與會議來賓處理會比一般辦公室更複雜。'],
                ['多部門與機房管制', '內部不是每扇門都該同一種規則，重要區域要獨立權限與記錄。'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl bg-stone-50 p-5">
                  <h3 className="text-lg font-black text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-[#fcfbf8] p-6 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">QUICK ANSWER</div>
            <h2 className="mt-2 text-2xl font-black text-slate-950">辦公室門禁先看什麼</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              先把員工、訪客、外包與櫃台角色定義清楚，再回頭選刷卡、人臉或對講整合。對台北商辦來說，流程一致性通常比單台設備更重要。
            </p>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-[#fcfbf8] p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">COMMON MISTAKES</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">台北辦公室最常踩的坑</h2>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>只看讀卡機或人臉機規格，沒有先看門框、玻璃門與電源條件。</li>
              <li>訪客放行與內部權限分開處理，最後櫃台與總務每天都在補救。</li>
              <li>沒預留新增門點、樓層或會議室的擴充空間，半年後又要追加施工。</li>
              <li>以為只有一個門點很簡單，卻忽略記錄、停權與加班時段管理。</li>
            </ul>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-[#fcfbf8] p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">IMPLEMENTATION</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">比較合理的導入順序</h2>
            <ol className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. 現場勘查門點、門型、既有線路、供電與裝潢限制。</li>
              <li>2. 定義員工、訪客、櫃台與管理者的角色與權限邏輯。</li>
              <li>3. 決定是否要串接對講、監視、考勤或遠端管理。</li>
              <li>4. 再比較控制架構、設備型式與未來維護成本。</li>
              <li>5. 上線前完成測試、教育訓練與事件記錄確認。</li>
            </ol>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FAQ</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">台北辦公室門禁常見問題</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((faq) => (
            <article key={faq.question} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">{faq.question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">RELATED READING</div>
          <h2 className="mt-2 text-3xl font-black">先看這些，再進場評估</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {guideLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold transition hover:bg-white/10">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
