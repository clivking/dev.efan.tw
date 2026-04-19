import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { QuoteStatusPage } from './components/QuoteStatusPage';
import { ViewTracker } from './components/ViewTracker';
import PublicQuoteClient from './components/PublicQuoteClient';
import { getRequestSiteContext } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

async function getQuoteData(token: string) {
    const site = await getRequestSiteContext();
    const baseUrl = site.origin;
    const res = await fetch(`${baseUrl}/api/public/q/${token}`, {
        cache: 'no-store'
    });

    if (!res.ok) {
        if (res.status === 404) return { error: 'not_found' };
        if (res.status === 410) {
            const data = await res.json().catch(() => ({}));
            return { error: data.error || 'expired' };
        }
        if (res.status === 403) return { error: 'not_ready' };
        return { error: 'not_found' };
    }

    return res.json();
}

export async function generateMetadata(
    { params }: { params: Promise<{ token: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { token } = await params;
    const data = await getQuoteData(token);
    
    if (data.error || !data.quote) {
        return {
            title: '報價單',
        }
    }
    
    const title = data.quote.pageTitle || data.quote.name || `報價單 - ${data.quote.quoteNumber}`;
    const contactName = data.quote.customer?.contactName ? `${data.quote.customer.contactName} ` : '';
    const quoteTitle = data.quote.name || `報價單`;
    const description = `${contactName}您好，此為「${quoteTitle}」電子報價單，可於此查看內容、確認細節並完成簽署。`;
    
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: '一帆安全整合',
        }
    }
}

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const data = await getQuoteData(token);

    if (data.error) {
        const dummyCompany = {
            name: '一帆安全整合有限公司',
            phone: '02-7730-1158',
            email: 'safekings@gmail.com',
            address: '台北市大安區四維路14巷15號7樓之1',
            logoUrl: '/images/logo.png',
        };
        return <QuoteStatusPage type={data.error as any} companyInfo={data.company || dummyCompany} />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-0 md:p-4" style={{ backgroundColor: '#f0f2f5' }}>
            <ViewTracker token={token} />
            <PublicQuoteClient token={token} initialData={data} />
        </div>
    );
}
