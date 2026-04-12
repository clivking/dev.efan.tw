'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buildReturnTo, withReturnTo } from '@/lib/admin-return-to';
import { adminCaseCopy } from '@/lib/admin-case-copy';
import { cn } from '@/lib/utils';

interface PendingAction {
    id: string;
    type: 'signed' | 'construction' | 'invoice' | 'unpaid';
    quoteNumber: string;
    quoteName?: string;
    customerName: string;
    amount: number;
    daysSince: number;
    dueDate: string;
    status?: string;
}

interface PendingActionsProps {
    loading: boolean;
    actions: PendingAction[];
}

export default function PendingActions({ loading, actions }: PendingActionsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const copy = adminCaseCopy.pendingActions;
    const returnTo = buildReturnTo(pathname, searchParams);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
        }).format(Math.round(val));
    };

    const getDayColor = (days: number) => {
        if (days > 14) return 'text-red-500';
        if (days >= 7) return 'text-orange-500';
        return 'text-gray-400';
    };

    const typeLabels = {
        signed: copy.groups.signed,
        construction: copy.groups.construction,
        invoice: copy.groups.invoice,
        unpaid: copy.groups.unpaid,
    };

    const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
        signed: { label: copy.statuses.signed, color: 'text-green-700', bg: 'bg-green-100' },
        construction: { label: copy.statuses.construction, color: 'text-purple-700', bg: 'bg-purple-100' },
        completed: { label: copy.statuses.completed, color: 'text-indigo-700', bg: 'bg-indigo-100' },
    };

    const grouped = {
        signed: actions.filter((action) => action.type === 'signed'),
        construction: actions.filter((action) => action.type === 'construction'),
        invoice: actions.filter((action) => action.type === 'invoice'),
        unpaid: actions.filter((action) => action.type === 'unpaid'),
    };

    if (!loading && actions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-[32px] border border-gray-100 bg-white p-12 text-center shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-full bg-gray-100" />
                <h3 className="mb-2 text-2xl font-black text-efan-primary">{copy.emptyTitle}</h3>
                <p className="font-bold text-gray-400">{copy.emptyDescription}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-black text-efan-primary">{copy.title}</h3>

            <div className="space-y-10">
                {(['signed', 'construction', 'invoice', 'unpaid'] as const).map((type) => {
                    const items = grouped[type];
                    if (items.length === 0) return null;

                    return (
                        <div key={type} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="flex items-center gap-2 font-black text-gray-900">
                                    {typeLabels[type].title}
                                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-500">
                                        {items.length} {copy.countSuffix}
                                    </span>
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => router.push(withReturnTo(`/admin/quotes/${item.quoteNumber}`, returnTo))}
                                        className="group flex cursor-pointer items-center justify-between rounded-2xl border border-transparent bg-gray-50 p-4 transition-all hover:border-efan-primary/20 hover:bg-white hover:shadow-md"
                                    >
                                        <div className="mr-4 flex flex-col gap-1 overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-efan-primary">{item.quoteNumber}</span>
                                                <span className="truncate text-sm font-bold text-gray-700">{item.customerName}</span>
                                                {item.status && statusLabels[item.status] && (
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
                                                            statusLabels[item.status].color,
                                                            statusLabels[item.status].bg
                                                        )}
                                                    >
                                                        {statusLabels[item.status].label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                                                <span className="shrink-0">{item.dueDate}</span>
                                                {item.quoteName ? (
                                                    <>
                                                        <span className="text-gray-300">/</span>
                                                        <span className="truncate">{item.quoteName}</span>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <div className="font-black text-efan-secondary">{formatCurrency(item.amount)}</div>
                                            <div className={cn('text-[11px] font-black uppercase tracking-tighter', getDayColor(item.daysSince))}>
                                                {typeLabels[type].label} {item.daysSince} {copy.daySuffix}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
