import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getLocationEntity, getLocationFaqEntities } from '@/lib/content-entities';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildBreadcrumbSchema, buildFaqSchema } from '@/lib/structured-data';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSiteContext();
  const location = getLocationEntity('taipei-access-control');

  return buildContentMetadata({
    site,
    pathname: location?.href || '/locations/taipei-access-control',
    title: `${location?.name || '台北市門禁系統'}規劃、安裝與升級指南 | 一帆科技`,
    description:
      '台北市門禁系統如何規劃？整理商辦、診所、補教與社區入口常見的門禁安裝、權限管理、對講整合與升級重點，適合採購前先做需求盤點。',
    siteName: '一帆科技',
    type: 'website',
  });
}

export default async function TaipeiAccessControlPage() {
  const site = await getRequestSiteContext();
  const location = getLocationEntity('taipei-access-control');
  const faqItems = getLocationFaqEntities('taipei-access-control');
  const faqSchema = buildFaqSchema(faqItems);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '服務地區', item: `${site.origin}/locations` },
    { name: location?.name || '台北市門禁系統', item: `${site.origin}${location?.href || '/locations/taipei-access-control'}` },
  ]);

  const guideLinks = [
    { href: '/guides/2026-enterprise-access-control-guide', label: '企業門禁系統完整指南' },
    { href: '/guides/office-access-control-upgrade-guide', label: '辦公室門禁升級指南' },
    { href: '/guides/2026-access-control-tco-analysis', label: '門禁 TCO 採購分析' },
    { href: '/guides/access-control-system-how-to-choose', label: '門禁系統怎麼選' },
  ];

  return (
    <div className="bg-[#f4f1ea] text-slate-900">
      <JsonLdScript data={faqSchema} />
      <JsonLdScript data={breadcrumbSchema} />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_45%,#1e293b_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.18),transparent_24%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-20 lg:grid-cols-[minmax(0,1.05fr)_460px] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.22em] text-amber-200">
              TAIPEI ACCESS CONTROL
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              台北門禁系統規劃
              <br />
              <span className="text-amber-300">先看流程，再選設備</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              台北市商辦、診所、補教與社區入口的門禁需求差異很大。真正該先確認的不是讀卡機型號，而是門點角色、訪客流程、
              權限管理與未來擴充方式，這些條件才會決定系統是否好用。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quote-request" className="rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300">
                詢問台北門禁規劃
              </Link>
              <Link href="/services/access-control" className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15">
                看門禁服務
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl shadow-slate-950/20 backdrop-blur">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/portfolio/office-door-soyal-maglock.webp"
                alt="台北辦公室門禁系統安裝示意"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 460px, 100vw"
              />
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">常見場景</div>
                <div className="mt-2 text-sm leading-7 text-white">商辦、診所、補教、社區入口</div>
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">規劃重點</div>
                <div className="mt-2 text-sm leading-7 text-white">權限、訪客、對講、擴充</div>
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">適合對象</div>
                <div className="mt-2 text-sm leading-7 text-white">準備新裝或升級的台北場域</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: '老舊商辦與既有裝潢',
              body: '通常最先卡在門框、供電、既有配線與施工干擾，因此選型不能只看表面功能。',
            },
            {
              title: '訪客與櫃台流程',
              body: '若入口同時牽涉門口機、遠端開門與內部接待，門禁系統最好和對講流程一起規劃。',
            },
            {
              title: '人員流動與權限管理',
              body: '台北辦公場域流動快，權限異動、紀錄留存與未來新增門點是否方便，通常比單價更重要。',
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
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">TAIPEI SCENARIOS</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">台北最常見的 4 種門禁情境</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['商辦辦公室', '重點在員工權限、訪客接待、櫃台放行與門禁紀錄保存。'],
                ['診所與專業服務空間', '需要兼顧入口秩序、內外區隔與既有裝潢的施工限制。'],
                ['補教與教育場域', '常見需求是時段管理、教職員與學生動線分流，以及家長訪客處理。'],
                ['社區或半開放入口', '通常需要把門禁、對講、遠端開門與影像記錄一起考慮。'],
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
            <h2 className="mt-2 text-2xl font-black text-slate-950">台北門禁怎麼做最穩</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              先把門點角色、訪客流程、管理權限與未來擴充節奏講清楚，再回頭看刷卡、人臉或對講整合。對台北場域來說，
              施工限制與流程一致性通常比單一設備規格更重要。
            </p>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[2rem] border border-slate-200 bg-[#fcfbf8] p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">TAIPEI CHECKLIST</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">台北門禁規劃先看這 5 件事</h2>
            <ol className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
              <li>1. 門片材質、鎖具型式與既有供電能不能直接支援新設備。</li>
              <li>2. 是單純員工進出，還是同時有訪客、外包與共享權限需求。</li>
              <li>3. 需不需要和對講、監視、考勤或訪客流程整合。</li>
              <li>4. 施工是否會影響營運，能不能分時段或分區導入。</li>
              <li>5. 未來一年是否可能新增門點、樓層或遠端管理需求。</li>
            </ol>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">NEXT STEP</div>
            <h2 className="mt-2 text-2xl font-black">先看知識指南</h2>
            <div className="mt-5 space-y-3">
              {guideLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold transition hover:bg-white/10">
                  {item.label}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">COMMON MISTAKES</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">台北門禁採購最常犯的錯</h2>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>只比較讀卡機或人臉機價格，沒有先盤點門框、鎖具、供電與施工條件。</li>
              <li>把訪客放行、櫃台接待與員工權限拆成不同流程，後續管理變得很亂。</li>
              <li>低估人員流動與權限異動頻率，最後每次都靠人工補救。</li>
              <li>沒有預留新增門點與整合空間，半年後擴充時又重新施工。</li>
            </ul>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">IMPLEMENTATION</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">一個正常的導入順序</h2>
            <ol className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. 先看門點、門型、管線、供電與現場動線。</li>
              <li>2. 定義誰能進、什麼時間能進、訪客怎麼放行。</li>
              <li>3. 決定是否需要串接對講、監視、考勤或遠端管理。</li>
              <li>4. 再比較設備、控制架構、施工方式與維護成本。</li>
              <li>5. 上線前做權限測試、教育訓練與事件紀錄確認。</li>
            </ol>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FAQ</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">台北門禁系統常見問題</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
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
          <h2 className="mt-2 text-3xl font-black">台北場域下一步建議先看這些</h2>
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
