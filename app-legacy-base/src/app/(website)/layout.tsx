import type { Metadata } from 'next';
import { getCompanyInfo } from '@/lib/company';
import { Toaster } from 'sonner';
import { getRequestSiteContext } from '@/lib/site-url';
import JsonLdScript from '@/components/common/JsonLdScript';
import DelayedGoogleAnalytics from '@/components/analytics/DelayedGoogleAnalytics';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/structured-data';
import '../website.css';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanyInfo();
  const site = await getRequestSiteContext();
  const indexableRobots: Metadata['robots'] = {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  };
  return {
    metadataBase: new URL(site.origin),
    title: { 
      default: `${company.name} | 40年門禁專家`, 
      template: `%s${company.siteTitleSuffix}` 
    },
    description: company.tagline,
    robots: site.isIndexable ? indexableRobots : { index: false, follow: false, noarchive: true, nosnippet: true },
    icons: {
      icon: company.faviconUrl || '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
  };
}

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const company = await getCompanyInfo();
  const site = await getRequestSiteContext();
  const baseUrl = site.origin;
  const organizationSchema = buildOrganizationSchema(company, baseUrl, {
    sameAs: ['https://maps.app.goo.gl/jw2CRLxTe3uNwbMi8'],
  });
  const webSiteSchema = buildWebSiteSchema({ name: company.name, url: baseUrl });

  return (
    <>
      <JsonLdScript data={organizationSchema} />
      <JsonLdScript data={webSiteSchema} />
      <div className='antialiased font-sans'>
        {children}
        <Toaster position="top-center" />
      </div>
      {company.ga4Id && (
        <DelayedGoogleAnalytics gaId={company.ga4Id} />
      )}
    </>
  );
}
