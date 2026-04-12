'use client';

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface MonthlyTrendData {
    month: string;
    label: string;
    revenue: number;
    cost: number;
    profit: number;
    signedCount: number;
    quoteCount: number;
}

interface MonthlyRevenueChartProps {
    loading: boolean;
    data: MonthlyTrendData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const revenue = payload[0].value;
        const cost = payload[1].value;
        const profit = revenue - cost;

        return (
            <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-2xl">
                <p className="font-black text-gray-900 mb-2 border-bottom pb-1">{label}</p>
                <p className="text-sm font-bold text-blue-600">營收: ${revenue.toLocaleString()}</p>
                <p className="text-sm font-bold text-gray-400">成本: ${cost.toLocaleString()}</p>
                <div className="mt-2 pt-2 border-t border-gray-50">
                    <p className="text-sm font-black text-green-600">毛利: ${profit.toLocaleString()}</p>
                </div>
            </div>
        );
    }
    return null;
};

export default function MonthlyRevenueChart({ loading, data }: MonthlyRevenueChartProps) {
    const allZero = data.every(d => d.revenue === 0);

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm h-full min-h-[400px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-64 h-4 bg-gray-100 rounded"></div>
                    <div className="w-full h-48 bg-gray-50 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (allZero) {
        return (
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400">
                <span className="text-4xl mb-4">📈</span>
                <p className="font-bold">尚無營收資料</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-efan-primary flex items-center gap-2">
                    <span>📈</span> 近12個月月營收趨勢
                </h3>
            </div>

            <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 700 }}
                            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}K`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: 20, fontSize: 12, fontWeight: 700 }}
                        />
                        <Bar dataKey="revenue" name="營收" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
                        <Bar dataKey="cost" name="成本" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
