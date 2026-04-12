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
  const title = `台北辦公室監視系統規劃指南：防死角、錄影與維護 | ${company.name}`;
  const description =
    '台北辦公室監視系統怎麼規劃？整理防死角配置、錄影保存、NVR 架構、夜間環境與合規重點，適合新裝與汰換前盤點。';

  return buildContentMetadata({
    site,
    pathname: '/solutions/taipei-cctv-system',
    title,
    description,
    siteName: company.name,
    type: 'article',
  });
}

export default async function TaipeiCCTVPillarPage() {
  const site = await getRequestSiteContext();
  const company = await getCompanyInfo();
  const faqItems = getSolutionFaqEntities('taipei-cctv-system');
  const articleSchema = buildArticleSchema({
    url: `${site.origin}/solutions/taipei-cctv-system`,
    headline: '台北辦公室監視系統規劃指南：防死角、錄影與維護',
    description: '整理台北商辦監視器規劃重點，包含防死角配置、NVR、錄影保存、夜間環境與合規。',
    authorName: company.name,
    publisherName: company.name,
    publisherLogoUrl: `${site.origin}${company.logoUrl}`,
    datePublished: '2025-06-01',
    dateModified: '2026-04-10',
    image: `${site.origin}/images/portfolio/weshaire-ai-face-recognition.webp`,
  });
  const faqSchema = buildFaqSchema(faqItems);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '解決方案', item: `${site.origin}/solutions` },
    { name: '台北辦公室監視系統', item: `${site.origin}/solutions/taipei-cctv-system` },
  ]);

  const guideLinks = [
    { href: '/guides/cctv-system-planning-guide', label: '企業監視系統規劃指南' },
    { href: '/guides/security-nda-compliance-guide', label: '安防合規完整指南' },
    { href: '/locations/taipei-access-control', label: '台北門禁系統 Location 頁' },
  ];

  return (
    <div className="bg-[#f4f1ea] text-slate-900">
      <JsonLdScript data={articleSchema} />
      <JsonLdScript data={faqSchema} />
      <JsonLdScript data={breadcrumbSchema} />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#111827_0%,#312e81_44%,#0f172a_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(192,132,252,0.16),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.16),transparent_24%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-20 lg:grid-cols-[minmax(0,1.05fr)_460px] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.22em] text-violet-200">
              TAIPEI OFFICE CCTV
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              台北辦公室監視系統
              <br />
              <span className="text-violet-300">先解決死角，再談規格</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              台北辦公室監視系統規劃的核心不是鏡頭越多越好，而是畫面可用、事件可追、保存可控，並且在夜間、逆光與多樓層環境下仍然能穩定運作。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quote-request" className="rounded-full bg-violet-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-violet-200">
                詢問台北監視規劃
              </Link>
              <Link href="/services/cctv" className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15">
                看監視服務
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl shadow-slate-950/20 backdrop-blur">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/portfolio/weshaire-ai-face-recognition.webp"
                alt="台北辦公室監視與辨識系統示意"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 460px, 100vw"
              />
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">常見場景</div>
                <div className="mt-2 text-sm leading-7 text-white">商辦、櫃台、走道、倉儲區</div>
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">規劃重點</div>
                <div className="mt-2 text-sm leading-7 text-white">死角、錄影、調閱、維護</div>
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">常見需求</div>
                <div className="mt-2 text-sm leading-7 text-white">新裝、汰換、NVR、保存天數</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: '死角與逆光',
              body: '台北商辦常見玻璃隔間、櫃台逆光與夜間照明不足，這些條件比單純畫素更影響畫面可用性。',
            },
            {
              title: '錄影保存與調閱',
              body: '真正影響管理的通常是錄影保存天數、調閱速度、權限分層與事件回查流程。',
            },
            {
              title: '弱電整合',
              body: '若已經有門禁、對講或告警需求，監視系統最好一開始就一起設計，不要獨立成孤島。',
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
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">TAIPEI CCTV SCENARIOS</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">台北辦公室最常見的監視需求</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['入口與櫃台留證', '重點在來客辨識、爭議回查與逆光場景仍能看清楚。'],
                ['走道與公共區域', '重點在動線完整、事件時間軸與跨區域調閱效率。'],
                ['倉儲或設備區', '重點在夜間、低照度與長時間保存的穩定性。'],
                ['多樓層或多據點', '重點在集中管理、權限分層與維護責任。'],
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
            <h2 className="mt-2 text-2xl font-black text-slate-950">監視系統先看什麼</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              先定義要看清楚什麼、要留多久、誰要調閱，再決定鏡頭位置、主機與網路架構。對辦公室來說，可調閱性通常比規格表更重要。
            </p>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-[#fcfbf8] p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">COMMON MISTAKES</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">台北辦公室監視最常踩的坑</h2>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>只追求畫素與鏡頭數量，卻沒有先定義每支鏡頭的任務。</li>
              <li>沒先算保存天數與調閱需求，硬碟容量很快不夠用。</li>
              <li>忽略夜間照明、玻璃反射與逆光，發生事件時畫面無法使用。</li>
              <li>把監視系統當成獨立設備，沒有納入門禁與整體弱電規劃。</li>
            </ul>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-[#fcfbf8] p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">IMPLEMENTATION</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">比較合理的導入順序</h2>
            <ol className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. 先定義監視目的，是辨識、留證、管理還是追查。</li>
              <li>2. 列出門點、櫃台、走道、倉儲與設備區的鏡頭任務。</li>
              <li>3. 確認錄影保存天數、調閱角色與權限分層。</li>
              <li>4. 再看 NVR、PoE、交換器、UPS 與網路架構。</li>
              <li>5. 規劃是否要和門禁、對講或告警流程整合。</li>
            </ol>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FAQ</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">台北辦公室監視常見問題</h2>
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
          <h2 className="mt-2 text-3xl font-black">監視規劃前先看這些</h2>
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
