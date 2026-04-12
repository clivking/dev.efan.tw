'use client';

import { usePathname } from 'next/navigation';

const breadcrumbMap: Record<string, string> = {
  about: '關於一帆',
  clients: '客戶案例',
  guides: '知識指南',
  services: '服務項目',
  products: '產品目錄',
  category: '產品分類',
  contact: '聯絡我們',
  'quote-request': '快速報價',
  locations: '地區服務',
  support: '技術支援',
  tools: '實用工具',
  downloads: '軟體下載',
  'cctv-storage-calculator': '監視器容量計算器',
  solutions: '解決方案',
  portal: '教學專區',
  privacy: '隱私權政策',
  terms: '服務條款',
  '2026-access-control-tco-analysis': '2026 門禁 TCO 採購分析',
  'intercom-upgrade-comparison': '對講機升級評比',
  'office-access-control-upgrade-guide': '辦公室門禁升級指引',
  'cloud-vs-onprem-pbx': '雲端與實體總機差異',
  'taipei-access-control': '台北門禁系統',
  'neihu-access-control': '內湖門禁施工',
  'daan-access-control': '大安區門禁規劃',
  'taipei-pbx-system': '台北企業總機規劃',
  'taipei-cctv-system': '台北監視系統方案',
  'taipei-office-access-control': '台北辦公室門禁方案',
};

export default function Breadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === '/') return null;

  const hasDedicatedBreadcrumbSchema =
    pathname === '/about' ||
    pathname.startsWith('/about/') ||
    pathname === '/contact' ||
    pathname === '/login' ||
    pathname.startsWith('/portal') ||
    pathname === '/products' ||
    pathname.startsWith('/products/') ||
    pathname.startsWith('/quote-request') ||
    pathname.startsWith('/services/') ||
    pathname.startsWith('/guides/') ||
    pathname.startsWith('/tools/');

  if (hasDedicatedBreadcrumbSchema) return null;

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'https://www.efan.tw';

  const paths = pathname.split('/').filter(Boolean);

  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: '首頁',
      item: `${origin}/`,
    },
    ...paths.map((path, index) => {
      const url = `/${paths.slice(0, index + 1).join('/')}`;
      const name = breadcrumbMap[path] || decodeURIComponent(path).replace(/-/g, ' ');

      return {
        '@type': 'ListItem',
        position: index + 2,
        name,
        item: `${origin}${url}`,
      };
    }),
  ];

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />;
}
