'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

/**
 * Hook to sync admin list page/search/filter state with URL query params.
 * This ensures the browser back button restores the exact page + filters.
 *
 * With `persistKey` enabled, the current filter state is saved to
 * localStorage so it can be restored on the next visit.
 */

interface FilterDef {
    key: string;
    defaultValue: string;
}

interface UseAdminListStateOptions {
    pageSize?: number;
    debounceMs?: number;
    filters?: FilterDef[];
    /** Enable localStorage persistence under this key (e.g. 'products') */
    persistKey?: string;
    /** Keys to exclude from persistence (e.g. volatile date ranges) */
    excludeFromPersist?: string[];
}

const STORAGE_PREFIX = 'admin-list:';

function loadPersistedState(key: string): Record<string, string> | null {
    try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function savePersistedState(key: string, state: Record<string, string>) {
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(state));
    } catch { /* silently degrade */ }
}

export function useAdminListState(options: UseAdminListStateOptions = {}) {
    const {
        pageSize = 20,
        debounceMs = 300,
        filters = [],
        persistKey,
        excludeFromPersist = [],
    } = options;
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const restoredRef = useRef(false);

    // Read from URL
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const search = searchParams.get('search') || '';

    // Filter values from URL
    const filterValues = useMemo(() => {
        const values: Record<string, string> = {};
        for (const f of filters) {
            values[f.key] = searchParams.get(f.key) || f.defaultValue;
        }
        return values;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // ── Restore from localStorage on first mount ──
    useEffect(() => {
        if (!persistKey || restoredRef.current) return;
        restoredRef.current = true;

        // Only restore if URL has NO params (fresh navigation)
        if (searchParams.toString()) return;

        const saved = loadPersistedState(persistKey);
        if (!saved || Object.keys(saved).length === 0) return;

        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(saved)) {
            if (v && v !== '0') params.set(k, v);
        }
        if (params.get('page') === '1') params.delete('page');
        const qs = params.toString();
        if (qs) {
            router.replace(`${pathname}?${qs}`, { scroll: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Save to localStorage on every URL change ──
    useEffect(() => {
        if (!persistKey) return;

        const excludeSet = new Set(excludeFromPersist);
        const state: Record<string, string> = {};

        // Save search
        if (search && !excludeSet.has('search')) state.search = search;
        // Save page
        if (page > 1 && !excludeSet.has('page')) state.page = String(page);
        // Save filters
        for (const f of filters) {
            const val = filterValues[f.key];
            if (val && val !== f.defaultValue && !excludeSet.has(f.key)) {
                state[f.key] = val;
            }
        }

        savePersistedState(persistKey, state);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Local search input (for debounce)
    const [searchInput, setSearchInput] = useState(search);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep local input in sync when URL changes (e.g. browser back)
    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    // Build new URL helper
    const buildUrl = useCallback(
        (overrides: Record<string, string | number>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [k, v] of Object.entries(overrides)) {
                const val = String(v);
                if (val === '' || val === '0') {
                    params.delete(k);
                } else {
                    params.set(k, val);
                }
            }
            // Always remove page=1 to keep URL clean
            if (params.get('page') === '1') params.delete('page');
            const qs = params.toString();
            return qs ? `${pathname}?${qs}` : pathname;
        },
        [searchParams, pathname]
    );

    const setPage = useCallback(
        (newPage: number) => {
            router.replace(buildUrl({ page: newPage }), { scroll: false });
        },
        [router, buildUrl]
    );

    const setSearch = useCallback(
        (value: string) => {
            setSearchInput(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                router.replace(buildUrl({ search: value, page: 1 }), { scroll: false });
            }, debounceMs);
        },
        [router, buildUrl, debounceMs]
    );

    const setFilter = useCallback(
        (key: string, value: string) => {
            router.replace(buildUrl({ [key]: value, page: 1 }), { scroll: false });
        },
        [router, buildUrl]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return {
        page,
        pageSize,
        search,
        searchInput,
        filterValues,
        setPage,
        setSearch,
        setFilter,
    };
}
