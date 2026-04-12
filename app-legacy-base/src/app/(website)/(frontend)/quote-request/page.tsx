import { Metadata } from 'next';
import { getCompanyInfo } from '@/lib/company';
import QuoteRequestClient from './QuoteRequestClient';

export async function generateMetadata(): Promise<Metadata> {
    const company = await getCompanyInfo();
    return {
        title: `快速報價諮詢`,
        description: `${company.name.replace('有限公司', '')}線上報價諮詢。門禁、監視、電話、考勤、網路設備，一分鐘填寫需求，${company.yearsInBusiness} 年經驗專業團隊為您服務。`,
        alternates: {
            canonical: 'https://dev.efan.tw/quote-request',
        },
    };
}

export default function QuoteRequestPage() {
    return <QuoteRequestClient />;
}
