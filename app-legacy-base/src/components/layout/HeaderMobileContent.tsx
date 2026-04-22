'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calculator, Download, Lock, PlayCircle, Search } from 'lucide-react';
import { SERVICES } from '@/lib/constants';
import type { CategoryTree } from '@/lib/category-tree';
import type { CompanyInfo } from '@/lib/company';

type ResourceLink = {
  href: string;
  label: string;
  note?: string;
  badge?: string;
};

const GUIDE_LINKS: ResourceLink[] = [
  { href: '/guides/access-control-system-pricing', label: '門禁系統價格怎麼算', note: '先抓預算區間，再看施工與維護成本。', badge: 'NEW' },
  { href: '/guides/2026-access-control-tco-analysis', label: '2026 門禁 TCO 採購分析', note: '從五年總成本角度看門禁投資。', badge: 'HOT' },
  { href: '/guides/office-access-control-upgrade-guide', label: '辦公室門禁升級指引', note: '適合評估舊系統該修還是該換。' },
  { href: '/guides/intercom-upgrade-comparison', label: '對講機升級評比', note: '整理對講、門口機與升級差異。' },
  { href: '/guides/cloud-vs-onprem-pbx', label: '雲端與實體總機差異', note: '通訊架構、管理與成本比較。' },
];

interface Props {
  company?: CompanyInfo | null;
  categories?: CategoryTree[];
}

export default function HeaderMobileContent({ company: _company, categories = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsMenuOpen(false);
    setMobileProductsOpen(false);
    setMobileResourcesOpen(false);
    setMobileExpandedCat(null);
  }, [pathname]);

  const submitSearch = (event?: FormEvent) => {
    event?.preventDefault();
    const keyword = searchQuery.trim();
    router.push(keyword ? `/search?q=${encodeURIComponent(keyword)}` : '/search');
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Hamburger button */}
      <div className="flex items-center md:hidden">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-gray-700 focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel — rendered outside the justify-between row via CSS order */}
      <div
        className={`overflow-hidden border-b border-gray-100 bg-white transition-all duration-300 md:hidden w-full order-last ${
          isMenuOpen ? 'max-h-[100vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ flexBasis: '100%' }}
      >
        <div className="space-y-1 px-4 pt-2 pb-6">
          <div className="pt-1">
            <div className="mb-2 border-b border-gray-50 py-2 font-bold text-efan-primary">全站搜尋</div>
            <form onSubmit={submitSearch} className="flex gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2">
              <div className="flex items-center pl-2 text-gray-400">
                <Search className="h-4 w-4" strokeWidth={2.2} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜尋產品、服務、指南"
                className="w-full bg-transparent py-2 text-sm outline-none"
              />
              <button type="submit" className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-efan-primary">
                前往
              </button>
            </form>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
              className="mb-2 flex w-full items-center justify-between border-b border-gray-50 py-2 font-bold text-efan-primary"
            >
              <span>產品目錄</span>
              <svg className={`h-4 w-4 transition-transform ${mobileProductsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileProductsOpen && (
              <div className="space-y-1 pl-2">
                {categories.map((category) => (
                  <div key={category.id}>
                    {category.children.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setMobileExpandedCat(mobileExpandedCat === category.id ? null : category.id)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <span>{category.displayName}</span>
                          <svg className={`h-3 w-3 transition-transform ${mobileExpandedCat === category.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {mobileExpandedCat === category.id && (
                          <div className="space-y-0.5 pl-4">
                            <Link href={`/products/category/${category.slug}`} onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-efan-accent hover:bg-gray-50">
                              查看 {category.displayName}
                            </Link>
                            {category.children.map((child) => (
                              <Link key={child.id} href={`/products/category/${child.slug}`} onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link href={`/products/category/${category.slug}`} onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2.5 font-medium text-gray-700 hover:bg-gray-50">
                        {category.displayName}
                      </Link>
                    )}
                  </div>
                ))}
                <Link href="/products" onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-efan-accent hover:bg-gray-50">
                  查看全部產品
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4">
            <div className="mb-2 border-b border-gray-50 py-2 font-bold text-efan-primary">服務項目</div>
            {SERVICES.map((service) => (
              <Link key={service.id} href={service.href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-50">
                <span className="text-xl">{service.icon}</span>
                <span className="font-medium text-gray-700">{service.name}</span>
              </Link>
            ))}
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
              className="mb-2 flex w-full items-center justify-between border-b border-gray-50 py-2 font-bold text-efan-primary"
            >
              <span>資源中心</span>
              <svg className={`h-4 w-4 transition-transform ${mobileResourcesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileResourcesOpen && (
              <div className="space-y-4">
                <div>
                  <div className="px-3 py-2 text-sm font-bold text-gray-800">知識指南</div>
                  <Link href="/guides" onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2.5 font-medium text-efan-accent hover:bg-gray-50">
                    查看全部知識指南
                  </Link>
                  {GUIDE_LINKS.slice(0, 4).map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div>
                  <div className="px-3 py-2 text-sm font-bold text-gray-800">技術支援</div>
                  <Link href="/tools/cctv-storage-calculator" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-50">
                    <Calculator className="h-5 w-5 text-efan-primary" strokeWidth={1.8} />
                    <span className="font-medium text-gray-700">監視器容量計算</span>
                  </Link>
                  <Link href="/tools/cctv-focal-length-calculator" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-50">
                    <Calculator className="h-5 w-5 text-efan-primary" strokeWidth={1.8} />
                    <span className="font-medium text-gray-700">監視器焦距計算</span>
                  </Link>
                  <Link href="/tools/access-control-quick-consultation" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-50">
                    <Calculator className="h-5 w-5 text-efan-primary" strokeWidth={1.8} />
                    <span className="font-medium text-gray-700">門禁快速諮詢</span>
                  </Link>
                  <Link href="/support/downloads" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-50">
                    <Download className="h-5 w-5 text-efan-primary" strokeWidth={1.8} />
                    <span className="font-medium text-gray-700">軟體下載</span>
                  </Link>
                  <Link href="/portal" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-50">
                    <PlayCircle className="h-5 w-5 text-efan-primary" strokeWidth={1.8} />
                    <span className="font-medium text-gray-700">
                      教學專區 <Lock className="inline h-3 w-3 text-gray-400" />
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4">
            <div className="mb-2 border-b border-gray-50 py-2 font-bold text-efan-primary">關於一帆</div>
            <Link href="/about" onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-50">公司介紹</Link>
            <Link href="/about/clients" onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-50">客戶案例</Link>
            <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-50">聯絡我們</Link>
            <div className="pt-4 pb-2">
              <Link href="/quote-request" onClick={() => setIsMenuOpen(false)} className="block rounded-xl bg-efan-accent px-6 py-3 text-center font-bold text-white shadow-lg">
                快速報價
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
