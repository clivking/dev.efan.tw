import type { Metadata } from 'next';
import CctvFocalLengthCalculator from '@/components/tools/CctvFocalLengthCalculator';
import JsonLdScript from '@/components/common/JsonLdScript';
import PageBanner from '@/components/common/PageBanner';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqSchema, buildHowToSchema } from '@/lib/structured-data';
import { getRequestSiteContext } from '@/lib/site-url';
import { CCTV_FOCAL_FAQ_ITEMS, CCTV_FOCAL_HOW_TO_STEPS } from '@/lib/cctv-focal-content';

export const dynamic = 'force-dynamic';

function buildSoftwareApplicationSchema(origin: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: '監視器焦距計算器',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: `${origin}/tools/cctv-focal-length-calculator`,
        description: '用於估算 CCTV 鏡頭焦距、可視寬度與常見 2.8mm、4mm、6mm、8mm 建議的公開工具。',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'TWD',
        },
    };
}

export async function generateMetadata(): Promise<Metadata> {
    const site = await getRequestSiteContext();
    const canonical = `${site.origin}/tools/cctv-focal-length-calculator`;
    const title = '監視器焦距計算器｜CCTV 幾 mm 鏡頭怎麼選｜一帆安全';
    const description =
        '輸入安裝距離、想拍多寬或鏡頭焦距，快速試算監視器該選幾 mm、可拍多寬與水平視角。適合台北商辦、店面、工廠與社區 CCTV 規劃。';

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

export default async function CctvFocalLengthCalculatorPage() {
    const site = await getRequestSiteContext();
    const url = `${site.origin}/tools/cctv-focal-length-calculator`;
    const breadcrumbs = withHomeBreadcrumb({ label: '實用工具', href: '/tools' }, '監視器焦距計算器');
    const breadcrumbSchema = buildBreadcrumbSchema(toBreadcrumbSchemaItems(breadcrumbs, site.origin, '/tools/cctv-focal-length-calculator'));
    const faqSchema = buildFaqSchema(CCTV_FOCAL_FAQ_ITEMS);
    const softwareSchema = buildSoftwareApplicationSchema(site.origin);
    const howToSchema = buildHowToSchema({
        url,
        name: '監視器焦距怎麼估',
        description: '先量距離，再確認想拍多寬，最後比對常見鏡頭焦距。',
        steps: CCTV_FOCAL_HOW_TO_STEPS.map((step) => ({
            ...step,
            url,
        })),
        totalTime: 'PT3M',
    });
    const articleSchema = buildArticleSchema({
        url,
        headline: '監視器焦距計算器',
        description: '回答 CCTV 幾 mm 鏡頭怎麼選、在不同距離下能拍多寬，以及台北商辦店面常見焦距判斷方式。',
        authorName: '一帆安全整合有限公司',
        publisherName: '一帆安全整合有限公司',
        publisherLogoUrl: `${site.origin}/images/logo.png`,
        speakableCssSelectors: ['#ai-summary', '#quick-answer'],
    });

    return (
        <>
            <JsonLdScript data={breadcrumbSchema} />
            <JsonLdScript data={faqSchema} />
            <JsonLdScript data={softwareSchema} />
            <JsonLdScript data={howToSchema} />
            <JsonLdScript data={articleSchema} />
            <PageBanner
                title="監視器焦距計算器"
                subtitle="快速判斷幾 mm 鏡頭比較適合"
                breadcrumbs={breadcrumbs}
            />
            <CctvFocalLengthCalculator />
        </>
    );
}
