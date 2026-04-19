import type { Metadata } from 'next';

export const SEO_DESCRIPTION_SOFT_LIMIT = 160;
export const DEFAULT_OG_IMAGE_PATH = '/images/hero.webp';

export type SharedContentMetadata = {
  excerpt?: string;
  targetKeyword?: string;
  searchIntent?: string;
  secondaryKeywords?: string;
  reviewedAt?: string;
  seoTitle: string;
  seoDescription: string;
  ogImage?: string;
};

export type SharedContentMetadataField =
  | 'excerpt'
  | 'targetKeyword'
  | 'searchIntent'
  | 'secondaryKeywords'
  | 'reviewedAt'
  | 'seoTitle'
  | 'seoDescription'
  | 'ogImage';

export type SharedContentMetadataChangeHandler = (
  field: SharedContentMetadataField,
  value: string
) => void;

export function countSeoDescriptionCharacters(value: string) {
  return value.length;
}

type BuildContentMetadataInput = {
  site: {
    origin: string;
    isIndexable: boolean;
  };
  title?: string | null;
  description?: string | null;
  pathname?: string;
  siteName?: string | null;
  ogImage?: string | null;
  type?: 'website' | 'article';
};

function cleanMetadataValue(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function buildCanonicalUrl(site: BuildContentMetadataInput['site'], pathname = '/') {
  if (!pathname || pathname === '/') return site.origin;
  return `${site.origin}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function toAbsoluteMetadataUrl(pathOrUrl: string, origin: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export function buildContentMetadata({
  site,
  title,
  description,
  pathname = '/',
  siteName,
  ogImage,
  type = 'website',
}: BuildContentMetadataInput): Metadata {
  const resolvedTitle = cleanMetadataValue(title);
  const resolvedDescription = cleanMetadataValue(description);
  const canonical = buildCanonicalUrl(site, pathname);
  const resolvedSiteName = cleanMetadataValue(siteName);
  const resolvedOgImage = cleanMetadataValue(ogImage) || DEFAULT_OG_IMAGE_PATH;
  const robots = site.isIndexable
    ? undefined
    : {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      };

  return {
    ...(resolvedTitle ? { title: { absolute: resolvedTitle } } : {}),
    ...(resolvedDescription ? { description: resolvedDescription } : {}),
    alternates: {
      canonical,
      // Explicit language declaration prevents Google from misclassifying zh-Hant-TW content
      languages: {
        'zh-Hant-TW': canonical,
        'x-default': canonical,
      },
    },
    robots,
    openGraph: {
      ...(resolvedTitle ? { title: resolvedTitle } : {}),
      ...(resolvedDescription ? { description: resolvedDescription } : {}),
      url: canonical,
      type,
      locale: 'zh_TW',
      ...(resolvedSiteName ? { siteName: resolvedSiteName } : {}),
      ...(resolvedOgImage
        ? {
            images: [
              {
                url: toAbsoluteMetadataUrl(resolvedOgImage, site.origin),
                width: 1200,
                height: 630,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: resolvedOgImage ? 'summary_large_image' : 'summary',
      ...(resolvedTitle ? { title: resolvedTitle } : {}),
      ...(resolvedDescription ? { description: resolvedDescription } : {}),
      ...(resolvedOgImage ? { images: [toAbsoluteMetadataUrl(resolvedOgImage, site.origin)] } : {}),
    },
  };
}
