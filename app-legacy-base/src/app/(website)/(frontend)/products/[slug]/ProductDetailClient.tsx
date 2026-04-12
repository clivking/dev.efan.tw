'use client';

import { useInquiry } from '@/components/products/InquiryContext';
import ProductCard from '@/components/products/ProductCard';

interface ProductInfo {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    imageUrl: string | null;
}

interface RelatedProduct {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    description: string | null;
    imageUrl: string | null;
    slug?: string | null;
    category: { id: string; name: string; slug: string } | null;
}

interface Props {
    product?: ProductInfo;
    relatedProduct?: RelatedProduct;
    compact?: boolean;
}

export default function ProductDetailClient({ product, relatedProduct, compact = false }: Props) {
    const { addItem, isInCart } = useInquiry();

    // Render related product card
    if (relatedProduct) {
        return (
            <ProductCard
                id={relatedProduct.id}
                name={relatedProduct.name}
                brand={relatedProduct.brand}
                model={relatedProduct.model}
                description={relatedProduct.description}
                imageUrl={relatedProduct.imageUrl}
                slug={relatedProduct.slug}
                category={relatedProduct.category}
            />
        );
    }

    // Render main product add-to-inquiry button
    if (!product) return null;
    const inCart = isInCart(product.id);

    return (
        <button
            onClick={() => addItem({
                productId: product.id,
                name: product.name,
                brand: product.brand,
                model: product.model,
                imageUrl: product.imageUrl,
            })}
            className={`w-full ${compact ? 'min-h-[44px] px-5 py-2 rounded-lg text-sm' : 'min-h-[56px] px-6 py-2.5 rounded-xl text-sm'} sm:w-auto font-black transition-all active:scale-95 shadow-lg ${
                inCart
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30'
                    : 'bg-efan-accent text-white hover:bg-efan-accent-dark shadow-efan-accent/30'
            }`}
        >
            {inCart ? '已加入詢價清單 ✓' : '加入詢價清單'}
        </button>
    );
}
