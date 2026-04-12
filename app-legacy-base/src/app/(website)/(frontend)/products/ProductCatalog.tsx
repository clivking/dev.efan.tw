'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import type { CategoryTree, FilterableSpec } from '@/lib/category-tree';

interface SpecItem {
    key: string;
    value: string;
}

interface SpecGroup {
    group: string;
    items: SpecItem[];
}

interface Product {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    description: string | null;
    imageUrl: string | null;
    slug?: string | null;
    specifications?: SpecGroup[] | null;
    isAI?: boolean;
    isHot?: boolean;
    isNew?: boolean;
    category: {
        id: string;
        name: string;
        slug: string;
        parent?: { id: string; name: string; slug: string } | null;
    } | null;
}

interface Props {
    initialProducts: Product[];
    categories: CategoryTree[];
    activeCategory?: string;
    activeSubCategory?: string;
}

function getSpecValue(product: Product, key: string): string | null {
    if (!product.specifications || !Array.isArray(product.specifications)) return null;

    for (const group of product.specifications) {
        for (const item of group.items || []) {
            if (item.key === key) return item.value;
        }
    }

    return null;
}

export default function ProductCatalog({ initialProducts, categories, activeCategory, activeSubCategory }: Props) {
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Product[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [specFilters, setSpecFilters] = useState<Record<string, string[]>>({});
    const [badgeFilter, setBadgeFilter] = useState<'ai' | 'hot' | 'new' | null>(null);

    const currentSlug = activeSubCategory || activeCategory || '';

    const currentTopCategory = useMemo(
        () => categories.find((cat) => cat.slug === activeCategory) || null,
        [categories, activeCategory]
    );

    const currentFilterableSpecs = useMemo((): FilterableSpec[] => {
        if (!currentSlug) return [];

        const topCategory = categories.find((cat) => cat.slug === currentSlug);
        if (topCategory) return topCategory.filterableSpecs;

        for (const category of categories) {
            const child = category.children.find((item) => item.slug === currentSlug);
            if (child) return child.filterableSpecs;
        }

        return [];
    }, [categories, currentSlug]);

    useEffect(() => {
        const keyword = search.trim();
        if (!keyword) {
            setSearchResults(null);
            setIsSearching(false);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);
                const response = await fetch(`/api/public/products?search=${encodeURIComponent(keyword)}&limit=100`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Search failed: ${response.status}`);
                }

                const data = await response.json();
                setSearchResults(data.products || []);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error(error);
                    setSearchResults([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        }, 250);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [search]);

    const searchBaseProducts = useMemo(
        () => (search.trim() ? searchResults || [] : initialProducts),
        [initialProducts, search, searchResults]
    );

    const badgeFiltered = useMemo(() => {
        if (!badgeFilter) return searchBaseProducts;

        return searchBaseProducts.filter((product) => {
            if (badgeFilter === 'ai') return product.isAI;
            if (badgeFilter === 'hot') return product.isHot;
            if (badgeFilter === 'new') return product.isNew;
            return true;
        });
    }, [badgeFilter, searchBaseProducts]);

    const filtered = useMemo(() => {
        const activeFilters = Object.entries(specFilters).filter(([, values]) => values.length > 0);
        if (activeFilters.length === 0) return badgeFiltered;

        return badgeFiltered.filter((product) =>
            activeFilters.every(([key, values]) => {
                const specValue = getSpecValue(product, key);
                return specValue !== null && values.includes(specValue);
            })
        );
    }, [badgeFiltered, specFilters]);

    const chipCounts = useMemo(() => {
        const counts: Record<string, Record<string, number>> = {};

        for (const spec of currentFilterableSpecs) {
            counts[spec.key] = {};

            const otherFilters = Object.entries(specFilters).filter(([key, values]) => key !== spec.key && values.length > 0);

            const baseProducts = badgeFiltered.filter((product) =>
                otherFilters.every(([key, values]) => {
                    const value = getSpecValue(product, key);
                    return value !== null && values.includes(value);
                })
            );

            for (const option of spec.options) {
                counts[spec.key][option] = baseProducts.filter((product) => getSpecValue(product, spec.key) === option).length;
            }
        }

        return counts;
    }, [badgeFiltered, currentFilterableSpecs, specFilters]);

    const hasActiveFilters = Object.values(specFilters).some((values) => values.length > 0) || badgeFilter !== null;

    const toggleSpecFilter = (key: string, value: string) => {
        setSpecFilters((prev) => {
            const currentValues = prev[key] || [];
            const nextValues = currentValues.includes(value)
                ? currentValues.filter((item) => item !== value)
                : [...currentValues, value];

            return { ...prev, [key]: nextValues };
        });
    };

    const groupedProducts = useMemo(() => {
        if (search.trim()) return null;
        if (!activeCategory || activeSubCategory) return null;

        const topCategory = categories.find((cat) => cat.slug === activeCategory);
        if (!topCategory || topCategory.children.length === 0) return null;

        const groups: { name: string; slug: string; products: Product[] }[] = [];

        for (const child of topCategory.children) {
            const childProducts = filtered.filter((product) => product.category?.slug === child.slug);
            if (childProducts.length > 0) {
                groups.push({ name: child.name, slug: child.slug, products: childProducts });
            }
        }

        const childSlugs = new Set(topCategory.children.map((child) => child.slug));
        const directProducts = filtered.filter(
            (product) => product.category?.slug === topCategory.slug && !childSlugs.has(product.category.slug)
        );

        if (directProducts.length > 0) {
            groups.unshift({ name: '全部產品', slug: topCategory.slug, products: directProducts });
        }

        return groups.length > 0 ? groups : null;
    }, [activeCategory, activeSubCategory, categories, filtered, search]);

    const badgeOptions = useMemo(
        () =>
            [
                { key: 'ai' as const, label: 'AI', color: 'from-purple-600 to-blue-500', count: searchBaseProducts.filter((product) => product.isAI).length },
                { key: 'hot' as const, label: '熱門', color: 'from-orange-500 to-red-500', count: searchBaseProducts.filter((product) => product.isHot).length },
                { key: 'new' as const, label: '新品', color: 'from-emerald-500 to-cyan-500', count: searchBaseProducts.filter((product) => product.isNew).length },
            ].filter((badge) => badge.count > 0),
        [searchBaseProducts]
    );

    return (
        <section className="bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 lg:flex-row">
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="搜尋產品..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-sm outline-none transition-all focus:bg-white focus:border-efan-accent focus:ring-2 focus:ring-efan-accent/20"
                                />
                                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {currentTopCategory ? (
                            <div className="rounded-2xl border border-gray-100 bg-white p-4">
                                <div className="mb-4 border-b border-gray-100 pb-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Category</p>
                                    <h3 className="mt-2 text-lg font-black text-efan-primary">{currentTopCategory.displayName}</h3>
                                </div>

                                <nav className="space-y-1.5">
                                    <Link
                                        href={`/products/category/${currentTopCategory.slug}`}
                                        className={`block rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                                            activeCategory === currentTopCategory.slug && !activeSubCategory
                                                ? 'border-l-2 border-efan-accent bg-efan-accent/5 text-efan-primary'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                        }`}
                                    >
                                        全部{currentTopCategory.displayName}
                                    </Link>

                                    {currentTopCategory.children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={`/products/category/${child.slug}`}
                                            className={`block rounded-xl px-3 py-2.5 text-sm transition-all ${
                                                activeSubCategory === child.slug
                                                    ? 'border-l-2 border-efan-accent bg-efan-accent/5 font-bold text-efan-primary'
                                                    : 'font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                            }`}
                                        >
                                            {child.name}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        ) : (
                            <nav className="space-y-1">
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/products/category/${category.slug}`}
                                        className={`block rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                                            activeCategory === category.slug
                                                ? 'border-l-2 border-efan-accent bg-efan-accent/5 text-efan-primary'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {category.displayName}
                                    </Link>
                                ))}
                            </nav>
                        )}

                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500">快速篩選</h4>
                            <div className="flex flex-wrap gap-2">
                                {badgeOptions.map((badge) => (
                                    <button
                                        key={badge.key}
                                        onClick={() => setBadgeFilter((prev) => (prev === badge.key ? null : badge.key))}
                                        className={`rounded-full px-3 py-1.5 text-xs font-black transition-all ${
                                            badgeFilter === badge.key
                                                ? `bg-gradient-to-r ${badge.color} text-white shadow-lg`
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {badge.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {currentFilterableSpecs.length > 0 && (
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">規格篩選</h4>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={() => {
                                                setSpecFilters({});
                                                setBadgeFilter(null);
                                            }}
                                            className="text-[10px] font-bold text-gray-400 transition-colors hover:text-red-500"
                                        >
                                            清除篩選
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {currentFilterableSpecs.map((spec) => (
                                        <div key={spec.key}>
                                            <div className="mb-2 text-xs font-bold text-gray-600">{spec.key}</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {spec.options.map((option) => {
                                                    const isActive = (specFilters[spec.key] || []).includes(option);
                                                    const count = chipCounts[spec.key]?.[option] ?? 0;
                                                    const isDisabled = count === 0 && !isActive;

                                                    return (
                                                        <button
                                                            key={option}
                                                            onClick={() => !isDisabled && toggleSpecFilter(spec.key, option)}
                                                            disabled={isDisabled}
                                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                                                isActive
                                                                    ? 'scale-105 bg-efan-primary text-white shadow-md shadow-efan-primary/20'
                                                                    : isDisabled
                                                                        ? 'cursor-not-allowed bg-gray-50 text-gray-300'
                                                                        : 'bg-gray-100 text-gray-600 hover:bg-efan-primary/10 hover:text-efan-primary'
                                                            }`}
                                                        >
                                                            {option}
                                                            <span className={`ml-1 ${isActive ? 'text-white/70' : 'text-gray-400'}`}>({count})</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    <div className="flex-1 min-w-0">
                        {hasActiveFilters && (
                            <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                                <span className="font-bold">已套用篩選</span>
                                {Object.entries(specFilters)
                                    .filter(([, values]) => values.length > 0)
                                    .map(([key, values]) => (
                                        <span key={key} className="inline-flex items-center gap-1 rounded-lg bg-efan-primary/10 px-2.5 py-1 text-xs font-bold text-efan-primary">
                                            {key}: {values.join('、')}
                                            <button
                                                onClick={() => setSpecFilters((prev) => ({ ...prev, [key]: [] }))}
                                                className="ml-0.5 transition-colors hover:text-red-500"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                {badgeFilter && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-efan-primary/10 px-2.5 py-1 text-xs font-bold text-efan-primary">
                                        {badgeOptions.find((badge) => badge.key === badgeFilter)?.label || badgeFilter}
                                        <button onClick={() => setBadgeFilter(null)} className="ml-0.5 transition-colors hover:text-red-500">
                                            ×
                                        </button>
                                    </span>
                                )}
                                <span className="text-gray-400">共 {filtered.length} 項</span>
                            </div>
                        )}

                        {search.trim() && (
                            <div className="mb-4 text-sm text-gray-500">
                                {isSearching ? '搜尋所有產品中...' : `搜尋「${search.trim()}」的全站產品結果`}
                            </div>
                        )}

                        {filtered.length > 0 ? (
                            groupedProducts ? (
                                <div className="space-y-12">
                                    {groupedProducts.map((group) => (
                                        <div key={group.slug} id={`cat-${group.slug}`}>
                                            <h3 className="mb-4 border-b border-gray-100 pb-2 text-lg font-black text-efan-primary">
                                                {group.name}
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                                {group.products.map((product, index) => (
                                                    <ProductCard key={product.id} {...product} priority={index < 2} isAI={product.isAI} isHot={product.isHot} isNew={product.isNew} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {filtered.map((product, index) => (
                                        <ProductCard key={product.id} {...product} priority={index < 2} isAI={product.isAI} isHot={product.isHot} isNew={product.isNew} />
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="py-20 text-center">
                                <div className="mb-4 text-5xl">📦</div>
                                <h3 className="mb-2 text-xl font-bold text-gray-400">
                                    {search || hasActiveFilters ? '找不到符合的產品' : '目前此分類沒有產品'}
                                </h3>
                                <p className="mb-6 text-gray-400">
                                    {search || hasActiveFilters ? '請嘗試不同的關鍵字或調整篩選條件' : '請選擇其他分類或聯絡我們了解更多'}
                                </p>
                                {(search || hasActiveFilters) && (
                                    <button
                                        onClick={() => {
                                            setSearch('');
                                            setSpecFilters({});
                                            setBadgeFilter(null);
                                        }}
                                        className="font-bold text-efan-primary underline underline-offset-4"
                                    >
                                        清除所有篩選
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
