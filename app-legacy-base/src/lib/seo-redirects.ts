import { prisma } from '@/lib/prisma';
import { LEGACY_EXACT_REDIRECT_MAP } from '@/lib/redirect-rules';

const SKIP_PREFIXES = ['/api/', '/_next/', '/admin/', '/.well-known/'];
const NOISE_TOKENS = new Set([
  'access',
  'accesscontrol',
  'accessories',
  'accessory',
  'article',
  'button',
  'camera',
  'catid',
  'component',
  'content',
  'controller',
  'entry',
  'exit',
  'face',
  'html',
  'itemid',
  'mini',
  'network',
  'page',
  'pages',
  'physical',
  'pro',
  'product',
  'products',
  'ptz',
  'reader',
  'recording',
  'rfid',
  'smart',
  'surveillance',
  'system',
  'tags',
]);

function normalizePath(pathname: string) {
  const trimmed = pathname.trim();
  if (!trimmed) return '/';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed;
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isLikelyUuid(value: string) {
  return /^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i.test(
    value.replace(/-/g, ''),
  );
}

function tokenizePath(pathname: string) {
  const decoded = decodeURIComponent(pathname.split('?')[0]);
  const cleaned = decoded
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.html?$/i, '')
    .toLowerCase();

  const tokens = cleaned
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !NOISE_TOKENS.has(token))
    .filter((token) => token.length >= 2);

  return [...new Set(tokens)];
}

function extractModelCandidates(pathname: string) {
  const decoded = decodeURIComponent(pathname.split('?')[0]).toLowerCase();
  const rawParts = decoded
    .replace(/\.html?$/i, '')
    .split('/')
    .flatMap((part) => part.split(/[^a-z0-9-]+/))
    .map((part) => part.trim())
    .filter(Boolean);

  const candidates = rawParts
    .filter((part) => /[a-z]/.test(part) && /\d/.test(part))
    .filter((part) => part.length >= 4)
    .filter((part) => !NOISE_TOKENS.has(part));

  return [...new Set(candidates)];
}

function looksLikeLegacyProductPath(pathname: string) {
  return (
    pathname.endsWith('.html') ||
    pathname.includes('/component/easystore/') ||
    pathname.includes('/access-control/') ||
    pathname.includes('/cctv/') ||
    pathname.includes('/surveillance-') ||
    pathname.includes('/pbx')
  );
}

function getRuleRedirect(pathname: string) {
  const normalized = normalizePath(pathname).toLowerCase();

  if (LEGACY_EXACT_REDIRECT_MAP[normalized]) {
    return LEGACY_EXACT_REDIRECT_MAP[normalized];
  }

  if (normalized.startsWith('/product-category/')) {
    if (normalized.startsWith('/product-category/entry-guard/rfid-cards')) {
      return '/products/category/reader';
    }

    if (normalized.startsWith('/product-category/chair')) {
      return '/products';
    }

    return normalized.replace('/product-category/', '/products/category/');
  }

  if (
    normalized.startsWith('/component/easystore/product/') ||
    normalized.startsWith('/component/easystore/products/')
  ) {
    return '/products';
  }

  if (normalized.startsWith('/component/')) {
    return '/';
  }

  return null;
}

