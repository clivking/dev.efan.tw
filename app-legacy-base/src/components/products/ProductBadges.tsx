'use client';

/**
 * ProductBadges — reusable badge component for AI / Hot / New product labels.
 *
 * Usage:
 *   <ProductBadges isAI isHot isNew size="sm" />
 *
 * Positions itself as absolute top-right when wrapped in a relative container.
 */

interface ProductBadgesProps {
    isAI?: boolean;
    isHot?: boolean;
    isNew?: boolean;
    /** sm = card overlay, lg = detail page, inline = next to text */
    size?: 'sm' | 'lg' | 'inline';
}

export default function ProductBadges({ isAI, isHot, isNew, size = 'sm' }: ProductBadgesProps) {
    if (!isAI && !isHot && !isNew) return null;

    const isInline = size === 'inline';
    const badgeHeight = size === 'lg' ? 'h-8 text-sm px-3' : 'h-6 text-xs px-2.5';

    const badges = (
        <>
            {isAI && (
                <span
                    className={`${badgeHeight} inline-flex items-center gap-1 font-black text-white rounded-full
                        bg-gradient-to-r from-purple-600 to-blue-500
                        shadow-lg shadow-purple-500/30
                        ${!isInline ? 'ai-badge-glow' : ''}`}
                >
                    ✨ AI
                </span>
            )}
            {isHot && (
                <span
                    className={`${badgeHeight} inline-flex items-center gap-1 font-black text-white rounded-full
                        bg-gradient-to-r from-orange-500 to-red-500
                        shadow-lg shadow-orange-500/30
                        ${!isInline ? 'hot-badge-shimmer' : ''}`}
                >
                    🔥 熱門
                </span>
            )}
            {isNew && (
                <span
                    className={`${badgeHeight} inline-flex items-center gap-1 font-black text-white rounded-full
                        bg-gradient-to-r from-emerald-500 to-cyan-500
                        shadow-lg shadow-emerald-500/30`}
                >
                    🆕 新品
                </span>
            )}
        </>
    );

    if (isInline) {
        return <span className="inline-flex items-center gap-1.5 ml-2">{badges}</span>;
    }

    return (
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
            {badges}

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 8px rgba(124, 58, 237, 0.4), 0 4px 12px rgba(124, 58, 237, 0.2); }
                    50% { box-shadow: 0 0 16px rgba(124, 58, 237, 0.6), 0 4px 20px rgba(124, 58, 237, 0.3); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .ai-badge-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
                .hot-badge-shimmer {
                    background-size: 200% auto;
                    background-image: linear-gradient(
                        90deg,
                        #f97316 0%, #ef4444 25%, #fbbf24 50%, #ef4444 75%, #f97316 100%
                    );
                    animation: shimmer 3s linear infinite;
                }
            `}</style>
        </div>
    );
}
