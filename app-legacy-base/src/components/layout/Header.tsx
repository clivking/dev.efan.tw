'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calculator,
  Clock,
  Download,
  KeyRound,
  Lock,
  MonitorSmartphone,
  Phone,
  PlayCircle,
  Plug,
  Send,
  Video,
} from 'lucide-react';
import { SERVICES } from '@/lib/constants';
import type { CategoryTree } from '@/lib/category-tree';
import type { CompanyInfo } from '@/lib/company';
import { shouldBypassImageOptimization } from '@/lib/image-paths';

const HeaderMobileContent = dynamic(() => import('./HeaderMobileContent'), { ssr: false });

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  KeyRound,
  Video,
  Phone,
  Clock,
  Plug,
  MonitorSmartphone,
};

interface HeaderProps {
  company?: CompanyInfo | null;
  categories?: CategoryTree[];
}

type ResourceLink = {
  href: string;
  label: string;
  note?: string;
  badge?: string;
};

const GUIDE_LINKS: ResourceLink[] = [
  { href: '/guides/2026-access-control-tco-analysis', label: '2026 門禁 TCO 採購分析', note: '從五年總成本角度看門禁投資。', badge: 'HOT' },
  { href: '/guides/office-access-control-upgrade-guide', label: '辦公室門禁升級指引', note: '適合評估舊系統該修還是該換。' },
  { href: '/guides/intercom-upgrade-comparison', label: '對講機升級評比', note: '整理對講、門口機與升級差異。' },
  { href: '/guides/cloud-vs-onprem-pbx', label: '雲端與實體總機差異', note: '通訊架構、管理與成本比較。' },
];

const SUPPORT_LINKS: ResourceLink[] = [
  { href: '/tools/cctv-storage-calculator', label: '監視器容量計算', note: '試算錄影所需硬碟容量與保存天數。' },
  { href: '/support/downloads', label: '軟體下載', note: '門禁、監視與相關驅動下載。' },
  { href: '/portal', label: '教學專區', note: '成交客戶專屬教學與操作影片。' },
];

function getShortCompanyName(companyName: string) {
  return companyName.replace('安全整合有限公司', '').trim() || companyName;
}

function NavUnderline({ active }: { active: boolean }) {
  return (
    <span
      className={`absolute bottom-0 left-0 h-0.5 w-full origin-left bg-efan-accent transition-transform duration-300 ${
        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
      }`}
    />
  );
}

