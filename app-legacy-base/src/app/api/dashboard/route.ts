import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { DEAL_WON_STATUSES } from '@/lib/quote-status';
import { getSetting } from '@/lib/settings';
import { addDays, differenceInDays, endOfDay, endOfMonth, format, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const now = new Date();
            const monthRange = await getSetting('dashboard_month_range', 12);

            const thisMonthStart = startOfMonth(now);
            const last30DaysStart = startOfDay(subDays(now, 29));
            const last30DaysEnd = endOfDay(now);
            const previous30DaysStart = startOfDay(subDays(now, 59));
            const previous30DaysEnd = endOfDay(subDays(now, 30));

            const [monthlyNewQuotes, recentQuotes] = await Promise.all([
                prisma.quote.count({
                    where: {
                        createdAt: { gte: thisMonthStart },
                        isDeleted: false,
                        isSuperseded: false,
                    }
                }),
                prisma.quote.findMany({
                    where: { isDeleted: false },
                    orderBy: { updatedAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        quoteNumber: true,
                        name: true,
                        status: true,
                        updatedAt: true,
                        totalAmount: true,
                        customer: {
                            select: {
                                companyNames: { where: { isPrimary: true }, take: 1, select: { companyName: true } },
                                contacts: { where: { isPrimary: true }, take: 1, select: { name: true } },
                            }
                        }
                    }
                })
            ]);

            const trendMonths = [];
            for (let i = monthRange - 1; i >= 0; i--) {
                const d = subMonths(now, i);
                trendMonths.push({
                    start: startOfMonth(d),
                    end: endOfMonth(d),
                    monthStr: format(d, 'yyyy-MM'),
                    label: format(d, 'yyyy/MM'),
                });
            }

            const rangeStart = trendMonths[0].start;
            const wonQuotes = await prisma.quote.findMany({
                where: {
                    isDeleted: false,
                    isSuperseded: false,
                    status: { in: DEAL_WON_STATUSES as any },
                    OR: [
                        { signedAt: { gte: rangeStart } },
                        { paidAt: { gte: rangeStart } },
                        { completedAt: { gte: rangeStart } },
                    ]
                },
                select: {
                    totalAmount: true,
                    actualProfit: true,
                    totalCost: true,
                    signedAt: true,
                    paidAt: true,
                    completedAt: true,
                    createdAt: true,
                }
            });

            const getQuoteRevenueDate = (q: any) => q.signedAt || q.paidAt || q.completedAt || q.createdAt;
            const getQuoteRevenueMonth = (q: any) => format(getQuoteRevenueDate(q), 'yyyy-MM');

            const monthlyTrend = trendMonths.map((m) => {
                const monthQuotes = wonQuotes.filter(q => getQuoteRevenueMonth(q) === m.monthStr);
                return {
                    month: m.monthStr,
                    label: m.label,
                    revenue: Math.round(monthQuotes.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0)),
                    cost: Math.round(monthQuotes.reduce((sum, q) => sum + Number(q.totalCost || 0), 0)),
                    profit: Math.round(monthQuotes.reduce((sum, q) => sum + Number(q.actualProfit || 0), 0)),
                    signedCount: monthQuotes.length,
                    quoteCount: 0,
                };
            });

            const monthlyNewQuotesCounts = await Promise.all(trendMonths.map((m) =>
                prisma.quote.count({
                    where: {
                        createdAt: { gte: m.start, lte: m.end },
                        isDeleted: false,
                        isSuperseded: false,
                    }
                })
            ));

            monthlyTrend.forEach((m, idx) => {
                m.quoteCount = monthlyNewQuotesCounts[idx];
            });

            const summarizeWindow = (start: Date, end: Date) => {
                const periodWonQuotes = wonQuotes.filter(q => {
                    const revenueDate = getQuoteRevenueDate(q);
                    return revenueDate && revenueDate >= start && revenueDate <= end;
                });

                return {
                    revenue: Math.round(periodWonQuotes.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0)),
                    cost: Math.round(periodWonQuotes.reduce((sum, q) => sum + Number(q.totalCost || 0), 0)),
                    profit: Math.round(periodWonQuotes.reduce((sum, q) => sum + Number(q.actualProfit || 0), 0)),
                    signedCount: periodWonQuotes.length,
                    quoteCount: 0,
                };
            };

            const [last30DayQuoteCount, previous30DayQuoteCount] = await Promise.all([
                prisma.quote.count({
                    where: {
                        createdAt: { gte: last30DaysStart, lte: last30DaysEnd },
                        isDeleted: false,
                        isSuperseded: false,
                    }
                }),
                prisma.quote.count({
                    where: {
                        createdAt: { gte: previous30DaysStart, lte: previous30DaysEnd },
                        isDeleted: false,
                        isSuperseded: false,
                    }
                }),
            ]);

            const thisMonthData = {
                ...summarizeWindow(last30DaysStart, last30DaysEnd),
                quoteCount: last30DayQuoteCount || monthlyNewQuotes,
            };
            const lastMonthData = {
                ...summarizeWindow(previous30DaysStart, previous30DaysEnd),
                quoteCount: previous30DayQuoteCount,
            };

            const funnelCounts = await prisma.quote.groupBy({
                by: ['status'],
                _count: true,
                where: { isDeleted: false, isSuperseded: false },
            });
            const statusFunnel: Record<string, number> = {
                draft: 0,
                confirmed: 0,
                sent: 0,
                signed: 0,
                construction: 0,
                completed: 0,
                paid: 0,
            };
            funnelCounts.forEach(c => {
                if (Object.prototype.hasOwnProperty.call(statusFunnel, c.status)) {
                    statusFunnel[c.status as string] = c._count;
                }
            });

            const signedQuotes = await prisma.quote.findMany({
                where: {
                    status: 'signed',
                    isDeleted: false,
                    isSuperseded: false,
                },
                include: {
                    customer: { select: { companyNames: { where: { isPrimary: true }, take: 1, select: { companyName: true } } } },
                    contacts: { where: { isPrimary: true }, take: 1, include: { contact: { select: { name: true } } } },
                },
                orderBy: { signedAt: 'asc' },
                take: 20,
            }).then(quotes => quotes.map(q => ({
                id: q.id,
                type: 'signed' as const,
                quoteNumber: q.quoteNumber,
                quoteName: q.name || '',
                customerName: q.customer?.companyNames[0]?.companyName || q.contacts[0]?.contact?.name || '未指定客戶',
                amount: Math.round(Number(q.totalAmount)),
                daysSince: q.signedAt ? differenceInDays(now, q.signedAt as Date) : 0,
                dueDate: q.signedAt ? format(q.signedAt as Date, 'yyyy-MM-dd') : '',
                status: q.status,
            })));

            const constructionQuotes = await prisma.quote.findMany({
                where: {
                    status: 'construction',
                    isDeleted: false,
                    isSuperseded: false,
                },
                include: {
                    customer: { select: { companyNames: { where: { isPrimary: true }, take: 1, select: { companyName: true } } } },
                    contacts: { where: { isPrimary: true }, take: 1, include: { contact: { select: { name: true } } } },
                },
                orderBy: { constructionAt: 'asc' },
                take: 20,
            }).then(quotes => quotes.map(q => ({
                id: q.id,
                type: 'construction' as const,
                quoteNumber: q.quoteNumber,
                quoteName: q.name || '',
                customerName: q.customer?.companyNames[0]?.companyName || q.contacts[0]?.contact?.name || '未指定客戶',
                amount: Math.round(Number(q.totalAmount)),
                daysSince: (q.constructionAt || q.signedAt) ? differenceInDays(now, (q.constructionAt || q.signedAt) as Date) : 0,
                dueDate: (q.constructionAt || q.signedAt) ? format((q.constructionAt || q.signedAt) as Date, 'yyyy-MM-dd') : '',
                status: q.status,
            })));

            const unpaidQuotes = await prisma.quote.findMany({
                where: {
                    status: { in: ['completed'] },
                    isDeleted: false,
                    isSuperseded: false,
                    OR: [
                        { payments: { none: {} } },
                        { paidAt: null },
                    ],
                },
                include: {
                    customer: { select: { companyNames: { where: { isPrimary: true }, take: 1, select: { companyName: true } } } },
                    contacts: { where: { isPrimary: true }, take: 1, include: { contact: { select: { name: true } } } },
                    payments: true,
                },
                orderBy: { signedAt: 'asc' },
                take: 20,
            });

            const actualUnpaid = unpaidQuotes
                .filter(q => {
                    const paidSum = q.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                    return Number(q.totalAmount) - paidSum > 0;
                })
                .map(q => ({
                    id: q.id,
                    type: 'unpaid' as const,
                    quoteNumber: q.quoteNumber,
                    quoteName: q.name || '',
                    customerName: q.customer?.companyNames[0]?.companyName || q.contacts[0]?.contact?.name || '未指定客戶',
                    amount: Math.round(Number(q.totalAmount)),
                    daysSince: (q.completedAt || q.signedAt) ? differenceInDays(now, (q.completedAt || q.signedAt) as Date) : 0,
                    dueDate: (q.completedAt || q.signedAt) ? format((q.completedAt || q.signedAt) as Date, 'yyyy-MM-dd') : '',
                    status: q.status,
                }));

            const invoicePendingQuotes = await prisma.quote.findMany({
                where: {
                    status: 'completed',
                    taxRate: { gt: 0 },
                    invoiceIssuedAt: null,
                    isDeleted: false,
                    isSuperseded: false,
                },
                include: {
                    customer: { select: { companyNames: { where: { isPrimary: true }, take: 1, select: { companyName: true } } } },
                    contacts: { where: { isPrimary: true }, take: 1, include: { contact: { select: { name: true } } } },
                },
                orderBy: [{ completedAt: 'asc' }, { constructionAt: 'asc' }],
                take: 20,
            }).then(quotes => quotes.map(q => ({
                id: q.id,
                type: 'invoice' as const,
                quoteNumber: q.quoteNumber,
                quoteName: q.name || '',
                customerName: q.customer?.companyNames[0]?.companyName || q.contacts[0]?.contact?.name || '未指定客戶',
                amount: Math.round(Number(q.totalAmount)),
                daysSince: (q.completedAt || q.constructionAt || q.signedAt) ? differenceInDays(now, (q.completedAt || q.constructionAt || q.signedAt) as Date) : 0,
                dueDate: (q.completedAt || q.constructionAt || q.signedAt) ? format((q.completedAt || q.constructionAt || q.signedAt) as Date, 'yyyy-MM-dd') : '',
                status: q.status,
            })));

            const pendingActions = [...signedQuotes, ...constructionQuotes, ...invoicePendingQuotes, ...actualUnpaid]
                .sort((a, b) => {
                    const typeOrder: Record<string, number> = { signed: 0, construction: 1, invoice: 2, unpaid: 3 };
                    if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
                    return b.daysSince - a.daysSince;
                })
                .slice(0, 30);

            const unpaidStats = await prisma.quote.findMany({
                where: { status: { in: ['completed'] }, isDeleted: false, isSuperseded: false },
                include: { payments: { select: { amount: true } } },
            });
            const unpaidSummary = {
                count: actualUnpaid.length,
                amount: unpaidStats.reduce((sum, q) => {
                    const paid = q.payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
                    const balance = Number(q.totalAmount) - paid;
                    return sum + (balance > 0 ? balance : 0);
                }, 0)
            };

            const [constructionStats, invoicePendingStats, warrantyExpiringStats] = await Promise.all([
                prisma.quote.aggregate({
                    _count: true,
                    _sum: { totalAmount: true },
                    where: {
                        status: 'construction',
                        isDeleted: false,
                        isSuperseded: false,
                    }
                }),
                prisma.quote.aggregate({
                    _count: true,
                    _sum: { totalAmount: true },
                    where: {
                        status: 'completed',
                        taxRate: { gt: 0 },
                        invoiceIssuedAt: null,
                        isDeleted: false,
                        isSuperseded: false,
                    }
                }),
                prisma.quote.aggregate({
                    _count: true,
                    _sum: { totalAmount: true },
                    where: {
                        status: { in: ['completed', 'paid'] },
                        warrantyMonths: { not: 0 },
                        warrantyStartDate: { not: null },
                        warrantyExpiresAt: {
                            gte: new Date(),
                            lte: endOfDay(addDays(new Date(), 30)),
                        },
                        isDeleted: false,
                        isSuperseded: false,
                    }
                })
            ]);

            return NextResponse.json({
                summary: {
                    thisMonth: {
                        revenue: thisMonthData.revenue,
                        cost: thisMonthData.cost,
                        profit: thisMonthData.profit,
                        quoteCount: thisMonthData.quoteCount,
                        signedCount: thisMonthData.signedCount,
                        conversionRate: thisMonthData.quoteCount > 0 ? (thisMonthData.signedCount / thisMonthData.quoteCount) * 100 : 0,
                    },
                    lastMonth: {
                        revenue: lastMonthData.revenue,
                        cost: lastMonthData.cost,
                        profit: lastMonthData.profit,
                        quoteCount: lastMonthData.quoteCount,
                        signedCount: lastMonthData.signedCount,
                        conversionRate: lastMonthData.quoteCount > 0 ? (lastMonthData.signedCount / lastMonthData.quoteCount) * 100 : 0,
                    },
                    unpaid: {
                        count: unpaidSummary.count,
                        amount: Math.round(unpaidSummary.amount),
                    },
                    invoicePending: {
                        count: Number(invoicePendingStats._count || 0),
                        amount: Math.round(Number(invoicePendingStats._sum?.totalAmount || 0)),
                    },
                    warrantyExpiring: {
                        count: Number(warrantyExpiringStats._count || 0),
                        amount: Math.round(Number(warrantyExpiringStats._sum?.totalAmount || 0)),
                    },
                    construction: {
                        count: Number(constructionStats._count || 0),
                        amount: Math.round(Number(constructionStats._sum?.totalAmount || 0)),
                    }
                },
                monthlyTrend,
                statusFunnel,
                pendingActions,
                recentQuotes: recentQuotes.map(q => ({
                    id: q.id,
                    quoteNumber: q.quoteNumber,
                    name: q.name,
                    status: q.status,
                    updatedAt: q.updatedAt,
                    totalAmount: Number(q.totalAmount || 0),
                    customerName: q.customer?.companyNames[0]?.companyName || q.customer?.contacts[0]?.name || '未指定客戶',
                }))
            });
        } catch (error) {
            console.error('Dashboard API Error:', error);
            return NextResponse.json({ error: '讀取 dashboard 失敗' }, { status: 500 });
        }
    });
}
