'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface InquiryItem {
    productId: string;
    name: string;
    brand: string | null;
    model: string | null;
    imageUrl: string | null;
    quantity: number;
}

interface InquiryContextType {
    items: InquiryItem[];
    addItem: (item: Omit<InquiryItem, 'quantity'>) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    isInCart: (productId: string) => boolean;
    clearAll: () => void;
    totalCount: number;
}

const defaultInquiryContext: InquiryContextType = {
    items: [],
    addItem: () => undefined,
    removeItem: () => undefined,
    updateQuantity: () => undefined,
    isInCart: () => false,
    clearAll: () => undefined,
    totalCount: 0,
};

const InquiryContext = createContext<InquiryContextType>(defaultInquiryContext);

export function InquiryProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<InquiryItem[]>([]);

    const addItem = useCallback((item: Omit<InquiryItem, 'quantity'>) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === item.productId);
            if (existing) {
                // Remove if already in cart (toggle behavior)
                return prev.filter(i => i.productId !== item.productId);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    }, []);

    const removeItem = useCallback((productId: string) => {
        setItems(prev => prev.filter(i => i.productId !== productId));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        const q = Math.max(1, Math.floor(quantity));
        setItems(prev =>
            prev.map(i => (i.productId === productId ? { ...i, quantity: q } : i))
        );
    }, []);

    const isInCart = useCallback(
        (productId: string) => items.some(i => i.productId === productId),
        [items]
    );

    const clearAll = useCallback(() => setItems([]), []);

    const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <InquiryContext.Provider value={{ items, addItem, removeItem, updateQuantity, isInCart, clearAll, totalCount }}>
            {children}
        </InquiryContext.Provider>
    );
}

export function useInquiry() {
    return useContext(InquiryContext);
}
