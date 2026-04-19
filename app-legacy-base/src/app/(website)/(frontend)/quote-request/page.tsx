import { Metadata } from 'next';
import { getCompanyInfo } from '@/lib/company';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getRequestSiteContext } from '@/lib/site-url';
import QuoteRequestClient from './QuoteRequestClient';

export async function generateMetadata(): Promise<Metadata> {
    const [company, site] = await Promise.all([getCompanyInfo(), getRequestSiteContext()]);
    const title = '快速報價諮詢';
    const description = `${company.name.replace('有限公司', '')}線上報價諮詢。門禁、監視、電話、考勤、網路設備，一分鐘填寫需求，${company.yearsInBusiness} 年經驗專業團隊為您服務。`;

    return buildContentMetadata({
        site,
        pathname: '/quote-request',
        title,
        description,
        siteName: company.name,
        type: 'website',
    });
}

export default function QuoteRequestPage() {
    return <QuoteRequestClient />;
}
