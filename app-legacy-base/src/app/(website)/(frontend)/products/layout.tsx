import { InquiryProvider } from '@/components/products/InquiryContext';

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <InquiryProvider>{children}</InquiryProvider>;
}
