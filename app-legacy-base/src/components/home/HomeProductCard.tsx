import Link from 'next/link';
import Image from 'next/image';

interface HomeProductCardProps {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    description: string | null;
    imageUrl: string | null;
    slug?: string | null;
    category?: { name: string; slug: string } | null;
    priority?: boolean;
    isAI?: boolean;
    isHot?: boolean;
    isNew?: boolean;
}

export default function HomeProductCard({
    name,
    brand,
    model,
    description,
    imageUrl,
    slug,
    category,
    priority,
    isAI,
    isHot,
    isNew,
}: HomeProductCardProps) {
    const productUrl = `/products/${slug}`;
    const isProductUpload = typeof imageUrl === 'string' && imageUrl.startsWith('/api/uploads/products/');

    return (
        <article className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-efan-primary/20 transition-all duration-300">
            <Link href={productUrl} className="block">
                <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={`${brand || ''} ${model || ''} ${name}`}
                            fill
                            priority={priority}
                            unoptimized={isProductUpload}
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    {category && (
                        <span className="absolute top-3 left-3 bg-efan-primary/90 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                            {category.name}
                        </span>
                    )}
                    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
                        {isAI && (
                            <span className="h-6 px-2.5 inline-flex items-center font-black text-xs text-white rounded-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg shadow-purple-500/30">
                                AI
                            </span>
                        )}
                        {isHot && (
                            <span className="h-6 px-2.5 inline-flex items-center font-black text-xs text-white rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/30">
                                熱門
                            </span>
                        )}
                        {isNew && (
                            <span className="h-6 px-2.5 inline-flex items-center font-black text-xs text-white rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30">
                                新品
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            <div className="p-5">
                {description ? (
                    <Link href={productUrl} className="block text-center mb-4">
                        <p className="text-sm font-bold text-gray-700 hover:text-efan-primary transition-colors">{description}</p>
                    </Link>
                ) : (
                    <>
                        {brand && (
                            <div className="text-xs text-orange-700 font-bold uppercase tracking-wider mb-1">{brand}</div>
                        )}
                        <Link href={productUrl}>
                            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-efan-primary transition-colors line-clamp-1">
                                {name}
                            </h3>
                        </Link>
                        {model && (
                            <div className="text-xs text-gray-400 mb-2 font-mono">{model}</div>
                        )}
                    </>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href={productUrl}
                        className="inline-flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-efan-primary hover:text-efan-primary transition-all"
                    >
                        看詳情
                    </Link>
                    <Link
                        href="/quote-request"
                        className="inline-flex items-center justify-center py-2.5 rounded-xl bg-efan-primary text-white font-bold text-sm hover:bg-efan-primary-light transition-all"
                    >
                        詢價
                    </Link>
                </div>
            </div>
        </article>
    );
}
