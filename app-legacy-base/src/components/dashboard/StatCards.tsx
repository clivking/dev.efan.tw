'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { adminCaseCopy } from '@/lib/admin-case-copy';
import { cn } from '@/lib/utils';

interface StatCardsProps {
  loading: boolean;
  summary: {
    thisMonth: {
      revenue: number;
      cost: number;
      profit: number;
      quoteCount: number;
      signedCount: number;
      conversionRate: number;
    };
    lastMonth: {
      revenue: number;
      cost: number;
      profit: number;
      quoteCount: number;
      signedCount: number;
      conversionRate: number;
    };
    unpaid: {
      count: number;
      amount: number;
    };
    invoicePending: {
      count: number;
      amount: number;
    };
    warrantyExpiring: {
      count: number;
      amount: number;
    };
    construction: {
      count: number;
      amount: number;
    };
  };
}

export default function StatCards({ loading, summary }: StatCardsProps) {
  const router = useRouter();
  const copy = adminCaseCopy.statCards;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(Math.round(val));

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 'new' : 0;
    return ((current - previous) / previous) * 100;
  };

  const renderTrend = (change: number | 'new') => {
    if (change === 'new') return <span className="ml-2 font-bold text-blue-500">NEW</span>;
    if (change === 0 || Math.abs(change) < 1) return <span className="ml-2 font-bold text-gray-400">持平</span>;

    const isUp = change > 0;
    const absChange = Math.abs(change).toFixed(0);

    return (
      <span className={cn('ml-2 font-bold', isUp ? 'text-green-500' : 'text-red-500')}>
        {isUp ? '上升' : '下降'} {absChange}%
      </span>
    );
  };

  const cards = [
    {
      title: copy.revenue,
      value: formatCurrency(summary.thisMonth.revenue),
      sub: renderTrend(calculateChange(summary.thisMonth.revenue, summary.lastMonth.revenue)),
      tone: 'text-green-600',
    },
    {
      title: copy.cost,
      value: formatCurrency(summary.thisMonth.cost),
      sub: renderTrend(calculateChange(summary.thisMonth.cost, summary.lastMonth.cost)),
      tone: 'text-gray-500',
    },
    {
      title: copy.profit,
      value: formatCurrency(summary.thisMonth.profit),
      sub: renderTrend(calculateChange(summary.thisMonth.profit, summary.lastMonth.profit)),
      tone: 'text-blue-600',
    },
    {
      title: copy.signed,
      value: `${summary.thisMonth.signedCount} ${copy.itemSuffix}`,
      sub: `${copy.conversionPrefix} ${summary.thisMonth.conversionRate.toFixed(1)}%`,
      tone: 'text-purple-600',
    },
    {
      title: copy.invoicePending,
      value: `${summary.invoicePending.count} ${copy.itemSuffix}`,
      sub: formatCurrency(summary.invoicePending.amount),
      tone: 'text-rose-600',
      onClick: () => router.push('/admin/quotes?invoiceStatus=pending'),
    },
    {
      title: copy.warrantyExpiring,
      value: `${summary.warrantyExpiring.count} ${copy.itemSuffix}`,
      sub: formatCurrency(summary.warrantyExpiring.amount),
      tone: 'text-teal-600',
      onClick: () => router.push('/admin/quotes?warrantyStatus=expiring_30'),
    },
    {
      title: copy.construction,
      value: `${summary.construction.count} ${copy.itemSuffix}`,
      sub: formatCurrency(summary.construction.amount),
      tone: 'text-violet-600',
      onClick: () => router.push('/admin/quotes?status=construction'),
    },
    {
      title: copy.unpaid,
      value: `${summary.unpaid.count} ${copy.itemSuffix}`,
      sub: formatCurrency(summary.unpaid.amount),
      tone: 'text-orange-600',
      onClick: () => router.push('/admin/quotes?status=completed'),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 xl:grid-cols-8">
      {cards.map((card, index) => (
        <div
          key={index}
          onClick={card.onClick}
          className={cn(
            'rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-xl hover:shadow-efan-primary/5',
            card.onClick ? 'cursor-pointer hover:border-efan-primary/20' : '',
          )}
        >
          <div className="mb-3 h-1.5 w-10 rounded-full bg-gray-100" />
          <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">{card.title}</div>
          <div className={cn('mb-1 truncate font-mono text-xl font-black', card.tone)}>
            {loading ? <span className="rounded bg-gray-100 text-transparent">000,000</span> : card.value}
          </div>
          <div className="flex items-center text-xs font-bold text-gray-500">
            {loading ? <span className="w-16 rounded bg-gray-100 text-transparent">Loading</span> : card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
