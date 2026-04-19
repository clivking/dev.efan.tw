import type { Metadata } from 'next';
import CctvStorageCalculator from '@/components/tools/CctvStorageCalculator';
import JsonLdScript from '@/components/common/JsonLdScript';
import PageBanner from '@/components/common/PageBanner';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { buildBreadcrumbSchema, buildFaqSchema } from '@/lib/structured-data';
import { getRequestSiteContext } from '@/lib/site-url';
import { CCTV_CALCULATOR_FAQ_ITEMS } from '@/lib/cctv-calculator-content';

export const dynamic = 'force-dynamic';

function buildSoftwareApplicationSchema(origin: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: '監視器容量計算器',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: `${origin}/tools/cctv-storage-calculator`,
        description: '用於估算監視器錄影硬碟容量與保存天數的公開工具。',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'TWD',
        },
    };
}

export async function generateMetadata(): Promise<Metadata> {
    const site = await getRequestSiteContext();
    const canonical = `${site.origin}/tools/cctv-storage-calculator`;
    const title = '監視器容量計算器｜CCTV 硬碟容量與錄影天數試算｜一帆安全';
    const description = '輸入攝影機數量、解析度、FPS、H.264/H.265 與錄影天數，快速試算 CCTV / NVR 需要多少硬碟容量，或反推可保存多久。';

    return {
        title: { absolute: title },
        description,
        alternates: { canonical },
        openGraph: {
            title,
            description,
            url: canonical,
            type: 'website',
            locale: 'zh_TW',
            siteName: '一帆安全整合有限公司',
        },
    };
}

export default async function CctvStorageCalculatorPage() {
    const site = await getRequestSiteContext();
    const breadcrumbs = withHomeBreadcrumb({ label: '實用工具', href: '/tools' }, '監視器容量計算器');
    const breadcrumbSchema = buildBreadcrumbSchema(toBreadcrumbSchemaItems(breadcrumbs, site.origin, '/tools/cctv-storage-calculator'));
    const faqSchema = buildFaqSchema(CCTV_CALCULATOR_FAQ_ITEMS);
    const softwareSchema = buildSoftwareApplicationSchema(site.origin);

    return (
        <>
            <JsonLdScript data={breadcrumbSchema} />
            <JsonLdScript data={faqSchema} />
            <JsonLdScript data={softwareSchema} />
            <PageBanner title="監視器容量計算器" breadcrumbs={breadcrumbs} />
            <CctvStorageCalculator />
        </>
    );
}
