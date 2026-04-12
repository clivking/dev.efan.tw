'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface Payment {
    id: string;
    type: 'deposit' | 'final' | 'full';
    amount: number;
    method: 'transfer' | 'cash' | 'check';
    paidAt: string;
    notes?: string;
    recorder?: { name: string };
}

interface PaymentRecordPanelProps {
    quoteId: string;
    totalAmount: number;
    status: string;
    onChangeStatus: (status: string) => void;
}

const PAYMENT_TYPES = [
    { id: 'deposit', name: '訂金 (Deposit)' },
    { id: 'final', name: '尾款 (Final)' },
    { id: 'full', name: '全額 (Full)' },
];

const PAYMENT_METHODS = [
    { id: 'transfer', name: '匯款 (Transfer)' },
    { id: 'cash', name: '現金 (Cash)' },
    { id: 'check', name: '支票 (Check)' },
];

export default function PaymentRecordPanel({ quoteId, totalAmount, status, onChangeStatus }: PaymentRecordPanelProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [summary, setSummary] = useState({ totalAmount: 0, paidAmount: 0, remainingAmount: 0, isOverpaid: false });
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        type: 'deposit' as any,
        amount: '',
        method: 'transfer' as any,
        paidAt: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const fetchPayments = useCallback(async () => {
        try {
            const res = await fetch(`/api/quotes/${quoteId}/payments`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments || []);
                if (data.summary) setSummary(data.summary);
            }
        } catch (e) {
            console.error('Fetch payments error:', e);
        } finally {
            setLoading(false);
        }
    }, [quoteId]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleTypeChange = (type: string) => {
        let amount = form.amount;
        if (type === 'full') {
            // Use summary.totalAmount from API as primary, prop as fallback
            const fullVal = summary.totalAmount > 0 ? summary.totalAmount : totalAmount;
            amount = fullVal.toString();
        } else if (type === 'final') {
            amount = Math.max(0, summary.remainingAmount).toString();
        }
        setForm({ ...form, type, amount });
    };

    const handleEdit = (p: Payment) => {
        setEditingId(p.id);
        setForm({
            type: p.type,
            amount: p.amount.toString(),
            method: p.method,
            paidAt: new Date(p.paidAt).toISOString().split('T')[0],
            notes: p.notes || ''
        });
        setShowAdd(true);
    };

    const handleSave = async () => {
        if (!form.amount || Number(form.amount) <= 0) {
            toast.error('請輸入有效的金額');
            return;
        }
        setSaving(true);
        try {
            const url = editingId ? `/api/quotes/payments/${editingId}` : `/api/quotes/${quoteId}/payments`;
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: Number(form.amount)
                })
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(editingId ? '已更新紀錄' : '已記錄收款');
                setShowAdd(false);
                setEditingId(null);
                setForm({ ...form, amount: '', notes: '' });
                fetchPayments();
            } else {
                toast.error('儲存失敗');
            }
        } catch (e) {
            toast.error('發生錯誤');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('確定要刪除此收款紀錄嗎？')) return;
        try {
            const res = await fetch(`/api/quotes/payments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('已刪除紀錄');
                fetchPayments();
            }
        } catch (e) {
            toast.error('刪除失敗');
        }
    };

    const handleDownloadReceipt = (paymentId: string) => {
        window.open(`/api/quotes/${quoteId}/receipt-pdf?paymentId=${paymentId}`, '_blank');
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">收款紀錄 (Payments)</h3>
                <button
                    onClick={() => {
                        if (showAdd) {
                            setEditingId(null);
                            setForm({ ...form, amount: '', notes: '' });
                        }
                        setShowAdd(!showAdd);
                    }}
                    className="text-[10px] font-black bg-efan-primary/5 text-efan-primary px-3 py-1 rounded-full hover:bg-efan-primary hover:text-white transition-all"
                >
                    {showAdd ? '取消' : '+ 新增'}
                </button>
            </div>

            {showAdd && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-gray-500">{editingId ? '編輯收款' : '新增收款'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">類型</label>
                            <select
                                value={form.type}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="w-full bg-white border-none rounded-lg py-1.5 px-2 text-xs font-bold focus:ring-2 focus:ring-efan-primary"
                            >
                                {PAYMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">日期</label>
                            <input
                                type="date"
                                value={form.paidAt}
                                onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
                                max="9999-12-31"
                                className="w-full bg-white border-none rounded-lg py-1.5 px-2 text-xs font-bold focus:ring-2 focus:ring-efan-primary"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">金額</label>
                            <input
                                type="number"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                className="w-full bg-white border-none rounded-lg py-1.5 px-2 text-xs font-bold focus:ring-2 focus:ring-efan-primary"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">方式</label>
                            <select
                                value={form.method}
                                onChange={(e) => setForm({ ...form, method: e.target.value as any })}
                                className="w-full bg-white border-none rounded-lg py-1.5 px-2 text-xs font-bold focus:ring-2 focus:ring-efan-primary"
                            >
                                {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">備註</label>
                        <input
                            type="text"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="w-full bg-white border-none rounded-lg py-1.5 px-2 text-xs font-bold focus:ring-2 focus:ring-efan-primary"
                            placeholder="付款註記..."
                        />
                    </div>

                    <button
                        disabled={saving}
                        onClick={handleSave}
                        className="w-full py-2 bg-efan-primary text-white rounded-xl text-xs font-black shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? '儲存中...' : '確認儲存'}
                    </button>
                </div>
            )}

            {/* Summary info */}
            <div className="flex justify-between items-center p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                <div>
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">已收總額</div>
                    <div className="text-sm font-black text-indigo-600">NT$ {summary.paidAmount.toLocaleString()}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">剩餘待收</div>
                    <div className={`text-sm font-black ${summary.remainingAmount <= 0 ? 'text-green-500' : 'text-gray-600'}`}>
                        NT$ {summary.remainingAmount.toLocaleString()}
                    </div>
                </div>
            </div>

            {summary.isOverpaid && (
                <div className="p-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-[10px] font-black text-center animate-bounce">
                    ⚠️ 注意：付款總額已超過報價金額！
                </div>
            )}

            {summary.remainingAmount <= 0 && status !== 'paid' && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 animate-pulse flex flex-col gap-2">
                    <div className="text-[10px] font-black text-amber-600 text-center">✨ 收款已全數完成！建議更新狀態 ✨</div>
                    <button
                        onClick={() => onChangeStatus('paid')}
                        className="w-full py-2 bg-amber-500 text-white rounded-xl text-xs font-black shadow-sm hover:bg-amber-600 transition-all"
                    >
                        切換至「已付款 / 結案」
                    </button>
                </div>
            )}

            {/* Payments List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {loading ? (
                    <div className="text-center py-4 text-xs text-gray-400">讀取中...</div>
                ) : payments.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-400 italic">尚未有收款紀錄</div>
                ) : (
                    payments.map(p => (
                        <div key={p.id} className="group p-3 bg-white border border-gray-50 rounded-2xl hover:border-efan-primary/20 transition-all relative">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${p.type === 'deposit' ? 'bg-blue-50 text-blue-500' :
                                    p.type === 'final' ? 'bg-purple-50 text-purple-500' : 'bg-green-50 text-green-500'
                                    }`}>
                                    {PAYMENT_TYPES.find(t => t.id === p.type)?.name.split(' ')[0]}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 italic">
                                    {new Date(p.paidAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-sm font-black text-gray-700">NT$ {Number(p.amount).toLocaleString()}</div>
                                <div className="text-[10px] font-bold text-gray-400">{PAYMENT_METHODS.find(m => m.id === p.method)?.name.split(' ')[0]}</div>
                            </div>
                            {p.notes && <div className="text-[10px] text-gray-400 mt-1 truncate">{p.notes}</div>}

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => handleDownloadReceipt(p.id)}
                                    className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-sm hover:bg-emerald-500 hover:text-white"
                                    title="Receipt"
                                >
                                    R
                                </button>
                                <button
                                    onClick={() => handleEdit(p)}
                                    className="w-5 h-5 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shadow-sm hover:bg-blue-500 hover:text-white"
                                >
                                    ✎
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="w-5 h-5 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-500 hover:text-white"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
