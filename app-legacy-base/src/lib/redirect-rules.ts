export type ExactRedirectRule = {
  source: string;
  destination: string;
  permanent: true;
};

export type ConditionalRedirectRule = ExactRedirectRule & {
  has: Array<
    | { type: 'query'; key: string; value: string }
    | { type: 'host'; value: string }
  >;
};

const ZH_TECOM_PBX = '/%E6%9D%B1%E8%A8%8A%E9%9B%BB%E8%A9%B1%E7%B8%BD%E6%A9%9F.html';
const ZH_CCTV_RECORDING = '/%E7%9B%A3%E8%A6%96%E9%8C%84%E5%BD%B1%E7%B3%BB%E7%B5%B1.html';
const ZH_CCTV_SYSTEM = '/%E7%9B%A3%E8%A6%96%E7%B3%BB%E7%B5%B1.html';
const ZH_ACCESS_CONTROL = '/%E9%96%80%E7%A6%81%E7%B3%BB%E7%B5%B1.html';
const ZH_FIRE_ACCESS_CONTROL = '/%E6%B6%88%E9%98%B2%E9%96%80%E7%A6%81%E6%8E%A7%E5%88%B6.html';

export const SHARED_EXACT_REDIRECTS: ExactRedirectRule[] = [
  { source: '/our-story.html', destination: '/about', permanent: true },
  { source: '/quote.html', destination: '/quote-request', permanent: true },
  { source: '/blog.html', destination: '/', permanent: true },
  { source: '/blog/access-control-tco-guide', destination: '/guides/2026-access-control-tco-analysis', permanent: true },
  { source: '/blog/intercom-upgrade-guide', destination: '/guides/intercom-upgrade-comparison', permanent: true },
  { source: '/blog/office-access-control-guide', destination: '/guides/office-access-control-upgrade-guide', permanent: true },
  { source: '/blog/pbx-vs-cloud-telephony', destination: '/guides/cloud-vs-onprem-pbx', permanent: true },
  { source: '/index.html', destination: '/', permanent: true },
  { source: '/about.html', destination: '/about', permanent: true },
  { source: '/pages/login.html', destination: '/login', permanent: true },
  { source: '/pbx.html', destination: '/services/phone-system', permanent: true },
  { source: ZH_TECOM_PBX, destination: '/products/category/tecom-pbx', permanent: true },
  { source: '/pbx/tecom-pbx/ip-pbx.html', destination: '/products/category/phone-system', permanent: true },
  { source: '/surveillance-recording.html', destination: '/services/cctv', permanent: true },
  { source: '/cctv.html', destination: '/services/cctv', permanent: true },
  { source: ZH_CCTV_RECORDING, destination: '/services/cctv', permanent: true },
  { source: ZH_CCTV_SYSTEM, destination: '/products/category/surveillance', permanent: true },
  { source: '/access-control-system.html', destination: '/services/access-control', permanent: true },
  { source: ZH_ACCESS_CONTROL, destination: '/services/access-control', permanent: true },
  { source: ZH_FIRE_ACCESS_CONTROL, destination: '/services/access-control', permanent: true },
  { source: '/cctv/camera/acti-z315-5mp-mini-bullet.html', destination: '/products/category/camera', permanent: true },
  { source: '/cctv/camera/acti-z317-4mp-mini-bullet.html', destination: '/products/category/camera', permanent: true },
  { source: '/cctv/camera/acti-z322-4mp-ai-colorguard-mini-bullet.html', destination: '/products/category/camera', permanent: true },
  { source: '/cctv/camera/acti-z79-4mp-ir-dome.html', destination: '/products/acti-z72', permanent: true },
  { source: '/cctv/camera/acti-a962-8mp-alpr-ptz.html', destination: '/products/category/camera', permanent: true },
  { source: '/access-control/electronic-lock.html', destination: '/products/category/electronic-lock', permanent: true },
  { source: '/access-control/accessories.html', destination: '/products/category/access-accessories', permanent: true },
  { source: '/access-control/soyal-701-software.html', destination: '/support/downloads', permanent: true },
  { source: '/registration.html', destination: '/portal/register', permanent: true },
  { source: '/login.html', destination: '/login', permanent: true },
  { source: '/faq.html', destination: '/', permanent: true },
  { source: '/refurbished.html', destination: '/products', permanent: true },
  { source: '/terms.html', destination: '/terms', permanent: true },
  { source: '/downloads/soyal/dm_manual/AR-PB2_DM.pdf', destination: '/products/soyal-ar-pb2', permanent: true },
  { source: '/sitemaps.xml', destination: '/sitemap.xml', permanent: true },
  { source: '/product-collections.html', destination: '/products', permanent: true },
  { source: '/blog/on-trend.html', destination: '/', permanent: true },
  { source: '/blog/technology.html', destination: '/', permanent: true },
  { source: '/blog/the-employment-economy.html', destination: '/', permanent: true },
  { source: '/blog/budgeting-for-pro.html', destination: '/', permanent: true },
  { source: '/blog/the-psychology-of-money.html', destination: '/', permanent: true },
  { source: '/blog/beyond-the-roth-ira.html', destination: '/', permanent: true },
  { source: '/blog/are-expensive-lattes-sabotaging-your-savings-goals.html', destination: '/', permanent: true },
  { source: '/blog/sustainability-and-devices-how-technology-is-changing-our-environmental-impact.html', destination: '/', permanent: true },
  { source: '/blog/from-e-waste-to-green-grace-the-transformative-power-of-sustainable-devices.html', destination: '/', permanent: true },
  { source: '/blog/debt-avalanche-vs-debt-snowball.html', destination: '/', permanent: true },
  { source: '/access-control/controller/soyal-ar-101-h-mini-access-controller.html', destination: '/products/soyal-ar-101-h', permanent: true },
];

