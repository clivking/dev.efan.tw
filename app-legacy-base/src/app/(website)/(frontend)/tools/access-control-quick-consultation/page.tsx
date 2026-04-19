import type { Metadata } from 'next';
import AccessControlQuickConsultation from '@/components/tools/AccessControlQuickConsultation';
import JsonLdScript from '@/components/common/JsonLdScript';
import PageBanner from '@/components/common/PageBanner';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import {
    buildArticleSchema,
    buildBreadcrumbSchema,
    buildFaqSchema,
    buildHowToSchema,
} from '@/lib/structured-data';
import { getRequestSiteContext } from '@/lib/site-url';
import {
    ACCESS_CONTROL_QUICK_CONSULTATION_FAQ_ITEMS,
    ACCESS_CONTROL_QUICK_CONSULTATION_HOW_TO_STEPS,
} from '@/lib/access-control-quick-consultation-content';

export const dynamic = 'force-dynamic';

function buildSoftwareApplicationSchema(origin: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: '門禁快速諮詢',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: `${origin}/tools/access-control-quick-consultation`,
        description:
            '用於快速判斷門禁系統架構、開門方式、訪客流程與遠端管理需求的公開工具，可延伸接工程師規劃與後續 AI 報價摘要。',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'TWD',
        },
    };
}

export async function generateMetadata(): Promise<Metadata> {
    const site = await getRequestSiteContext();
    const canonical = `${site.origin}/tools/access-control-quick-consultation`;
    const title = '門禁快速諮詢｜3 分鐘判斷門禁規劃方向｜一帆安全';
    const description =
        '輸入場域、門數、訪客與管理需求，快速判斷門禁該用哪種架構、開門方式與規劃重點。適合台北辦公室、診所、店面與社區。';

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

export default async function AccessControlQuickConsultationPage() {
    const site = await getRequestSiteContext();
    const url = `${site.origin}/tools/access-control-quick-consultation`;
    const breadcrumbs = withHomeBreadcrumb({ label: '實用工具', href: '/tools' }, '門禁快速諮詢');
    const breadcrumbSchema = buildBreadcrumbSchema(toBreadcrumbSchemaItems(breadcrumbs, site.origin, '/tools/access-control-quick-consultation'));
    const faqSchema = buildFaqSchema(ACCESS_CONTROL_QUICK_CONSULTATION_FAQ_ITEMS);
    const softwareSchema = buildSoftwareApplicationSchema(site.origin);
    const howToSchema = buildHowToSchema({
        url,
        name: '門禁快速諮詢怎麼用',
        description: '先回答幾題，先拿到門禁規劃方向，再決定要不要送出施工資料。',
        steps: ACCESS_CONTROL_QUICK_CONSULTATION_HOW_TO_STEPS.map((step) => ({
            ...step,
            url,
        })),
        totalTime: 'PT3M',
    });
    const articleSchema = buildArticleSchema({
        url,
        headline: '門禁快速諮詢',
        description:
            '回答台北辦公室、診所、店面與社區最常見的門禁規劃問題，先判斷控制器架構、開門方式與訪客流程，再決定是否交給工程師細化。',
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
                title="門禁快速諮詢"
                subtitle="先判斷方向，再決定要不要送出施工資料"
                breadcrumbs={breadcrumbs}
            />
            <AccessControlQuickConsultation />
        </>
    );
}
