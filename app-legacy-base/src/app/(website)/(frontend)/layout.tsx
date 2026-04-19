import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientFeatures from './ClientFeatures';
import { getCompanyInfo } from '@/lib/company';
import { getCategoryTree } from '@/lib/category-tree';
import { InquiryProvider } from '@/components/products/InquiryContext';

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [company, categories] = await Promise.all([
    getCompanyInfo(),
    getCategoryTree(),
  ]);

  return (
    <InquiryProvider>
      <Header company={company} categories={categories} />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer company={company} />
      <ClientFeatures />
    </InquiryProvider>
  );
}
