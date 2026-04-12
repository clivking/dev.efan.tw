'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import QuoteStatusBadge from '@/components/admin/quotes/QuoteStatusBadge';
import MonthlyRevenueChart from '@/components/dashboard/MonthlyRevenueChart';
import PendingActions from '@/components/dashboard/PendingActions';
import StatCards from '@/components/dashboard/StatCards';
import { buildReturnTo, withReturnTo } from '@/lib/admin-return-to';
import { adminCaseCopy } from '@/lib/admin-case-copy';

export default function DashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const copy = adminCaseCopy.dashboard;
  const returnTo = buildReturnTo(pathname, searchParams);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(Math.round(val));

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const summary = data?.summary || {
    thisMonth: { revenue: 0, cost: 0, profit: 0, quoteCount: 0, signedCount: 0, conversionRate: 0 },
    lastMonth: { revenue: 0, cost: 0, profit: 0, quoteCount: 0, signedCount: 0, conversionRate: 0 },
    unpaid: { count: 0, amount: 0 },
    invoicePending: { count: 0, amount: 0 },
    warrantyExpiring: { count: 0, amount: 0 },
    construction: { count: 0, amount: 0 },
  };

  const monthlyTrend = data?.monthlyTrend || [];
  const pendingActions = data?.pendingActions || [];
  const recentQuotes = data?.recentQuotes || [];

  return (
    <div className="animate-in fade-in space-y-10 pb-12 duration-700">
      <div>
        <h1 className="mb-2 text-3xl font-black tracking-tight text-efan-primary">{copy.title}</h1>
        <p className="font-medium text-gray-500">{copy.subtitle}</p>
      </div>

      <StatCards loading={loading} summary={summary} />
      <MonthlyRevenueChart loading={loading} data={monthlyTrend} />

      <div className="flex flex-col space-y-4 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xl font-black text-efan-primary">{copy.recentTitle}</h3>
          <button
            onClick={() => router.push('/admin/quotes')}
            className="rounded-full bg-transparent px-3 py-1.5 text-xs font-black uppercase tracking-widest text-gray-400 transition-colors hover:bg-gray-50 hover:text-efan-primary"
          >
            {copy.viewAll}
          </button>
        </div>

        <div className="hidden grid-cols-[120px_1fr_140px_130px_120px_90px] gap-4 border-b border-gray-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 sm:grid">
          <span>{copy.headers.caseNumber}</span>
          <span>{copy.headers.caseName}</span>
          <span>{copy.headers.customer}</span>
          <span>{copy.headers.updatedAt}</span>
          <span className="text-right">{copy.headers.amount}</span>
          <span className="text-right">{copy.headers.status}</span>
        </div>

        <div className="flex flex-1 flex-col space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 w-full animate-pulse rounded-2xl border border-gray-100 bg-gray-50/80" />
            ))
          ) : recentQuotes.length > 0 ? (
            recentQuotes.map((quote: any) => (
              <div
                key={quote.id}
                onClick={() => router.push(withReturnTo(`/admin/quotes/${quote.quoteNumber}`, returnTo))}
                className="group grid cursor-pointer grid-cols-[120px_1fr_140px_130px_120px_90px] items-center gap-4 rounded-2xl border bg-gray-50 p-3 px-4 transition-all hover:border-efan-primary/20 hover:bg-white hover:shadow-md hover:shadow-efan-primary/5 max-sm:flex max-sm:flex-wrap max-sm:gap-2"
              >
                <span className="text-sm font-black text-efan-primary group-hover:text-efan-primary/80">{quote.quoteNumber}</span>
                <span className="truncate text-sm font-bold text-gray-700">{quote.name || copy.unnamedCase}</span>
                <span className="max-w-[140px] truncate rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-bold text-gray-500">
                  {quote.customerName}
                </span>
                <span className="text-[11px] font-bold text-gray-400">{formatDate(quote.updatedAt)}</span>
                <span className="text-right text-sm font-black text-efan-secondary">{formatCurrency(quote.totalAmount)}</span>
                <div className="flex justify-end">
                  <div className="origin-right scale-90">
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center text-gray-400">
              <div className="mb-3 h-10 w-10 rounded-full bg-gray-100" />
              <p className="font-bold">{copy.empty}</p>
            </div>
          )}
        </div>
      </div>

      <PendingActions loading={loading} actions={pendingActions} />
    </div>
  );
}
