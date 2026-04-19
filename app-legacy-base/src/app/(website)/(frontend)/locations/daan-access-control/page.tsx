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
  const location = getLocationEntity('daan-access-control');

  return buildContentMetadata({
    site,
    pathname: location?.href || '/locations/daan-access-control',
    title: `${location?.name || '大安區門禁系統'}規劃、安裝與升級指南｜${company.name}`,
    description:
      '大安區門禁系統怎麼規劃？整理商辦、診所、補習班與社區玄關常見的門禁安裝、訪客流程與對講整合重點，適合在地場域更新前盤點。',
    siteName: company.name,
    type: 'website',
  });
}

export default async function DaanAccessControlPage() {
  const site = await getRequestSiteContext();
  const location = getLocationEntity('daan-access-control');
  const faqItems = getLocationFaqEntities('daan-access-control');
  const faqSchema = buildFaqSchema(faqItems);
  const breadcrumbs = withHomeBreadcrumb('服務地區', location?.name || '大安區門禁系統');
  const breadcrumbSchema = buildBreadcrumbSchema(
    toBreadcrumbSchemaItems(breadcrumbs, site.origin, location?.href || '/locations/daan-access-control'),
  );

  return (
    <div className="bg-[#f4f1ea] text-slate-900">
      <JsonLdScript data={faqSchema} />
      <JsonLdScript data={breadcrumbSchema} />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-center">
          <div>
            <BreadcrumbTrail items={breadcrumbs} tone="light" />
            <div className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-bold tracking-[0.22em] text-white">
              DAAN ACCESS CONTROL
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              大安區門禁規劃
              <br />
              <span className="text-[#c65d21]">重點是空間條件與入口動線</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              大安區常見的是商辦、診所、補習班與狹長玄關空間。這類場域最常卡在門框、配線、訪客接待與既有裝潢，因此門禁規劃必須比一般空間更重視細節。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quote-request" className="rounded-full bg-[#c65d21] px-6 py-3 text-sm font-black text-white transition hover:bg-[#b14f17]">
                詢問大安門禁規劃
              </Link>
              <Link href="/guides/office-access-control-upgrade-guide" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-900 transition hover:border-slate-900">
                看升級指南
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-stone-50 shadow-sm">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/portfolio/wood-door-keypad-reader.webp"
                alt="大安區空間常見的門禁安裝示意"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 420px, 100vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            '老舊大樓與既有裝潢較多，施工干擾與美觀通常都要一起顧。',
            '診所、補教與專業服務空間常有訪客與內部人員混流，需要把入口角色先分清楚。',
            '大安區小型玄關常見門點有限，但權限與訪客流程反而更不能亂。',
          ].map((text, index) => (
            <article key={text} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold tracking-[0.18em] text-slate-400">POINT 0{index + 1}</div>
              <p className="mt-3 text-sm leading-7 text-slate-700">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">DAAN SCENARIOS</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">大安區常見的門禁場景</h2>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>診所與專業服務空間：重點在入口秩序、內外區隔與接待流程。</li>
              <li>補教與教育場域：重點在時段管理、教職員權限與家長訪客動線。</li>
              <li>小型商辦：重點在既有裝潢、門點有限但流程不能亂。</li>
              <li>住宅或半開放玄關：重點在門口機、對講與遠端放行是否要一起處理。</li>
            </ul>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-[#fcfbf8] p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">COMMON MISTAKES</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">大安區最常忽略的事</h2>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>只想把設備藏好看，卻忽略日後維修與權限調整不方便。</li>
              <li>覺得只有一個門點很簡單，結果訪客與內部人員流程互相干擾。</li>
              <li>把門禁和門口機分開處理，後續接待體驗變得零碎。</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">DAAN CHECKLIST</div>
          <h2 className="mt-2 text-3xl font-black">大安區現場最常先確認這些</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-200">
              門片材質、鎖具形式、牆面與配線是否能在不大幅破壞裝潢的情況下完成施工。
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-200">
              是否需要和門口機、遠端開門或監視紀錄一起處理，避免入口流程被拆成兩套系統。
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">IMPLEMENTATION</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">大安區比較穩的導入方式</h2>
          <ol className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
            <li>1. 先確認現場門框、電源、走線與裝潢限制。</li>
            <li>2. 把員工、訪客、臨時人員與管理者的角色先分清楚。</li>
            <li>3. 決定是否需要和門口機、遠端開門或監視一起規劃。</li>
            <li>4. 再比較設備型式與施工方式，不反過來做。</li>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FAQ</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">大安區門禁常見問題</h2>
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
        <div className="rounded-[2rem] border border-slate-200 bg-stone-50 p-8 shadow-sm">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">RELATED READING</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">延伸閱讀</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Link href="/guides/office-access-control-upgrade-guide" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold transition hover:border-slate-900">
              辦公室門禁升級指南
            </Link>
            <Link href="/guides/access-control-system-how-to-choose" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold transition hover:border-slate-900">
              門禁系統怎麼選
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
