'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import SpecificationsEditor from '@/components/admin/products/SpecificationsEditor';
import VideoUrlInput from '@/components/admin/products/VideoUrlInput';
import FaqEditor from '@/components/admin/products/FaqEditor';
import DocumentUploader from '@/components/admin/products/DocumentUploader';
import { ADMIN_PRODUCT_COPY } from '@/lib/admin-product-copy';

const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), {
    ssr: false,
    loading: () => (
        <div className="rounded-2xl border border-gray-200 bg-white animate-pulse">
            <div className="h-12 bg-gray-50 rounded-t-2xl" />
            <div className="h-[300px]" />
        </div>
    ),
});

interface ContentData {
    content: any;
    specifications: any[];
    videoUrl: string;
    faqs: any[];
    seoRatingValue: string;
    seoRatingCount: string;
    seoReviews: any[];
}

export default function ProductContentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [productName, setProductName] = useState('');
    const [specTemplate, setSpecTemplate] = useState<any[] | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    const [data, setData] = useState<ContentData>({
        content: null,
        specifications: [],
        videoUrl: '',
        faqs: [],
        seoRatingValue: '',
        seoRatingCount: '',
        seoReviews: [],
    });

    useEffect(() => {
        fetch(`/api/products/${id}/content`)
            .then((res) => res.json())
            .then((result) => {
                if (result.product) {
                    setProductName(`${result.product.brand || ''} ${result.product.model || ''} ${result.product.name}`.trim());
                    setData({
                        content: result.product.content || null,
                        specifications: result.product.specifications || [],
                        videoUrl: result.product.videoUrl || '',
                        faqs: result.product.faqs || [],
                        seoRatingValue: result.product.seoRatingValue ?? '',
                        seoRatingCount: result.product.seoRatingCount ?? '',
                        seoReviews: result.product.seoReviews || [],
                    });
                    setSpecTemplate(result.specTemplate || null);
                    setDocuments(result.documents || []);
                }
            })
            .catch(() => toast.error(ADMIN_PRODUCT_COPY.common.fetchError))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (isDirty) {
            const handler = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = '';
            };
            window.addEventListener('beforeunload', handler);
            return () => window.removeEventListener('beforeunload', handler);
        }
    }, [isDirty]);

    const updateField = useCallback(<K extends keyof ContentData>(field: K, value: ContentData[K]) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setIsDirty(true);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/products/${id}/content`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast.success(ADMIN_PRODUCT_COPY.contentPage.saveSuccess);
                setIsDirty(false);
            } else {
                const err = await res.json();
                toast.error(err.error || ADMIN_PRODUCT_COPY.contentPage.saveError);
            }
        } catch {
            toast.error(ADMIN_PRODUCT_COPY.contentPage.saveError);
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (isDirty && !confirm(ADMIN_PRODUCT_COPY.common.confirmLeave)) return;
        router.push(`/admin/products/${id}/edit`);
    };

    if (loading) {
        return (
            <div className="py-48 flex flex-col items-center justify-center gap-6 animate-pulse">
                <div className="h-16 w-16 bg-efan-primary rounded-3xl animate-spin opacity-20" />
                <div className="text-xl font-black text-gray-400 tracking-widest uppercase">{ADMIN_PRODUCT_COPY.common.loading}</div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-efan-primary hover:text-white transition-all"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-efan-primary tracking-tight">{ADMIN_PRODUCT_COPY.contentPage.title}</h1>
                        <p className="text-sm text-gray-400 font-bold">{productName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isDirty && (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-xl border border-amber-100">
                            {ADMIN_PRODUCT_COPY.common.unsavedChanges}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-efan-primary text-white rounded-2xl font-black text-sm hover:bg-efan-primary-light transition-all disabled:opacity-50 shadow-lg shadow-efan-primary/20"
                    >
                        {saving ? ADMIN_PRODUCT_COPY.common.saving : ADMIN_PRODUCT_COPY.common.save}
                    </button>
                </div>
            </div>

            <div className="space-y-12 max-w-4xl">
                <section className="bg-white rounded-[40px] p-10 border border-blue-50/50 shadow-xl shadow-blue-900/5">
                    <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight flex items-center gap-3">
                        {ADMIN_PRODUCT_COPY.contentPage.bodySection}
                    </h2>
                    <RichEditor
                        content={data.content}
                        onChange={(json) => updateField('content', json)}
                        placeholder={ADMIN_PRODUCT_COPY.contentPage.productIntroPlaceholder}
                    />
                </section>

                <section className="bg-white rounded-[40px] p-10 border border-blue-50/50 shadow-xl shadow-blue-900/5">
                    <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight flex items-center gap-3">
                        {ADMIN_PRODUCT_COPY.contentPage.specsSection}
                    </h2>
                    <SpecificationsEditor
                        value={data.specifications}
                        onChange={(specs) => updateField('specifications', specs)}
                        specTemplate={specTemplate}
                    />
                </section>

                <section className="bg-white rounded-[40px] p-10 border border-blue-50/50 shadow-xl shadow-blue-900/5">
                    <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight flex items-center gap-3">
                        {ADMIN_PRODUCT_COPY.contentPage.videoSection}
                    </h2>
                    <VideoUrlInput
                        value={data.videoUrl}
                        onChange={(url) => updateField('videoUrl', url)}
                    />
                </section>

                <section className="bg-white rounded-[40px] p-10 border border-blue-50/50 shadow-xl shadow-blue-900/5">
                    <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight flex items-center gap-3">
                        {ADMIN_PRODUCT_COPY.contentPage.docsSection}
                    </h2>
                    <DocumentUploader
                        productId={id}
                        documents={documents}
                        onUpdate={setDocuments}
                    />
                </section>

                <section className="bg-white rounded-[40px] p-10 border border-blue-50/50 shadow-xl shadow-blue-900/5">
                    <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight flex items-center gap-3">
                        {ADMIN_PRODUCT_COPY.contentPage.faqSection}
                    </h2>
                    <FaqEditor
                        value={data.faqs}
                        onChange={(faqs) => updateField('faqs', faqs)}
                    />
                </section>

                <section className="bg-white rounded-[40px] p-10 border border-blue-50/50 shadow-xl shadow-blue-900/5">
                    <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight flex items-center gap-3">
                        {ADMIN_PRODUCT_COPY.contentPage.seoReviewSection}
                    </h2>
                    <p className="text-xs text-gray-400 font-bold mb-4">{ADMIN_PRODUCT_COPY.contentPage.seoReviewHint}</p>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{ADMIN_PRODUCT_COPY.contentPage.averageRating}</label>
                                <input type="number" step="0.1" min="1" max="5" placeholder="4.9" className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold text-gray-800 text-sm shadow-sm" value={data.seoRatingValue} onChange={(e) => updateField('seoRatingValue', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{ADMIN_PRODUCT_COPY.contentPage.ratingCount}</label>
                                <input type="number" min="1" placeholder="128" className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold text-gray-800 text-sm shadow-sm" value={data.seoRatingCount} onChange={(e) => updateField('seoRatingCount', e.target.value)} />
                                {data.seoReviews.length > 0 && Number(data.seoRatingCount) > 0 && Number(data.seoRatingCount) < data.seoReviews.length && (
                                    <p className="text-[10px] text-amber-500 font-bold pl-3">{ADMIN_PRODUCT_COPY.contentPage.reviewCountWarning(data.seoReviews.length)}</p>
                                )}
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{ADMIN_PRODUCT_COPY.contentPage.reviewContent}</label>
                                <button type="button" onClick={() => updateField('seoReviews', [...data.seoReviews, { author: '', rating: 5, body: '', date: new Date().toISOString().split('T')[0] }])} className="px-3 py-1.5 text-xs font-black text-efan-primary bg-efan-primary/5 rounded-xl hover:bg-efan-primary/10 transition-all">
                                    {ADMIN_PRODUCT_COPY.contentPage.addReview}
                                </button>
                            </div>
                            {data.seoReviews.length === 0 && (
                                <div className="py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center">
                                    <p className="text-gray-400 font-bold text-sm">{ADMIN_PRODUCT_COPY.contentPage.noReviews}</p>
                                    <p className="text-[10px] text-gray-300 mt-1">{ADMIN_PRODUCT_COPY.contentPage.noReviewsHint}</p>
                                </div>
                            )}
                            <div className="space-y-3">
                                {data.seoReviews.map((review: any, index: number) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-gray-400">{ADMIN_PRODUCT_COPY.contentPage.reviewIndex(index + 1)}</span>
                                            <button type="button" onClick={() => { const n = [...data.seoReviews]; n.splice(index, 1); updateField('seoReviews', n); }} className="text-xs text-red-400 hover:text-red-600 font-bold transition-colors">{ADMIN_PRODUCT_COPY.common.delete}</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input placeholder={ADMIN_PRODUCT_COPY.contentPage.reviewAuthorPlaceholder} className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold text-gray-800 text-sm shadow-sm" value={review.author} onChange={(e) => { const n = [...data.seoReviews]; n[index] = { ...n[index], author: e.target.value }; updateField('seoReviews', n); }} />
                                            <div className="flex gap-2">
                                                <select className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold text-gray-800 text-sm shadow-sm" value={review.rating} onChange={(e) => { const n = [...data.seoReviews]; n[index] = { ...n[index], rating: Number(e.target.value) }; updateField('seoReviews', n); }}>
                                                    <option value={5}>評分 5 星</option>
                                                    <option value={4}>評分 4 星</option>
                                                    <option value={3}>評分 3 星</option>
                                                    <option value={2}>評分 2 星</option>
                                                    <option value={1}>評分 1 星</option>
                                                </select>
                                                <input type="date" className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold text-gray-800 text-sm shadow-sm" value={review.date || ''} onChange={(e) => { const n = [...data.seoReviews]; n[index] = { ...n[index], date: e.target.value }; updateField('seoReviews', n); }} />
                                            </div>
                                        </div>
                                        <textarea placeholder={ADMIN_PRODUCT_COPY.contentPage.reviewBodyPlaceholder} className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold text-gray-800 text-sm shadow-sm min-h-[60px]" value={review.body} onChange={(e) => { const n = [...data.seoReviews]; n[index] = { ...n[index], body: e.target.value }; updateField('seoReviews', n); }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl p-6 -mx-4 px-4 border-t border-gray-100 flex items-center justify-between rounded-t-3xl">
                <button
                    onClick={handleBack}
                    className="px-6 py-3 text-gray-500 font-bold text-sm hover:text-gray-800 transition-colors"
                >
                    {ADMIN_PRODUCT_COPY.common.backToEdit}
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-10 py-4 bg-efan-primary text-white rounded-2xl font-black text-sm hover:bg-efan-primary-light transition-all disabled:opacity-50 shadow-lg shadow-efan-primary/20"
                >
                    {saving ? ADMIN_PRODUCT_COPY.common.saving : ADMIN_PRODUCT_COPY.contentPage.saveChanges}
                </button>
            </div>
        </div>
    );
}
