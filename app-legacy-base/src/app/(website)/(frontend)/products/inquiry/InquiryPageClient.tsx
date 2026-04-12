'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useInquiry } from '@/components/products/InquiryContext';
import { Turnstile } from '@marsidev/react-turnstile';
import PageBanner from '@/components/common/PageBanner';

export default function InquiryPageClient() {
    const { items, removeItem, updateQuantity, clearAll, totalCount } = useInquiry();
    const [form, setForm] = useState({ companyName: '', contactName: '', mobile: '', email: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; quoteNumber?: string; error?: string } | null>(null);
    const [honeypot, setHoneypot] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');
    const [siteConfig, setSiteConfig] = useState<{ turnstileEnabled: boolean; turnstileSiteKey: string | null }>({
        turnstileEnabled: false,
        turnstileSiteKey: null,
    });

    useEffect(() => {
        fetch('/api/public/site-config')
            .then(r => r.json())
            .then(setSiteConfig)
            .catch(() => {});
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.contactName.trim() || !form.mobile.trim() || !form.email.trim()) return;
        if (items.length === 0) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/public/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: form.companyName || null,
                    contactName: form.contactName,
                    mobile: form.mobile,
                    email: form.email || null,
                    message: form.message || null,
                    items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                    website: honeypot || undefined,
                    turnstileToken: turnstileToken || undefined,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setResult({ success: true, quoteNumber: data.quoteNumber });
                clearAll();
            } else {
                setResult({ success: false, error: data.error || '提交失敗' });
            }
        } catch {
            setResult({ success: false, error: '網路連線異常，請稍後再試' });
        } finally {
            setSubmitting(false);
        }
    };

    // Success state
    if (result?.success) {
        return (
            <div className="flex flex-col w-full">
                <section className="py-32 text-center">
                    <div className="max-w-lg mx-auto px-4">
                        <div className="text-6xl mb-6">✅</div>
                        <h1 className="text-3xl font-black text-efan-primary mb-4">感謝您的詢價！</h1>
                        <p className="text-gray-500 text-lg mb-4">
                            我們已收到您的需求，將盡快為您報價。
                        </p>
                        {result.quoteNumber && (
                            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                                <div className="text-sm text-gray-400 mb-1">報價單編號</div>
                                <div className="text-2xl font-black font-mono text-efan-primary">{result.quoteNumber}</div>
                            </div>
                        )}
                        <Link
                            href="/products"
                            className="inline-block bg-efan-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-efan-primary-light transition-colors"
                        >
                            繼續瀏覽產品
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full">
            {/* Hero */}
            <PageBanner title="您的詢價清單" subtitle="選好產品後填寫聯絡資訊即可送出" />

            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {items.length === 0 ? (
                        /* Empty state */
                        <div className="text-center py-20">
                            <div className="text-5xl mb-4">📋</div>
                            <h2 className="text-2xl font-bold text-gray-400 mb-2">您還沒有選擇任何產品</h2>
                            <p className="text-gray-400 mb-8">瀏覽我們的產品目錄，點擊「加入詢價」即可加入清單</p>
                            <Link
                                href="/products"
                                className="inline-block bg-efan-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-efan-primary-light transition-colors"
                            >
                                瀏覽產品目錄
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                            {/* Product List — 3 columns */}
                            <div className="lg:col-span-3">
                                <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h2 className="font-bold text-gray-700">產品清單 ({totalCount} 項)</h2>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {items.map(item => (
                                            <div key={item.productId} className="flex items-center gap-4 p-4 sm:p-6">
                                                {/* Image */}
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl flex-shrink-0 relative overflow-hidden border border-gray-100">
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            fill
                                                            className="object-contain p-1"
                                                            sizes="80px"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">📦</div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-gray-900 truncate">{item.name}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {[item.brand, item.model].filter(Boolean).join(' / ')}
                                                    </div>
                                                </div>

                                                {/* Quantity */}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors font-bold"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                                        className="w-12 h-8 text-center border border-gray-200 rounded-lg text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        min={1}
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors font-bold"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                {/* Remove */}
                                                <button
                                                    onClick={() => removeItem(item.productId)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    title="移除"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Form — 2 columns */}
                            <div className="lg:col-span-2">
                                <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl border border-gray-100 p-6 sticky top-24">
                                    <h2 className="font-bold text-gray-700 mb-6">聯絡資訊</h2>

                                    {result?.error && (
                                        <div className="bg-red-50 text-red-700 text-sm rounded-xl p-4 mb-4 font-medium">
                                            {result.error}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-600 mb-1">
                                                聯絡人姓名 <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={form.contactName}
                                                onChange={(e) => setForm(f => ({ ...f, contactName: e.target.value }))}
                                                placeholder="您的姓名"
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-efan-accent/20 focus:border-efan-accent outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-600 mb-1">
                                                手機號碼 <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                value={form.mobile}
                                                onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))}
                                                placeholder="0912-345-678"
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-efan-accent/20 focus:border-efan-accent outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-600 mb-1">公司名稱</label>
                                            <input
                                                type="text"
                                                value={form.companyName}
                                                onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))}
                                                placeholder="選填"
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-efan-accent/20 focus:border-efan-accent outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-600 mb-1">
                                                Email <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={form.email}
                                                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                                placeholder="name@example.com"
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-efan-accent/20 focus:border-efan-accent outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-600 mb-1">補充說明</label>
                                            <textarea
                                                value={form.message}
                                                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                                                placeholder="有任何需求或問題請在此說明"
                                                rows={3}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-efan-accent/20 focus:border-efan-accent outline-none transition-all text-sm resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || items.length === 0}
                                        className="w-full mt-6 bg-efan-accent hover:bg-efan-accent-dark disabled:bg-gray-300 text-white py-4 rounded-xl font-black text-lg transition-all active:scale-95 shadow-xl disabled:shadow-none"
                                    >
                                        {submitting ? '送出中...' : `送出詢價 (${totalCount} 項)`}
                                    </button>

                                    {/* Honeypot */}
                                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                                        <label htmlFor="website_inq">Website</label>
                                        <input
                                            type="text"
                                            name="website"
                                            id="website_inq"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={honeypot}
                                            onChange={e => setHoneypot(e.target.value)}
                                        />
                                    </div>

                                    {/* Turnstile */}
                                    {siteConfig.turnstileEnabled && siteConfig.turnstileSiteKey && (
                                        <div className="mt-4">
                                            <Turnstile
                                                siteKey={siteConfig.turnstileSiteKey}
                                                onSuccess={setTurnstileToken}
                                            />
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 text-center mt-3">
                                        提交後我們將在一個工作天內聯繫您
                                    </p>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
