import React from 'react';

interface VariantTabsProps {
    variants: any[];
    selectedVariantId: string | null;
    onSelect: (id: string) => void;
    isSigned?: boolean;
}

export default function VariantTabs({ variants, selectedVariantId, onSelect, isSigned }: VariantTabsProps) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex border-b border-gray-100 mb-6">
                {variants.map(v => (
                    <button
                        key={v.id}
                        onClick={() => !isSigned && onSelect(v.id)}
                        className={`px-8 py-4 text-sm font-black transition-all relative ${selectedVariantId === v.id
                                ? 'text-efan-primary'
                                : 'text-gray-400 hover:text-gray-600'
                            } ${isSigned ? 'cursor-default' : ''}`}
                    >
                        <div className="flex items-center gap-2">
                            {v.name}
                            {v.isRecommended && <span className="text-xs">⭐</span>}
                        </div>
                        {selectedVariantId === v.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-efan-primary rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.3)]" />
                        )}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
                {variants.map(v => (
                    <div
                        key={v.id}
                        onClick={() => !isSigned && onSelect(v.id)}
                        className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer ${selectedVariantId === v.id
                                ? 'border-efan-primary bg-indigo-50/20 shadow-xl shadow-indigo-100/50'
                                : 'border-gray-50 bg-white hover:border-gray-100 opacity-60'
                            } ${isSigned ? 'cursor-default' : ''}`}
                    >
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{v.name}</div>
                        <div className={`text-2xl font-black ${selectedVariantId === v.id ? 'text-efan-primary' : 'text-gray-800'}`}>
                            ${v.pricing.totalAmount.toLocaleString()}
                        </div>
                        {v.isRecommended && <div className="text-[10px] font-bold text-amber-500 mt-1">⭐ 最佳性價比建議</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}