export default function Header({ company: companyProp, categories = [] }: HeaderProps) {
  const pathname = usePathname();
  const company = companyProp;
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const productsTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsProductsOpen(false);
    setIsServicesOpen(false);
    setIsResourcesOpen(false);
  }, [pathname]);

  const handleProductsEnter = () => {
    if (productsTimerRef.current) clearTimeout(productsTimerRef.current);
    setIsProductsOpen(true);
  };

  const handleProductsLeave = () => {
    productsTimerRef.current = setTimeout(() => setIsProductsOpen(false), 180);
  };

  const shortName = company ? getShortCompanyName(company.name) : '一帆';
  const servicesActive = pathname?.startsWith('/services') || pathname?.startsWith('/solutions');
  const productsActive = pathname?.startsWith('/products');
  const resourcesActive = pathname?.startsWith('/guides') || pathname?.startsWith('/support') || pathname?.startsWith('/portal');
  const aboutActive = pathname === '/about' || pathname === '/about/clients' || pathname === '/contact';

  if (!company) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 md:h-20">
          <span className="text-xl font-bold text-efan-primary">一帆科技</span>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <Link href="/" className="flex items-center gap-2">
              {company.logoUrl && company.logoUrl !== '/images/logo.png' ? (
                <div className="relative h-12 md:h-14" style={{ minWidth: '160px' }}>
                  <Image src={company.logoUrl} alt={company.name} height={56} width={280} className="h-full w-auto object-contain" priority unoptimized={shouldBypassImageOptimization(company.logoUrl)} style={{ height: '100%', width: 'auto' }} />
                </div>
              ) : (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-efan-primary text-xs font-bold text-white md:h-10 md:w-10 md:text-sm">一帆</div>
                  <span className="text-xl font-bold tracking-tight text-efan-primary md:text-2xl">{shortName}</span>
                </>
              )}
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center space-x-8 md:flex">
            {/* Products */}
            <div className="relative group">
              <button type="button" onMouseEnter={handleProductsEnter} onMouseLeave={handleProductsLeave}
                className={`group relative flex items-center gap-1 py-6 font-semibold transition-colors ${productsActive ? 'font-bold text-efan-primary' : 'text-gray-700 hover:text-efan-primary'}`}>
                產品目錄
                <svg className={`h-4 w-4 transition-transform ${isProductsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                <NavUnderline active={productsActive} />
              </button>
              {isProductsOpen && (
                <div onMouseEnter={handleProductsEnter} onMouseLeave={handleProductsLeave}
                  className="absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_28px_90px_-32px_rgba(15,36,64,0.38)] backdrop-blur-xl"
                  style={{ minWidth: `${Math.min(Math.max(categories.length, 2) * 220, 920)}px` }}>
                  <div className="p-7">
                    {categories.length > 0 ? (
                      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, minmax(0, 1fr))` }}>
                        {categories.map((category) => {
                          const CategoryIcon = category.slug === 'access-control' ? ICON_MAP.KeyRound : category.slug === 'surveillance' ? ICON_MAP.Video : category.slug === 'video-intercom' ? ICON_MAP.MonitorSmartphone : category.slug === 'phone-system' ? ICON_MAP.Phone : null;
                          return (
                            <div key={category.id} className="min-w-0 px-3">
                              <Link href={`/products/category/${category.slug}`} className="group/cat flex items-center gap-3 border-b border-slate-200/80 pb-3">
                                {CategoryIcon && (
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover/cat:bg-efan-primary/10">
                                    <CategoryIcon className="h-4.5 w-4.5 text-efan-primary" strokeWidth={2} />
                                  </div>
                                )}
                                <span className="block text-sm font-bold text-efan-primary transition-colors group-hover/cat:text-efan-accent">{category.displayName}</span>
                              </Link>
                              {category.children.length > 0 && (
                                <ul className="mt-3 space-y-1.5">
                                  {category.children.map((child) => (
                                    <li key={child.id}>
                                      <Link href={`/products/category/${child.slug}`} className="group/item -mx-1.5 flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-500 transition-all hover:bg-efan-primary/[0.06] hover:text-efan-primary">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 transition-colors group-hover/item:bg-efan-accent" />
                                        <span className="truncate">{child.name}</span>
                                        <svg className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 transition-all group-hover/item:translate-x-0.5 group-hover/item:text-efan-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="py-2 text-center text-sm text-gray-400">目前沒有可展示的產品分類。</p>
                    )}
                    <div className="mt-6 flex items-center justify-between border-t border-slate-200/80 pt-5">
                      <div className="flex items-center gap-3">
                        <Link href="/products" className="inline-flex items-center gap-1.5 rounded-full border border-efan-accent/20 bg-efan-accent/5 px-3.5 py-2 text-sm font-bold text-efan-accent transition-colors hover:border-efan-accent/30 hover:bg-efan-accent/10 hover:text-efan-accent-dark">
                          查看全部產品
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </Link>
                        <span className="text-xs font-medium text-slate-400">依產品分類快速找到合適設備。</span>
                      </div>
                      <Link href="/quote-request" className="inline-flex items-center gap-1.5 rounded-full bg-efan-accent px-5 py-2.5 text-sm font-bold text-white shadow-[0_16px_36px_-18px_rgba(232,121,43,0.7)] transition-all hover:bg-efan-accent-dark hover:shadow-[0_18px_40px_-18px_rgba(232,121,43,0.82)] active:scale-95">
                        <Send className="h-3.5 w-3.5" />
                        快速報價
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Services */}
            <div className="relative group">
              <button type="button" onMouseEnter={() => setIsServicesOpen(true)} onMouseLeave={() => setIsServicesOpen(false)}
                className={`group relative flex items-center gap-1 py-6 font-semibold transition-colors ${servicesActive ? 'font-bold text-efan-primary' : 'text-gray-700 hover:text-efan-primary'}`}>
                服務項目
                <svg className={`h-4 w-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                <NavUnderline active={servicesActive} />
              </button>
              {isServicesOpen && (
                <div onMouseEnter={() => setIsServicesOpen(true)} onMouseLeave={() => setIsServicesOpen(false)}
                  className="absolute left-0 w-[340px] rounded-b-lg border border-gray-100 bg-white shadow-xl">
                  <div className="py-2">
                    {SERVICES.map((service) => {
                      const ServiceIcon = ICON_MAP[service.iconName];
                      return (
                        <Link key={service.id} href={service.href} className="block px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 hover:text-efan-primary">
                          <div className="flex items-center gap-3">
                            {ServiceIcon ? <ServiceIcon className="h-5 w-5 text-efan-primary" strokeWidth={1.8} /> : <span className="text-xl">{service.icon}</span>}
                            <div>
                              <div className="text-sm font-semibold">{service.name}</div>
                              <div className="text-xs text-gray-500">{service.shortDesc}</div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Resources */}
            <div className="relative group">
              <button type="button" onMouseEnter={() => setIsResourcesOpen(true)} onMouseLeave={() => setIsResourcesOpen(false)}
                className={`group relative flex items-center gap-1 py-6 font-semibold transition-colors ${resourcesActive ? 'font-bold text-efan-primary' : 'text-gray-700 hover:text-efan-primary'}`}>
                資源中心
                <svg className={`h-4 w-4 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                <NavUnderline active={resourcesActive} />
              </button>
              {isResourcesOpen && (
                <div onMouseEnter={() => setIsResourcesOpen(true)} onMouseLeave={() => setIsResourcesOpen(false)}
                  className="absolute left-1/2 -translate-x-1/2 rounded-2xl border border-gray-100 bg-white shadow-2xl" style={{ minWidth: '680px' }}>
                  <div className="grid gap-8 p-6 md:grid-cols-2">
                    <div className="min-w-0">
                      <div className="mb-3 border-b border-gray-100 pb-3 text-sm font-bold text-efan-primary">知識指南</div>
                      <ul className="space-y-2">
                        {GUIDE_LINKS.map((item) => (
                          <li key={item.href}>
                            <Link href={item.href} className="block rounded-lg px-3 py-2 transition-colors hover:bg-gray-50">
                              <div className="text-sm font-medium text-gray-800">
                                {item.badge && <span className="mr-2 text-[10px] font-bold text-efan-accent">{item.badge}</span>}
                                {item.label}
                              </div>
                              {item.note && <div className="mt-1 text-xs text-gray-500">{item.note}</div>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4">
                        <Link href="/guides" className="text-sm font-bold text-efan-primary hover:underline">查看全部知識指南</Link>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="mb-3 border-b border-gray-100 pb-3 text-sm font-bold text-efan-primary">技術支援</div>
                      <ul className="space-y-3">
                        {SUPPORT_LINKS.map((item) => (
                          <li key={item.href}>
                            <Link href={item.href} className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50">
                              <div className="rounded-lg bg-efan-primary/10 p-2">
                                {item.href === '/tools/cctv-storage-calculator' ? <Calculator className="h-4 w-4 text-efan-primary" /> : item.href === '/support/downloads' ? <Download className="h-4 w-4 text-efan-primary" /> : <PlayCircle className="h-4 w-4 text-efan-primary" />}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-800">
                                  {item.label}
                                  {item.href === '/portal' && <Lock className="ml-1 inline h-3 w-3 text-gray-400" />}
                                </div>
                                {item.note && <div className="mt-1 text-xs text-gray-500">{item.note}</div>}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* About (CSS hover, zero JS) */}
            <div className="relative group">
              <button type="button"
                className={`group relative flex items-center gap-1 py-6 font-semibold transition-colors ${aboutActive ? 'font-bold text-efan-primary' : 'text-gray-700 hover:text-efan-primary'}`}>
                關於一帆
                <svg className="h-4 w-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                <NavUnderline active={aboutActive} />
              </button>
              <div className="invisible absolute left-0 w-40 -translate-y-2 rounded-b-lg border border-gray-100 bg-white opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="py-2">
                  <Link href="/about" className="block px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-efan-primary">公司介紹</Link>
                  <Link href="/about/clients" className="block px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-efan-primary">客戶案例</Link>
                  <Link href="/contact" className="block px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-efan-primary">聯絡我們</Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center md:flex">
            <Link href="/quote-request" className="rounded-full bg-efan-accent px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-efan-accent/20 transition-all hover:bg-efan-accent-dark active:scale-95">
              快速報價
            </Link>
          </div>

          {/* Mobile: lazy-loaded hamburger + menu (ssr:false) */}
          <HeaderMobileContent company={company} categories={categories} />
        </div>
      </div>
    </header>
  );
}
