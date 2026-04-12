import type { Metadata } from 'next';
import { getRequestSiteContext } from '@/lib/site-url';
import { getCompanyInfo } from '@/lib/company';

export async function generateMetadata(): Promise<Metadata> {
    const site = await getRequestSiteContext();
    const company = await getCompanyInfo();
    const canonical = `${site.origin}/support/downloads`;
    const title = '系統與軟體下載';
    const description = '整理一帆安全整合提供的系統、軟體與操作文件下載資源。';

    return {
        title: { absolute: title },
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: company.name,
            type: 'website',
            locale: 'zh_TW',
        },
    };
}

export default function SupportDownloadsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