export const FALLBACK_ONLY_EXACT_REDIRECTS: ExactRedirectRule[] = [
  { source: '/access-control.html', destination: '/products/category/access-control', permanent: true },
  { source: '/pbx', destination: '/services/phone-system', permanent: true },
  { source: '/surveillance-recording/soundsphere-earbuds', destination: '/services/cctv', permanent: true },
  { source: '/access-control-system/chromebook.html', destination: '/services/access-control', permanent: true },
  { source: '/access-control/controller/soyal-ar-727-e.html', destination: '/products/soyal-ar-727-e', permanent: true },
  { source: '/access-control/controller.html', destination: '/services/access-control', permanent: true },
  { source: '/access-control/network-converter.html', destination: '/services/access-control', permanent: true },
  { source: '/cctv/camera/acti-z972-5mp-mini-ptz.html', destination: '/products/acti-z958', permanent: true },
  { source: '/product-category/entry-guard/rfid-cards', destination: '/products/category/reader', permanent: true },
  { source: '/product-category/chair', destination: '/products', permanent: true },
  { source: '/category/uncategorized', destination: '/products', permanent: true },
  { source: '/$', destination: '/', permanent: true },
  { source: '/&', destination: '/', permanent: true },
];

export const NEXT_CONDITIONAL_REDIRECTS: ConditionalRedirectRule[] = [
  {
    source: '/login.html',
    has: [{ type: 'query', key: 'view', value: 'reset' }],
    destination: '/login?view=reset',
    permanent: true,
  },
  {
    source: '/:path*',
    has: [{ type: 'host', value: 'pro.efan.tw' }],
    destination: 'https://www.efan.tw/:path*',
    permanent: true,
  },
  {
    source: '/:path*',
    has: [{ type: 'host', value: 'efan.tw' }],
    destination: 'https://www.efan.tw/:path*',
    permanent: true,
  },
];

export const LEGACY_EXACT_REDIRECT_MAP = Object.fromEntries(
  [...SHARED_EXACT_REDIRECTS, ...FALLBACK_ONLY_EXACT_REDIRECTS].map((rule) => [
    rule.source.toLowerCase(),
    rule.destination,
  ]),
) as Record<string, string>;
