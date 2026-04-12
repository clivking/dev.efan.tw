import type { CompanyInfo } from '@/lib/company';

type BreadcrumbItem = {
  name: string;
  item: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type ArticleSchemaInput = {
  url: string;
  headline: string;
  description?: string | null;
  authorName: string;
  publisherName: string;
  publisherLogoUrl: string;
  datePublished?: string;
  dateModified?: string;
  image?: string | null;
  speakableCssSelectors?: string[];
};

type ServiceSchemaInput = {
  url: string;
  name: string;
  description?: string | null;
  organizationId: string;
  areaServed?: string;
  serviceType?: string;
};

type ProductSchemaInput = {
  url: string;
  name: string;
  image?: string[];
  description?: string | null;
  sku?: string | null;
  mpn?: string | null;
  category?: string | null;
  brandName: string;
  additionalProperty?: Array<{ '@type': 'PropertyValue'; name: string; value: string }>;
  keywords?: string | null;
  offers?: {
    priceCurrency: string;
    price: number;
    priceValidUntil: string;
    availability: string;
    itemCondition: string;
    sellerName: string;
  } | null;
};

type CollectionPageSchemaInput = {
  url: string;
  name: string;
  description?: string | null;
  siteName: string;
  siteUrl: string;
  items: Array<{
    url: string;
    name: string;
  }>;
};

type AboutPageSchemaInput = {
  url: string;
  name: string;
  organizationId: string;
};

type HowToStep = {
  name: string;
  text: string;
  url?: string;
  image?: string;
};

type HowToSchemaInput = {
  url: string;
  name: string;
  description?: string | null;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration, e.g. "PT30M"
  image?: string | null;
};

function toAbsoluteUrl(pathOrUrl: string, origin: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function parseTaiwanAddress(address: string) {
  const match = address.match(/^(.{2,3}[市縣])(.{2,3}[區鄉鎮市])(.+)$/);
  return {
    streetAddress: match ? match[3] : address,
    addressLocality: match ? match[2] : '',
    addressRegion: match ? match[1] : '',
    addressCountry: 'TW',
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

export function buildFaqSchema(items: FaqItem[]) {
  if (!items.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildArticleSchema(input: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description || '',
    mainEntityOfPage: input.url,
    url: input.url,
    author: {
      '@type': 'Organization',
      name: input.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: input.publisherName,
      logo: {
        '@type': 'ImageObject',
        url: input.publisherLogoUrl,
      },
    },
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.image ? { image: input.image } : {}),
    // Speakable: signals to AI Overview / voice assistants which content to read aloud
    ...(input.speakableCssSelectors && input.speakableCssSelectors.length > 0
      ? {
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: input.speakableCssSelectors,
          },
        }
      : {}),
  };
}

export function buildServiceSchema(input: ServiceSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description || '',
    url: input.url,
    provider: {
      '@type': 'LocalBusiness',
      '@id': input.organizationId,
    },
    areaServed: {
      '@type': 'Place',
      name: input.areaServed || 'Taipei, Taiwan',
    },
    serviceType: input.serviceType || input.name,
  };
}

export function buildProductSchema(input: ProductSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    ...(input.image && input.image.length > 0 ? { image: input.image } : {}),
    description: input.description || '',
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.mpn ? { mpn: input.mpn } : {}),
    url: input.url,
    ...(input.category ? { category: input.category } : {}),
    brand: {
      '@type': 'Brand',
      name: input.brandName,
    },
    ...(input.additionalProperty && input.additionalProperty.length > 0
      ? { additionalProperty: input.additionalProperty }
      : {}),
    ...(input.keywords ? { keywords: input.keywords } : {}),
    ...(input.offers
      ? {
          offers: {
            '@type': 'Offer',
            url: input.url,
            priceCurrency: input.offers.priceCurrency,
            price: input.offers.price,
            priceValidUntil: input.offers.priceValidUntil,
            availability: input.offers.availability,
            itemCondition: input.offers.itemCondition,
            seller: {
              '@type': 'Organization',
              name: input.offers.sellerName,
            },
          },
        }
      : {}),
  };
}

export function buildCollectionPageSchema(input: CollectionPageSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description || '',
    url: input.url,
    isPartOf: {
      '@type': 'WebSite',
      name: input.siteName,
      url: input.siteUrl,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: item.url,
        name: item.name,
      })),
    },
  };
}

export function buildAboutPageSchema(input: AboutPageSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: input.name,
    url: input.url,
    mainEntity: { '@id': input.organizationId },
  };
}

/** WebSite schema with optional SearchAction — helps Google show Sitelinks Search Box */
export function buildWebSiteSchema(input: { name: string; url: string; searchUrlTemplate?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${input.url}/#website`,
    name: input.name,
    url: input.url,
    inLanguage: 'zh-Hant-TW',
    ...(input.searchUrlTemplate
      ? {
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: input.searchUrlTemplate },
            'query-input': 'required name=search_term_string',
          },
        }
      : {}),
  };
}

/** HowTo schema — eligible for rich results on instructional guide pages */
export function buildHowToSchema(input: HowToSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description || '',
    url: input.url,
    ...(input.totalTime ? { totalTime: input.totalTime } : {}),
    ...(input.image ? { image: input.image } : {}),
    step: input.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
      ...(step.image ? { image: step.image } : {}),
    })),
  };
}

export function buildOrganizationSchema(
  company: CompanyInfo,
  origin: string,
  options?: { sameAs?: string[] }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${origin}/#organization`,
    name: company.name,
    alternateName: company.nameEn,
    url: origin,
    telephone: company.phone,
    email: company.email,
    foundingDate: String(company.foundedYear),
    description: company.tagline,
    logo: toAbsoluteUrl(company.logoUrl, origin),
    image: toAbsoluteUrl(company.logoUrl, origin),
    address: {
      '@type': 'PostalAddress',
      ...parseTaiwanAddress(company.address),
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 25.0283,
      longitude: 121.5435,
    },
    areaServed: [
      { '@type': 'City', name: '台北市' },
      { '@type': 'City', name: '新北市' },
      { '@type': 'City', name: '桃園市' },
    ],
    knowsAbout: ['門禁系統', '監視錄影系統', '電話總機系統', '考勤薪資系統', '弱電整合工程'],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    priceRange: '$$',
    // potentialAction: key user journeys for rich result eligibility
    potentialAction: [
      {
        '@type': 'CommunicateAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${origin}/contact` },
        name: '聯絡我們',
      },
      {
        '@type': 'OrderAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${origin}/quote-request` },
        name: '快速報價',
      },
    ],
    // sameAs: cross-reference external entity profiles for Knowledge Panel
    ...(options?.sameAs && options.sameAs.length > 0 ? { sameAs: options.sameAs } : {}),
  };
}
