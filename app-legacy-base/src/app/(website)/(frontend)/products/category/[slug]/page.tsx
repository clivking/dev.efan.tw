import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import JsonLdScript from '@/components/common/JsonLdScript';
import { prisma } from '@/lib/prisma';
import { getCategoryBySlug, getCategoryDisplayName } from '@/lib/category-slugs';
import { getCategoryTree } from '@/lib/category-tree';
import { getCompanyInfo } from '@/lib/company';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getProductMainImages } from '@/lib/product-helpers';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildBreadcrumbSchema, buildFaqSchema } from '@/lib/structured-data';
import ProductCatalog from '../../ProductCatalog';
import PageBanner from '@/components/common/PageBanner';

interface Props {
    params: Promise<{ slug: string }>;
}

function getCategoryFAQs(categoryName: string) {
    const defaultFaqs = [
        {
            question: `${categoryName} 適合用在哪些場景？`,
            answer: `${categoryName} 通常會依安裝空間、整合需求、管理方式與預算區間來選型。評估時建議先確認是否需要門禁整合、遠端管理、對講功能或後續擴充。`,
        },
        {
            question: `挑選 ${categoryName} 時，最先要看什麼？`,
            answer: `建議先確認案場需求，再比對規格與安裝條件，例如安裝位置、供電方式、通訊架構、辨識方式與相容平台，這樣會比單看價格更準確。`,
        },
        {
            question: `${categoryName} 導入前需要先準備哪些資訊？`,
            answer: `建議先整理案場出入口數量、佈線條件、設備安裝位置、是否需串接既有系統，以及日後誰要管理權限或維護設備，這樣會更容易快速選到合適型號。`,
        },
    ];

    if (categoryName.includes('門禁')) {
        return [
            ...defaultFaqs,
            {
                question: '門禁設備一定要搭配控制器嗎？',
                answer: '不一定，需看型號與需求。有些設備可獨立運作，有些則更適合搭配控制器、讀頭或管理平台一起規劃，才能兼顧權限管理與擴充性。',
            },
        ];
    }

    if (categoryName.includes('電鎖')) {
        return [
            ...defaultFaqs,
            {
                question: '電鎖選型時要注意哪些條件？',
                answer: '電鎖選型通常要一起評估門片材質、開門方向、安裝空間、供電方式與出門按鈕配置，避免買到後才發現與現場條件不相容。',
            },
        ];
    }

    if (categoryName.includes('對講')) {
        return [
            ...defaultFaqs,
            {
                question: '視訊對講設備可以和手機或門禁整合嗎？',
                answer: '可以，但要看品牌、協定與管理平台支援程度。有些型號適合 SIP、APP 或門禁控制整合，建議在規劃前先確認要串接的系統。',
            },
        ];
    }

    return defaultFaqs;
}

