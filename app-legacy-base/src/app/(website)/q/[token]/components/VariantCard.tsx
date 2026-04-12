import React from 'react';

interface VariantCardProps {
    variant: {
        id: string;
        name: string;
        isRecommended: boolean;
        pricing: {
            totalAmount: number;
        };
        items: any[];
    };
    isSelected: boolean;
    onSelect: () => void;
    disabled?: boolean;
}

export default function VariantCard({ variant, isSelected, onSelect, disabled }: VariantCardProps) {
    return (
        <div
            onClick={onSelect}
            className={`p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${isSelected
                    ? 'border-efan-primary bg-indigo-50/50 shadow-lg shadow-indigo-100'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                } ${disabled ? 'cursor-default' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <span className={`text-base font-black ${isSelected ? 'text-efan-primary' : 'text-gray-800'}`}>
                        {variant.name}
                    </span>
                    {variant.isRecommended && (
                        <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full mt-1 w-fit">
                            ⭐ 推薦方案
                        </span>
                    )}
                </div>
                <div className="text-right">
                    <div className={`text-xl font-black ${isSelected ? 'text-efan-primary' : 'text-gray-900'}`}>
                        ${variant.pricing.totalAmount.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-bold text-gray-400">
                    明細共 {variant.items.length} 項
                </span>
                {!disabled && (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-efan-primary border-efan-primary' : 'border-gray-200'
                        }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
