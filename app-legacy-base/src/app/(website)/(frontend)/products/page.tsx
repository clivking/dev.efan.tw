import Link from 'next/link';
import { Metadata } from 'next';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getCompanyInfo } from '@/lib/company';
import { getCategoryTree } from '@/lib/category-tree';
import { buildContentMetadata } from '@/lib/content-metadata';
import { prisma } from '@/lib/prisma';
import { getProductMainImages } from '@/lib/product-helpers';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/structured-data';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import ProductCatalog from './ProductCatalog';
import PageBanner from '@/components/common/PageBanner';

export const dynamic = 'force-dynamic';

type Props = {
    searchParams?: Promise<{ search?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
    const company = await getCompanyInfo();
    const site = await getRequestSiteContext();
    const baseUrl = site.origin;
    const title = `產品目錄 | ${company.name}`;
    const description = `整理門禁、對講、電鎖與周邊整合設備，協助你依據案場需求快速挑選合適產品。`;

    return buildContentMetadata({
        site,
        pathname: '/products',
        title,
        description,
        siteName: company.name,
        type: 'website',
    });
}

async function getProductsData() {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return { products: [], categories: [] };
    }

    const [products, categories] = await Promise.all([
        prisma.product.findMany({
            where: {
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
    };
}

export default async function ProductsPage({ searchParams }: Props) {
    const { products, categories } = await getProductsData();
    const company = await getCompanyInfo();
    const site = await getRequestSiteContext();
    const baseUrl = site.origin;
    const params = (await searchParams) || {};
    const initialSearch = typeof params.search === 'string' ? params.search : '';

    const breadcrumbs = withHomeBreadcrumb('產品目錄');
    const breadcrumbLd = buildBreadcrumbSchema(toBreadcrumbSchemaItems(breadcrumbs, baseUrl, '/products'));

    const collectionLd = buildCollectionPageSchema({
        url: `${baseUrl}/products`,
        name: '產品目錄',
        description: `整理 ${company.name} 公開展示的產品、型號與分類，協助你依需求快速找到合適設備。`,
        siteName: company.name,
        siteUrl: baseUrl,
        items: products.map((product) => ({
            url: `${baseUrl}/products/${product.slug}`,
            name: product.name,
        })),
    });

    return (
        <div className="flex w-full flex-col">
            <JsonLdScript data={collectionLd} />
            <JsonLdScript data={breadcrumbLd} />

            <PageBanner
                title="產品目錄"
                subtitle={`整理常見設備類型、應用情境與熱門型號，協助你更快找到適合的門禁、對講與整合產品。`}
                breadcrumbs={breadcrumbs}
            />

            <ProductCatalog initialProducts={products} categories={categories} initialSearch={initialSearch} searchBasePath="/products" />

            <section className="border-t border-gray-100 bg-gray-50 py-20 text-center">
                <div className="mx-auto max-w-4xl px-4">
                    <h2 className="mb-6 text-3xl font-black text-efan-primary">需要協助挑選產品？</h2>
                    <p className="mb-8 text-lg text-gray-500">
                        如果你還在比對規格、整理需求，或想確認不同設備的整合方式，我們可以協助你更快找到合適選項。
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
