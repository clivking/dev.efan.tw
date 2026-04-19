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
  const location = getLocationEntity('neihu-access-control');

  return buildContentMetadata({
    site,
    pathname: location?.href || '/locations/neihu-access-control',
    title: `${location?.name || '內湖區門禁系統'}規劃、安裝與升級指南｜${company.name}`,
    description:
      '內湖區門禁系統怎麼規劃？整理科技園區、多樓層辦公與企業總部常見的權限管理、訪客流程與門禁整合重點，適合企業更新前盤點。',
    siteName: company.name,
    type: 'website',
  });
}

export default async function NeihuAccessControlPage() {
  const site = await getRequestSiteContext();
  const location = getLocationEntity('neihu-access-control');
  const faqItems = getLocationFaqEntities('neihu-access-control');
  const faqSchema = buildFaqSchema(faqItems);
  const breadcrumbs = withHomeBreadcrumb('服務地區', location?.name || '內湖區門禁系統');
  const breadcrumbSchema = buildBreadcrumbSchema(
    toBreadcrumbSchemaItems(breadcrumbs, site.origin, location?.href || '/locations/neihu-access-control'),
  );

  return (
    <div className="bg-[#f4f1ea] text-slate-900">
      <JsonLdScript data={faqSchema} />
      <JsonLdScript data={breadcrumbSchema} />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#111827_0%,#1d4ed8_48%,#0f172a_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_22%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-center">
          <div>
            <BreadcrumbTrail items={breadcrumbs} tone="dark" />
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.22em] text-sky-200">
              NEIHU ENTERPRISE ACCESS
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
              內湖門禁規劃
              <br />
              <span className="text-sky-300">適合企業級權限與多門點管理</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              內湖常見的是科技園區、企業總部與多樓層辦公空間。這類場域最在意的不只是安全，而是跨部門權限、訪客流程、後續擴充與維運效率。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quote-request" className="rounded-full bg-sky-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200">
                詢問內湖門禁規劃
              </Link>
              <Link href="/guides/2026-enterprise-access-control-guide" className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15">
                看企業門禁指南
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl shadow-slate-950/20 backdrop-blur">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/portfolio/huanan-leasing-face-recognition.webp"
                alt="內湖企業門禁與人臉辨識示意"
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
            {
              title: '多部門權限',
              body: '內湖企業最常見的是部門、樓層與時段並存的權限需求，規劃時一定要先整理角色。',
            },
            {
              title: '訪客與總務流程',
              body: '若空間有櫃台、訪客報到與會議來訪，門禁最好和通知、放行與記錄一起處理。',
            },
            {
              title: '擴充與維護',
              body: '企業總部常在一年內新增門點或部門調整，架構若太死，後續成本會快速升高。',
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
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">NEIHU SCENARIOS</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">內湖企業最常見的門禁課題</h2>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>跨部門、多樓層與時段並存，權限規則很容易越長越亂。</li>
              <li>訪客、會議來賓與外包人員都需要不同入口與放行邏輯。</li>
              <li>企業總部常有一年內擴充門點或重新分區的需求。</li>
              <li>若同時有對講、監視與總務系統，整合能力比單門價格更重要。</li>
            </ul>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-[#fcfbf8] p-8 shadow-sm">
            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">COMMON MISTAKES</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">內湖企業最常踩的坑</h2>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <li>以為只要買高階辨識設備，就能解決權限流程本身的混亂。</li>
              <li>忽略 IT、總務、櫃台與管理層其實對門禁有不同需求。</li>
              <li>沒有把未來擴充與維運角色放進第一輪設計，後續成本快速升高。</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">NEIHU CHECKLIST</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">內湖企業規劃前常先盤點</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-stone-50 p-5 text-sm leading-7 text-slate-700">
              多門點、多樓層、跨部門與外包人員的權限分層是否需要集中管理。
            </div>
            <div className="rounded-2xl bg-stone-50 p-5 text-sm leading-7 text-slate-700">
              是否要和對講、監視、訪客報到或總務流程整合，避免未來再重拉一次系統。
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">IMPLEMENTATION</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">內湖企業比較合理的導入順序</h2>
          <ol className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
            <li>1. 盤點樓層、門點、部門角色與訪客流程。</li>
            <li>2. 整理權限邏輯與異動頻率，決定是否需要集中管理。</li>
            <li>3. 確認是否要串對講、監視、總務或報到流程。</li>
            <li>4. 再看刷卡、人臉、手機與控制架構是否匹配。</li>
            <li>5. 預留未來新增門點與跨系統維護的空間。</li>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6">
          <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FAQ</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">內湖門禁常見問題</h2>
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
            <Link href="/guides/2026-enterprise-access-control-guide" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold transition hover:border-slate-900">
              企業門禁系統完整指南
            </Link>
            <Link href="/guides/2026-access-control-tco-analysis" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold transition hover:border-slate-900">
              門禁 TCO 採購分析
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
