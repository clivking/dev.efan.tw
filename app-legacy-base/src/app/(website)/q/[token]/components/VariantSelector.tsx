import React from 'react';
import VariantTabs from './VariantTabs';
import VariantCard from './VariantCard';

interface Variant {
    id: string;
    name: string;
    isRecommended: boolean;
    items: any[];
    pricing: {
        totalAmount: number;
        [key: string]: any;
    };
}

interface VariantSelectorProps {
    variants: Variant[];
    selectedVariantId: string | null;
    onSelect: (id: string) => void;
    isSigned?: boolean;
}

export default function VariantSelector({ variants, selectedVariantId, onSelect, isSigned }: VariantSelectorProps) {
    if (!variants || variants.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-800">請選擇方案</h3>
                {isSigned && <span className="text-xs font-bold text-efan-primary bg-indigo-50 px-3 py-1 rounded-full px-2">已簽回選定方案</span>}
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:block">
                <VariantTabs
                    variants={variants}
                    selectedVariantId={selectedVariantId}
                    onSelect={onSelect}
                    isSigned={isSigned}
                />
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-4">
                {variants.map(v => (
                    <VariantCard
                        key={v.id}
                        variant={v}
                        isSelected={selectedVariantId === v.id}
                        onSelect={() => !isSigned && onSelect(v.id)}
                        disabled={isSigned}
                    />
                ))}
            </div>
        </div>
    );
}
