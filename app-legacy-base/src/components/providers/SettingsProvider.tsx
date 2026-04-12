'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CompanyInfo } from '@/lib/company';
import type { CategoryTree } from '@/lib/category-tree';

type PublicSettingsContextValue = {
    company: CompanyInfo | null;
    categories: CategoryTree[];
};

const SettingsContext = createContext<PublicSettingsContextValue>({
    company: null,
    categories: [],
});

export function SettingsProvider({
    company,
    categories = [],
    children
}: {
    company: CompanyInfo;
    categories?: CategoryTree[];
    children: React.ReactNode
}) {
    const [currentCompany, setCurrentCompany] = useState<CompanyInfo>(company);
    const [currentCategories, setCurrentCategories] = useState<CategoryTree[]>(categories);

    useEffect(() => {
        let active = true;
        const refreshSettings = () => {
            fetch('/api/public/site-config', { cache: 'no-store' })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (active && data?.company) {
                        setCurrentCompany(data.company);
                    }
                    if (active && Array.isArray(data?.categories)) {
                        setCurrentCategories(data.categories);
                    }
                })
                .catch(() => {});
        };

        const timer = window.setTimeout(refreshSettings, 4000);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, []);

    return (
        <SettingsContext.Provider value={{ company: currentCompany, categories: currentCategories }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(SettingsContext);
    return context.company;
}

export function useProductCategories() {
    const context = useContext(SettingsContext);
    return context.categories;
}
