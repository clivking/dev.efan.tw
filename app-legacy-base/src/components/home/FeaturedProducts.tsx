import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getProductMainImages } from '@/lib/product-helpers';
import HomeProductCard from '@/components/home/HomeProductCard';

export default async function FeaturedProducts() {
    if (process.env.NEXT_PHASE === 'phase-production-build') return null;

    const hotProducts = await prisma.product.findMany({
        where: {
            isHot: true,
            isDeleted: false,
            isHiddenItem: false,
            showOnWebsite: true,
            seoSlug: { not: null },
        },
        select: {
            id: true, name: true, brand: true, model: true,
            description: true, seoSlug: true,
            isAI: true, isHot: true, isNew: true,
            category: {
                select: {
                    id: true, name: true, seoSlug: true,
                    parent: { select: { id: true, name: true, seoSlug: true } },
                },
            },
        },
        take: 30, // Fetch more to allow JS filtering
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    if (hotProducts.length === 0) return null;

    // Filter into two groups
    const isAccess = (p: any) => 
        p.category?.name.includes('門禁') || 
        p.category?.parent?.name.includes('門禁') || 
        p.name.includes('讀卡機') || p.name.includes('密碼');
        
    const isCCTV = (p: any) => 
        p.category?.name.includes('監視') || 
        p.category?.parent?.name.includes('監視') || 
        p.name.includes('主機') || p.name.includes('NVR') || 
        p.name.includes('DVR') || p.name.includes('鏡頭');

    const rawAccess = hotProducts.filter(isAccess).slice(0, 4);
    const rawCCTV = hotProducts.filter(isCCTV).slice(0, 4);

    const allIds = [...rawAccess, ...rawCCTV].map(p => p.id);
    const imageMap = await getProductMainImages(allIds);

    const formatProduct = (p: any) => ({
        id: p.id, name: p.name, brand: p.brand, model: p.model,
        description: p.description, imageUrl: imageMap.get(p.id) ?? null,
        slug: p.seoSlug || p.id, isAI: p.isAI, isHot: p.isHot, isNew: p.isNew,
        category: p.category ? {
            id: p.category.id, name: p.category.name, slug: p.category.seoSlug || p.category.id,
            parent: p.category.parent ? { id: p.category.parent.id, name: p.category.parent.name, slug: p.category.parent.seoSlug || p.category.parent.id } : null,
        } : null,
    });

    const accessProducts = rawAccess.map(formatProduct);
    const cctvProducts = rawCCTV.map(formatProduct);

    return (
        <section className="py-20 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 rounded-full text-orange-700 font-black text-sm mb-4 border border-orange-100 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                        熱門推薦裝備
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">
                        精選推薦產品
                    </h2>
                    <p className="mt-4 text-slate-500 text-lg md:text-xl font-medium">
                        最多商業客戶指名安裝的穩定防線
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-20">
                    {/* 左側：門禁系統 */}
                    {accessProducts.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-8 pb-3 border-b-2 border-emerald-500/20">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800">門禁讀卡機</h3>
                                    <p className="text-sm font-bold text-slate-500">辦公室 / 廠辦進出必備</p>
                                </div>
                            </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-8">
                                {accessProducts.map((p) => (
                                    <HomeProductCard key={p.id} {...p} priority={false} isAI={p.isAI} isHot={p.isHot} isNew={p.isNew} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 右側：監視系統 */}
                    {cctvProducts.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-8 pb-3 border-b-2 border-indigo-500/20">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800">監視鏡頭與錄影主機</h3>
                                    <p className="text-sm font-bold text-slate-500">24 小時廠房/車牌鷹眼監控</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-8">
                                {cctvProducts.map((p) => (
                                    <HomeProductCard key={p.id} {...p} priority={false} isAI={p.isAI} isHot={p.isHot} isNew={p.isNew} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center mt-16 pb-8">
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-2xl font-black text-xl hover:-translate-y-1 transition-all shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_45px_rgba(16,185,129,0.5)] active:scale-95"
                    >
                        進入產品目錄探索更多
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