function scoreProductMatch(
  pathname: string,
  product: {
    seoSlug: string | null;
    model: string | null;
    brand: string | null;
    name: string;
  },
) {
  const lowerPath = pathname.toLowerCase();
  const compactPath = normalizeToken(lowerPath);
  const modelCandidates = extractModelCandidates(pathname);
  const tokens = tokenizePath(pathname);

  const slug = product.seoSlug || '';
  const model = product.model || '';
  const brand = product.brand || '';
  const name = product.name || '';

  const normalizedSlug = normalizeToken(slug);
  const normalizedModel = normalizeToken(model);
  const normalizedBrand = normalizeToken(brand);
  const normalizedName = normalizeToken(name);
  const normalizedBrandModel = normalizeToken(`${brand}${model}`);

  let score = 0;
  let reason = 'none';

  for (const candidate of modelCandidates) {
    const normalizedCandidate = normalizeToken(candidate);

    if (!normalizedCandidate || isLikelyUuid(normalizedCandidate)) continue;

    if (normalizedModel && normalizedCandidate === normalizedModel) {
      return { score: 120, reason: 'model_exact' };
    }

    if (normalizedBrandModel && normalizedCandidate === normalizedBrandModel) {
      return { score: 118, reason: 'brand_model_exact' };
    }

    if (normalizedSlug && normalizedCandidate === normalizedSlug) {
      return { score: 116, reason: 'slug_exact' };
    }

    if (
      normalizedModel &&
      (normalizedModel.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedModel))
    ) {
      score = Math.max(score, 103);
      reason = 'model_contains';
    }

    if (
      normalizedSlug &&
      (normalizedSlug.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedSlug))
    ) {
      score = Math.max(score, 98);
      reason = reason === 'none' ? 'slug_contains' : reason;
    }
  }

  if (normalizedSlug && compactPath.includes(normalizedSlug)) {
    score = Math.max(score, 96);
    reason = reason === 'none' ? 'slug_in_path' : reason;
  }

  if (normalizedModel && compactPath.includes(normalizedModel)) {
    score = Math.max(score, 95);
    reason = reason === 'none' ? 'model_in_path' : reason;
  }

  const matchedTokens = tokens.filter((token) => {
    const normalized = normalizeToken(token);
    return (
      (normalizedSlug && normalizedSlug.includes(normalized)) ||
      (normalizedModel && normalizedModel.includes(normalized)) ||
      (normalizedName && normalizedName.includes(normalized))
    );
  }).length;

  if (matchedTokens > 0) {
    score = Math.max(score, 50 + matchedTokens * 10);
    if (reason === 'none') reason = 'token_overlap';
  }

  if (normalizedBrand && lowerPath.includes(brand.toLowerCase())) {
    score += 4;
  }

  if (normalizedName && compactPath.includes(normalizedName)) {
    score = Math.max(score, 90);
    if (reason === 'none') reason = 'name_exact';
  }

  return { score, reason };
}

function buildProductWhere(pathname: string) {
  const tokens = tokenizePath(pathname).slice(0, 6);
  const modelCandidates = extractModelCandidates(pathname);
  const allCandidates = [...new Set([...modelCandidates, ...tokens])].slice(0, 8);

  if (allCandidates.length === 0) {
    return null;
  }

  return {
    isDeleted: false,
    showOnWebsite: true,
    seoSlug: { not: null },
    OR: allCandidates.flatMap((candidate) => [
      { seoSlug: { contains: candidate, mode: 'insensitive' as const } },
      { model: { contains: candidate, mode: 'insensitive' as const } },
      { name: { contains: candidate, mode: 'insensitive' as const } },
    ]),
  };
}

export async function resolveLegacyRedirect(pathname: string) {
  const normalizedPath = normalizePath(pathname);
  const lowerPath = normalizedPath.toLowerCase();

  if (SKIP_PREFIXES.some((prefix) => lowerPath.startsWith(prefix))) {
    return null;
  }

  const ruleRedirect = getRuleRedirect(lowerPath);
  if (ruleRedirect) {
    return {
      destination: ruleRedirect,
      reason: 'rule',
      confidence: 1,
    };
  }

  if (!looksLikeLegacyProductPath(lowerPath)) {
    return null;
  }

  const where = buildProductWhere(lowerPath);
  if (!where) {
    return null;
  }

  const candidates = await prisma.product.findMany({
    where,
    take: 40,
    select: {
      seoSlug: true,
      model: true,
      brand: true,
      name: true,
    },
  });

  let bestMatch: { destination: string; reason: string; confidence: number } | null = null;

  for (const candidate of candidates) {
    if (!candidate.seoSlug) continue;

    const { score, reason } = scoreProductMatch(lowerPath, candidate);
    if (score < 85) continue;

    const confidence = Math.min(1, score / 120);
    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = {
        destination: `/products/${candidate.seoSlug}`,
        reason,
        confidence,
      };
    }
  }

  return bestMatch;
}