async function getData(slug: string) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return null;
    }

    const category = await getCategoryBySlug(slug);
    if (!category) return null;
    if ('showOnWebsite' in category && !category.showOnWebsite) {
        return null;
    }

    let categoryIds: string[];
    if (!category.parentId) {
        const children = await prisma.productCategory.findMany({
            where: { parentId: category.id, showOnWebsite: true },
            select: { id: true },
        });
        categoryIds = [category.id, ...children.map((child) => child.id)];
    } else {
        categoryIds = [category.id];
    }

    const [products, categories] = await Promise.all([
        prisma.product.findMany({
            where: {
                categoryId: { in: categoryIds },
                isDeleted: false,
                isHiddenItem: false,
                showOnWebsite: true,
            },
            select: {
                id: true,
                name: true,
                brand: true,
                model: true,
                description: true,
                seoSlug: true,
                specifications: true,
                isAI: true,
                isHot: true,
                isNew: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        parentId: true,
                        seoSlug: true,
                        parent: { select: { id: true, name: true, seoSlug: true } },
                    },
                },
            },
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'desc' },
            ],
        }),
        getCategoryTree(),
    ]);

    const imageMap = await getProductMainImages(products.map((product) => product.id));

    return {
        products: products.map((product) => ({
            id: product.id,
            name: product.name,
            brand: product.brand,
            model: product.model,
            description: product.description,
            imageUrl: imageMap.get(product.id) ?? null,
            slug: product.seoSlug || product.id,
            specifications: product.specifications as any,
            isAI: product.isAI,
            isHot: product.isHot,
            isNew: product.isNew,
            category: product.category
                ? {
                    id: product.category.id,
                    name: product.category.name,
                    slug: product.category.seoSlug || product.category.id,
                    parent: product.category.parent
                        ? {
                            id: product.category.parent.id,
                            name: product.category.parent.name,
                            slug: product.category.parent.seoSlug || product.category.parent.id,
                        }
                        : null,
                }
                : null,
        })),
        categories,
        currentCategory: category,
        isTopLevel: !category.parentId,
    };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await getData(slug);
    if (!data) return {};

    const company = await getCompanyInfo();
    const site = await getRequestSiteContext();
    const displayName = getCategoryDisplayName(data.currentCategory.name);
    const title = data.currentCategory.seoTitle || `${displayName}產品目錄`;
    const description =
        data.currentCategory.seoDescription ||
        `整理 ${displayName} 常見型號、適用場景與選型重點，協助你快速比較功能差異，並依案場需求找到合適設備。`;

    return buildContentMetadata({
        site,
        pathname: `/products/category/${data.currentCategory.seoSlug || slug}`,
        title,
        description,
        siteName: company.name,
        type: 'website',
    });
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    const data = await getData(slug);
    if (!data) notFound();

    const company = await getCompanyInfo();
    const displayName = getCategoryDisplayName(data.currentCategory.name);
    const parentSlug = data.currentCategory.parent?.seoSlug || '';
    const parentDisplayName = data.currentCategory.parent ? getCategoryDisplayName(data.currentCategory.parent.name) : null;
    const site = await getRequestSiteContext();
    const baseUrl = site.origin;
    const categoryPageTitle = data.currentCategory.seoTitle || `${displayName}產品目錄`;
    const categoryPageDescription =
        data.currentCategory.seoDescription ||
        `整理 ${displayName} 常見型號、適用場景與選型重點，協助你快速比較功能差異，並依案場需求找到合適設備。`;

    const breadcrumbItems = [
        { name: '首頁', item: baseUrl },
        { name: '產品目錄', item: `${baseUrl}/products` },
    ];

    if (data.currentCategory.parent && parentSlug) {
        breadcrumbItems.push({
            name: parentDisplayName || data.currentCategory.parent.name,
            item: `${baseUrl}/products/category/${parentSlug}`,
        });
        breadcrumbItems.push({
            name: data.currentCategory.name,
            item: `${baseUrl}/products/category/${data.currentCategory.seoSlug || slug}`,
        });
    } else {
        breadcrumbItems.push({
            name: displayName,
            item: `${baseUrl}/products/category/${data.currentCategory.seoSlug || slug}`,
        });
    }

    const faqs = getCategoryFAQs(displayName);
    const faqSchema = buildFaqSchema(faqs);
    const breadcrumbLd = buildBreadcrumbSchema(breadcrumbItems);

    const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: categoryPageTitle,
        description: categoryPageDescription,
        url: `${baseUrl}/products/category/${data.currentCategory.seoSlug || slug}`,
        isPartOf: {
            '@type': 'WebSite',
            name: company.name,
            url: baseUrl,
        },
        mainEntity: {
            '@type': 'ItemList',
            itemListOrder: 'https://schema.org/ItemListOrderAscending',
            numberOfItems: data.products.length,
            itemListElement: data.products.map((product, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `${baseUrl}/products/${product.slug}`,
                name: product.name,
            })),
        },
    };

    return (
        <div className="flex w-full flex-col">
            <JsonLdScript data={collectionSchema} />
            <JsonLdScript data={breadcrumbLd} />
            <JsonLdScript data={faqSchema} />

            <PageBanner
                title={data.isTopLevel ? displayName : data.currentCategory.name}
                breadcrumbs={[
                    { label: '產品目錄', href: '/products' },
                    ...(data.currentCategory.parent && parentSlug
                        ? [{ label: parentDisplayName || data.currentCategory.parent.name, href: `/products/category/${parentSlug}` }]
                        : []),
                    { label: data.isTopLevel ? displayName : data.currentCategory.name },
                ]}
            />

            <ProductCatalog
                initialProducts={data.products}
                categories={data.categories}
                activeCategory={data.isTopLevel ? slug : parentSlug || ''}
                activeSubCategory={data.isTopLevel ? undefined : slug}
            />

            <section className="bg-white py-16">
                <div className="mx-auto max-w-4xl px-4">
                    <h2 className="mb-10 text-center text-3xl font-black text-gray-900">選購 {displayName} 常見問題</h2>
                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <div
                                key={`${faq.question}-${index}`}
                                className="rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <h3 className="mb-3 flex items-start gap-3 text-xl font-bold text-gray-900">
                                    <span className="text-efan-primary">Q.</span>
                                    {faq.question}
                                </h3>
                                <p className="flex items-start gap-3 leading-relaxed text-gray-600">
                                    <span className="font-bold text-gray-400">A.</span>
                                    {faq.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-t border-gray-100 bg-gray-50 py-20 text-center">
                <div className="mx-auto max-w-4xl px-4">
                    <h2 className="mb-6 text-3xl font-black text-efan-primary">需要協助挑選合適型號？</h2>
                    <p className="mb-8 text-lg text-gray-500">
                        如果你想更快確認 {displayName} 的適用型號、安裝條件或整合方向，我們可以依案場需求協助你一起評估。
                    </p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Link
                            href="/products/inquiry"
                            className="rounded-2xl bg-efan-accent px-10 py-4 text-lg font-black text-white shadow-xl transition-all active:scale-95 hover:bg-efan-accent-dark"
                        >
                            立即詢問產品規劃
                        </Link>
                        <a
                            href={`tel:${company.phone}`}
                            className="rounded-2xl bg-efan-primary px-10 py-4 text-lg font-black text-white shadow-xl transition-all active:scale-95 hover:bg-efan-primary-light"
                        >
                            來電洽詢 {company.phone}
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
