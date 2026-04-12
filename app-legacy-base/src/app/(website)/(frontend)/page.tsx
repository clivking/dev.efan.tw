import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getCompanyInfo } from '@/lib/company';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getPage } from '@/lib/page-content';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildFaqSchema } from '@/lib/structured-data';
import HeroSection from '@/components/home/HeroSection';

export const revalidate = 3600;

// Below-the-fold components are lazy loaded to improve FCP/LCP
const ServicesSection = dynamic(() => import('@/components/home/ServicesSection'), {
  loading: () => <div className="min-h-[600px] bg-white animate-pulse" />,
});

const FeaturedProducts = dynamic(() => import('@/components/home/FeaturedProducts'), {
  loading: () => <div className="min-h-[400px] bg-white animate-pulse" />,
});

const FeaturesSection = dynamic(() => import('@/components/home/FeaturesSection'), {
  loading: () => <div className="min-h-[500px] bg-efan-primary-dark animate-pulse" />,
});

const CTABanner = dynamic(() => import('@/components/home/CTABanner'), {
  loading: () => <div className="min-h-[300px] bg-efan-accent animate-pulse" />,
});

const SEOCard = dynamic(() => import('@/components/home/SEOCard'), {
  loading: () => <div className="min-h-[200px]" />,
});

const FAQSection = dynamic(() => import('@/components/home/FAQSection'), {
  loading: () => <div className="min-h-[500px] bg-gray-50 animate-pulse" />,
});

const CraftsmanshipGallery = dynamic(() => import('@/components/home/CraftsmanshipGallery'), {
  loading: () => <div className="min-h-[400px] bg-gray-50 animate-pulse" />,
});

const ClientLogos = dynamic(() => import('@/components/home/ClientLogos'), {
  loading: () => <div className="min-h-[100px] bg-white" />,
});

export async function generateMetadata(): Promise<Metadata> {
  const [page, company, site] = await Promise.all([getPage('home'), getCompanyInfo(), getRequestSiteContext()]);

  return buildContentMetadata({
    site,
    pathname: '/',
    title: page?.seoTitle || `${company.name} | ${company.tagline}`,
    description: page?.seoDescription || page?.excerpt || company.tagline,
    siteName: company.name,
    ogImage: page?.ogImage,
    type: 'website',
  });
}

export default async function HomePage() {
  const company = await getCompanyInfo();
  const page = await getPage('home');

  const sections = (page?.sections || {}) as any;

  // Dynamic FAQ Schema from CMS
  const faqItems = sections.faq?.items || [
    { question: '門禁系統安裝大概要多久？', answer: '一般小型辦公室約 1 到 3 天可完成，實際時間會依現場配線、門點數量與施工條件調整。' },
    { question: '既有設備可以整合到新系統嗎？', answer: '可以，我們會先評估現場既有門禁、監視、對講或電話設備，再提供可沿用與需更新的建議。' },
    { question: '報價後多久可以安排施工？', answer: '通常確認規格與排程後即可安排，熱門時段會依專案大小與材料到貨時間微調。' },
    { question: '後續維護與保固怎麼處理？', answer: '我們提供安裝後的教學、保固與後續維護支援，若有遠端協助需求也可一併規劃。' },
    { question: '可以先到現場評估再報價嗎？', answer: '可以，若案件需要現場勘查，我們會先了解需求與環境，再提供更準確的規劃與報價。' },
  ];

  const faqSchema = buildFaqSchema(faqItems);

  return (
    <>
      <JsonLdScript data={faqSchema} />

      <>
        <HeroSection company={company} />

        <>
          <ClientLogos company={company} />
          <FeaturedProducts />
          <CraftsmanshipGallery />
          <ServicesSection />
          <FeaturesSection company={company} />
          <SEOCard />
          <CTABanner company={company} />
          <FAQSection faqItems={(faqSchema?.mainEntity as any[]) || []} />
        </>
      </>
    </>
  );
}
