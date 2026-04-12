export const GUIDE_CONTENT_GROUPS = [
  { value: 'guide', label: '指南' },
  { value: 'blog-legacy', label: '舊站文章' },
  { value: 'location', label: '地區內容' },
  { value: 'solution', label: '解決方案' },
] as const;

export const GUIDE_CONTENT_TYPES = [
  { value: 'guide', label: '指南' },
  { value: 'comparison', label: '比較文' },
  { value: 'faq', label: 'FAQ' },
  { value: 'tutorial', label: '教學' },
  { value: 'case-study', label: '案例' },
  { value: 'location-guide', label: '地區指南' },
] as const;

export const GUIDE_SEARCH_INTENTS = [
  { value: '', label: '未設定' },
  { value: 'informational', label: '資訊查詢' },
  { value: 'commercial', label: '商業評估' },
  { value: 'transactional', label: '採購決策' },
  { value: 'navigational', label: '品牌導向' },
] as const;

export const GUIDE_REDIRECT_STATUSES = [
  { value: 'none', label: '無' },
  { value: 'planned', label: '規劃中' },
  { value: 'ready', label: '可切換' },
  { value: 'redirected', label: '已轉址' },
] as const;

export type GuideContentGroup = (typeof GUIDE_CONTENT_GROUPS)[number]['value'];
export type GuideContentType = (typeof GUIDE_CONTENT_TYPES)[number]['value'];
export type GuideSearchIntent = (typeof GUIDE_SEARCH_INTENTS)[number]['value'];
export type GuideRedirectStatus = (typeof GUIDE_REDIRECT_STATUSES)[number]['value'];

export const GUIDE_CONTENT_GROUP_LABELS = Object.fromEntries(
  GUIDE_CONTENT_GROUPS.map((item) => [item.value, item.label])
) as Record<string, string>;

export const GUIDE_CONTENT_TYPE_LABELS = Object.fromEntries(
  GUIDE_CONTENT_TYPES.map((item) => [item.value, item.label])
) as Record<string, string>;

export const GUIDE_SEARCH_INTENT_LABELS = Object.fromEntries(
  GUIDE_SEARCH_INTENTS.filter((item) => item.value).map((item) => [item.value, item.label])
) as Record<string, string>;

export const GUIDE_REDIRECT_STATUS_LABELS = Object.fromEntries(
  GUIDE_REDIRECT_STATUSES.map((item) => [item.value, item.label])
) as Record<string, string>;

function isAllowedValue<T extends readonly { value: string }[]>(
  value: unknown,
  options: T
): value is T[number]['value'] {
  return typeof value === 'string' && options.some((item) => item.value === value);
}

export function normalizeGuideContentGroup(value: unknown): GuideContentGroup {
  return isAllowedValue(value, GUIDE_CONTENT_GROUPS) ? value : 'guide';
}

export function normalizeGuideContentType(value: unknown): GuideContentType {
  return isAllowedValue(value, GUIDE_CONTENT_TYPES) ? value : 'guide';
}

export function normalizeGuideSearchIntent(value: unknown): GuideSearchIntent {
  return isAllowedValue(value, GUIDE_SEARCH_INTENTS) ? value : '';
}

export function normalizeGuideRedirectStatus(value: unknown): GuideRedirectStatus {
  return isAllowedValue(value, GUIDE_REDIRECT_STATUSES) ? value : 'none';
}

export function parseGuideCommaList(value: unknown) {
  if (!value || typeof value !== 'string') return null;
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

export function parseGuideJsonField(value: unknown) {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function asGuideJsonField<T>(value: T | null) {
  return value === null ? undefined : value;
}
