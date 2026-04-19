import { SERVICES } from '@/lib/constants';
import type { CategoryTree } from '@/lib/category-tree';

export type GuideSearchEntry = {
  title: string;
  slug: string;
  excerpt?: string | null;
};

export type SiteSearchItemType = 'service' | 'guide' | 'tool' | 'support' | 'page' | 'category';

export type SiteSearchItem = {
  type: SiteSearchItemType;
  label: string;
  href: string;
  description?: string;
  keywords?: string[];
};

const STATIC_PAGES: SiteSearchItem[] = [
  { type: 'page', label: '首頁', href: '/', description: '門禁、監視、總機與弱電整合首頁', keywords: ['efan', '一帆', '首頁'] },
  { type: 'page', label: '公司介紹', href: '/about', description: '了解一帆安全整合的背景與服務方式', keywords: ['關於', '公司', '一帆'] },
  { type: 'page', label: '客戶案例', href: '/about/clients', description: '查看合作客戶與服務實績', keywords: ['案例', '客戶', '實績'] },
  { type: 'page', label: '聯絡我們', href: '/contact', description: '聯絡一帆安全整合', keywords: ['聯絡', '電話', '地址'] },
  { type: 'page', label: '快速報價', href: '/quote-request', description: '送出需求，安排評估與報價', keywords: ['報價', '詢價', '需求'] },
  { type: 'support', label: '軟體下載', href: '/support/downloads', description: '門禁、監視與相關驅動下載', keywords: ['下載', '軟體', '驅動'] },
  { type: 'support', label: '教學專區', href: '/portal', description: '成交客戶專屬教學與操作影片', keywords: ['教學', '影片', 'portal'] },
];

const TOOLS: SiteSearchItem[] = [
  { type: 'tool', label: '監視器容量計算器', href: '/tools/cctv-storage-calculator', description: '試算錄影硬碟容量與保存天數', keywords: ['cctv', '容量', '硬碟', '錄影'] },
  { type: 'tool', label: '監視器焦距計算器', href: '/tools/cctv-focal-length-calculator', description: '試算幾 mm 鏡頭較適合、可拍多寬', keywords: ['焦距', '鏡頭', 'mm', '監視器'] },
  { type: 'tool', label: '門禁快速諮詢', href: '/tools/access-control-quick-consultation', description: '快速判斷門禁需求與規劃方向', keywords: ['門禁', '諮詢', '需求'] },
];

export function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function scoreSearchItem(item: SiteSearchItem, query: string) {
  const haystacks = [item.label, item.description || '', ...(item.keywords || [])]
    .map((value) => normalizeSearchText(value))
    .filter(Boolean);

  let score = 0;
  for (const text of haystacks) {
    if (text === query) score += 120;
    else if (text.startsWith(query)) score += 80;
    else if (text.includes(query)) score += 35;
  }

  if (item.type === 'service' && query.includes('門禁') && item.label.includes('門禁')) score += 16;
  if (item.type === 'guide') score += 4;
  if (item.type === 'tool') score += 6;
  return score;
}

export function buildSiteSearchIndex(categories: CategoryTree[], guides: GuideSearchEntry[]): SiteSearchItem[] {
  const categoryItems: SiteSearchItem[] = categories.flatMap((category) => {
    const topLevel: SiteSearchItem = {
      type: 'category',
      label: category.displayName,
      href: `/products/category/${category.slug}`,
      description: `查看 ${category.displayName} 相關產品與型號`,
      keywords: [category.name, category.displayName, '產品', '設備'],
    };

    const children = category.children.map<SiteSearchItem>((child) => ({
      type: 'category',
      label: child.name,
      href: `/products/category/${child.slug}`,
      description: `${category.displayName}分類下的 ${child.name}`,
      keywords: [category.displayName, child.name, '產品', '型號'],
    }));

    return [topLevel, ...children];
  });

  const serviceItems: SiteSearchItem[] = SERVICES.map((service) => ({
    type: 'service',
    label: service.name,
    href: service.href,
    description: service.shortDesc,
    keywords: [service.name, service.shortDesc],
  }));

  const guideItems: SiteSearchItem[] = guides.map((guide) => ({
    type: 'guide',
    label: guide.title,
    href: `/guides/${guide.slug}`,
    description: guide.excerpt || '查看指南內容',
    keywords: ['指南', '知識', guide.title],
  }));

  return [...STATIC_PAGES, ...TOOLS, ...serviceItems, ...categoryItems, ...guideItems];
}

export function getMatchingSiteItems(items: SiteSearchItem[], query: string, limit = 10) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  return items
    .map((item) => ({ item, score: scoreSearchItem(item, normalized) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function getTypeLabel(type: SiteSearchItemType) {
  switch (type) {
    case 'service':
      return '服務';
    case 'guide':
      return '指南';
    case 'tool':
      return '工具';
    case 'support':
      return '支援';
    case 'page':
      return '頁面';
    case 'category':
      return '分類';
    default:
      return '內容';
  }
}
