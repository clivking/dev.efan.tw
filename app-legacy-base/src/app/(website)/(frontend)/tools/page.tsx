import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLdScript from '@/components/common/JsonLdScript';
import BreadcrumbTrail from '@/components/common/BreadcrumbTrail';
import { getCompanyInfo } from '@/lib/company';
import { buildContentMetadata } from '@/lib/content-metadata';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/structured-data';
import { getRequestSiteContext } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const TOOLS = [
    {
        href: '/tools/cctv-storage-calculator',
        name: '監視器容量計算器',
        description: '快速估算 CCTV / NVR 需要多少硬碟容量，或反推現有硬碟大約能保存幾天。',
    },
    {
        href: '/tools/cctv-focal-length-calculator',
        name: '監視器焦距計算器',
        description: '快速判斷 CCTV 該選幾 mm 鏡頭、可拍多寬，以及 2.8mm、4mm、6mm、8mm 的常見差異。',
    },
    {
        href: '/tools/access-control-quick-consultation',
        name: '門禁快速諮詢',
        description: '輸入場域、門數、訪客與管理需求，快速判斷門禁該走哪種架構、開門方式與後續規劃重點。',
    },
];

export async function generateMetadata(): Promise<Metadata> {
    const [site, company] = await Promise.all([getRequestSiteContext(), getCompanyInfo()]);
    const title = `安防規劃實用工具：門禁、監視與容量試算｜${company.name}`;
    const description = '整理門禁、監視系統與弱電規劃常用工具，協助你在正式詢價前先試算容量、焦距、門數與需求方向。';

    return buildContentMetadata({
        site,
        pathname: '/tools',
        title,
        description,
        siteName: company.name,
        type: 'website',
    });
}

export default async function ToolsPage() {
    const site = await getRequestSiteContext();
    const breadcrumbs = withHomeBreadcrumb('實用工具');
    const breadcrumbSchema = buildBreadcrumbSchema(toBreadcrumbSchemaItems(breadcrumbs, site.origin, '/tools'));
    const collectionSchema = buildCollectionPageSchema({
        url: `${site.origin}/tools`,
        name: '一帆實用工具',
        description: '集中整理監視系統與弱電規劃常用的公開工具。',
        siteName: '一帆安全整合有限公司',
        siteUrl: site.origin,
        items: TOOLS.map((item) => ({
            url: `${site.origin}${item.href}`,
            name: item.name,
        })),
    });

    return (
        <div className="bg-[#f5f1e8] text-slate-950">
            <JsonLdScript data={breadcrumbSchema} />
            <JsonLdScript data={collectionSchema} />

            <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#172554_48%,#1e293b_100%)] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_26%)]" />
                <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
                    <div className="max-w-4xl">
                        <BreadcrumbTrail items={breadcrumbs} tone="dark" />
                        <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.24em] text-amber-200">
                            EFAN TOOLS
                        </div>
                        <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">實用工具</h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
                            把監視系統與弱電規劃常見的試算需求做成公開工具，讓你在正式詢價前先抓到容量、規格與預算方向。
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-14">
                <div className="grid gap-6 md:grid-cols-2">
                    {TOOLS.map((tool) => (
                        <article key={tool.href} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">TOOL</div>
                            <h2 className="mt-3 text-2xl font-black text-slate-950">{tool.name}</h2>
                            <p className="mt-4 text-sm leading-7 text-slate-600">{tool.description}</p>
                            <Link href={tool.href} className="mt-6 inline-flex rounded-full bg-[#1d4ed8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1e40af]">
                                立即使用
                            </Link>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
