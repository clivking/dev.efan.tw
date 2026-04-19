import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import BreadcrumbTrail from '@/components/common/BreadcrumbTrail';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getCompanyInfo } from '@/lib/company';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { getLocationEntity, getLocationFaqEntities } from '@/lib/content-entities';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildBreadcrumbSchema, buildFaqSchema } from '@/lib/structured-data';

export async function generateMetadata(): Promise<Metadata> {
  const [site, company] = await Promise.all([getRequestSiteContext(), getCompanyInfo()]);
  const location = getLocationEntity('taipei-pbx-system');

  return buildContentMetadata({
    site,
    pathname: location?.href || '/locations/taipei-pbx-system',
    title: `${location?.name || '台北電話總機系統'}規劃、汰換與升級指南｜${company.name}`,
    description:
      '台北電話總機系統怎麼規劃？整理企業分機架構、IP PBX、門口機整合、多據點與遠端辦公常見情境，適合更新前先做需求盤點。',
    siteName: company.name,
    type: 'website',
  });
}

export default async function TaipeiPBXSystemPage() {
  const site = await getRequestSiteContext();
  const location = getLocationEntity('taipei-pbx-system');
  const faqItems = getLocationFaqEntities('taipei-pbx-system');
  const faqSchema = buildFaqSchema(faqItems);
  const breadcrumbs = withHomeBreadcrumb('服務地區', location?.name || '台北電話總機系統');
  const breadcrumbSchema = buildBreadcrumbSchema(
    toBreadcrumbSchemaItems(breadcrumbs, site.origin, location?.href || '/locations/taipei-pbx-system'),
  );

  const guideLinks = [
    { href: '/guides/telecom-architecture-pbx-evaluation', label: '企業電話總機完整指南' },
    { href: '/guides/cloud-vs-onprem-pbx', label: '雲端總機 vs 傳統總機比較' },
  ];

  return (
    <div className="bg-[#f4f1ea] text-slate-900">
      <JsonLdScript data={faqSchema} />
      <JsonLdScript data={breadcrumbSchema} />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#052e16_0%,#0f766e_45%,#111827_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_24%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-20 lg:grid-cols-[minmax(0,1.05fr)_460px] lg:items-center">
          <div>
            <BreadcrumbTrail items={breadcrumbs} tone="dark" />
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.22em] text-emerald-200">
              TAIPEI PBX SYSTEM
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              台北電話總機規劃
              <br />
              <span className="text-emerald-300">重點是流程，不只是主機</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              台北企業在更新總機時，常見問題不是能不能打電話，而是櫃台接聽、部門轉接、門口機整合、遠端辦公與多據點管理是否能一起成立。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quote-request" className="rounded-full bg-emerald-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200">
                詢問台北總機規劃
              </Link>
              <Link href="/services/phone-system" className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15">
                看總機服務
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl shadow-slate-950/20 backdrop-blur">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/portfolio/feiteng-cloud-network-cabinet.webp"
                alt="台北企業電話總機與通訊機櫃示意"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 460px, 100vw"
              />
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">常見需求</div>
                <div className="mt-2 text-sm leading-7 text-white">櫃台轉接、客服分流、遠端辦公</div>
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">規劃重點</div>
                <div className="mt-2 text-sm leading-7 text-white">雲端、地端、SIP、門口機整合</div>
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.18em] text-slate-300">適合對象</div>
                <div className="mt-2 text-sm leading-7 text-white">準備汰換或整理分機流程的企業</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: '台北搬遷與重新佈線',
              body: '企業搬遷後最常出現的不是設備太舊，而是原本的分機、門口機與網路架構已經不符合新空間。',
            },
            {
              title: '櫃台、業務、客服需求不同',
              body: '真正好用的總機規劃，會把來電分流、群組、錄音與部門接手規則一起整理清楚。',
            },
            {
              title: '雲端與地端不是二選一',
              body: '很多台北企業更適合分階段汰換或混合架構，而不是直接整套推翻重做。',
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
            <h2 className="mt-2 text-3xl font-black text-slate-950">台北企業總機最常見的 4 種情境</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['舊總機難維修', '設備還能打，但分機邏輯混亂、零件難找、維護完全仰賴老做法。'],
                ['搬遷或裝修後重整', '新空間的網路與櫃台流程已改變，原本的總機配置不再適用。'],
                ['客服與業務混用', '最常見問題是來電沒有分流、轉接規則不清，造成接聽效率低。'],
                ['多據點或遠端辦公', '需要重新定義分機、號碼、錄音與跨點維護方式，不能只換一台主機。'],
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
            <h2 className="mt-2 text-2xl font-black text-slate-950">總機汰換先看什麼</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              先整理來電流程、分機角色、客服與櫃台規則，再決定用雲端、地端或混合式。對台北企業來說，
              真正昂貴的通常不是設備，而是切換時流程中斷與後續維護混亂。
            </p>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[2rem] border border-slate-200 bg-[#fcfbf8] p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">TAIPEI CHECKLIST</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">台北總機更新前先盤點這些</h2>
            <ol className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
              <li>1. 目前外線、分機、櫃台與部門轉接規則是否清楚。</li>
              <li>2. 是否需要錄音、IVR、客服排隊或多據點管理。</li>
              <li>3. 門口機、對講與總機是否需要互通。</li>
              <li>4. 網路、交換器、機櫃與供電條件是否足夠支撐新架構。</li>
              <li>5. 能否分階段切換，避免一次更換影響營運。</li>
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
            <h2 className="mt-2 text-3xl font-black text-slate-950">台北總機更新常見失誤</h2>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>只換主機，卻沒有一起整理外線、分機與部門接聽流程。</li>
              <li>把客服、櫃台與業務當成同一種使用情境，結果規則互相衝突。</li>
              <li>低估門口機、對講、錄音與網路品質對總機穩定性的影響。</li>
              <li>沒有設計分階段切換，導致正式汰換時通訊中斷風險過高。</li>
            </ul>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">IMPLEMENTATION</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">比較合理的導入順序</h2>
            <ol className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. 盤點外線、分機、部門與來電流向。</li>
              <li>2. 釐清是否要做錄音、排隊、IVR、門口機整合或跨點管理。</li>
              <li>3. 比較雲端、地端與混合架構的維護責任與切換方式。</li>
              <li>4. 確認網路、交換器、櫃台設備與通話終端是否能一起配合。</li>
              <li>5. 安排測試、教育訓練與正式切換窗口。</li>
            </ol>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FAQ</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">台北電話總機常見問題</h2>
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
          <h2 className="mt-2 text-3xl font-black">總機規劃前先看這些</h2>
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
