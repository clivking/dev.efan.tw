'use client';

import { ADMIN_PRODUCT_COPY } from '@/lib/admin-product-copy';
import { Card, Label, SectionHeader, inputClass, listToTextarea, textareaToList } from './productFormShared';

type SearchIntent = 'informational' | 'commercial' | 'transactional';
type ContentStatus = 'draft' | 'reviewed' | 'published' | 'stale';

export interface SeoTabFormData {
    seoTitle: string;
    seoSlug: string;
    seoDescription: string;
    seoKeywords: string;
    targetKeyword: string;
    searchIntent: SearchIntent;
    secondaryKeywords: string[];
    sourceUrl: string;
    sourceCheckedAt: string;
    contentStatus: ContentStatus;
    contentReviewedAt: string;
    needsRevalidation: boolean;
}

interface ProductFormSeoTabProps {
    formData: SeoTabFormData;
    updateSeoFields: (fields: Partial<SeoTabFormData>) => void;
    generateSlug: () => void;
    seoPreviewUrl: string;
    seoPreviewTitle: string;
    seoPreviewDesc: string;
    handleSaveSeo: () => void;
    loading: boolean;
    id?: string;
}

export default function ProductFormSeoTab({
    formData,
    updateSeoFields,
    generateSlug,
    seoPreviewUrl,
    seoPreviewTitle,
    seoPreviewDesc,
    handleSaveSeo,
    loading,
    id,
}: ProductFormSeoTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
                <Card>
                    <SectionHeader number="01" title={ADMIN_PRODUCT_COPY.form.seo.contentSettingsTitle} />
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>SEO Title</Label>
                            <input className={inputClass} value={formData.seoTitle} onChange={(e) => updateSeoFields({ seoTitle: e.target.value })} />
                            <p className="text-[10px] text-gray-400 font-bold pl-3">{formData.seoTitle.length}/60</p>
                        </div>
                        <div className="space-y-1">
                            <Label>SEO Slug</Label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-300 font-mono">efan.tw/products/</span>
                                    <input
                                        className={`${inputClass} pl-[150px] font-mono text-emerald-600`}
                                        value={formData.seoSlug}
                                        onChange={(e) => updateSeoFields({ seoSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    />
                                </div>
                                <button type="button" onClick={generateSlug} className="px-4 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap">
                                    {ADMIN_PRODUCT_COPY.form.generate}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>SEO Description</Label>
                            <textarea className={`${inputClass} min-h-[100px]`} value={formData.seoDescription} onChange={(e) => updateSeoFields({ seoDescription: e.target.value })} />
                            <p className="text-[10px] text-gray-400 font-bold pl-3">{formData.seoDescription.length}/160</p>
                        </div>
                        <div className="space-y-1">
                            <Label>SEO Keywords</Label>
                            <input className={inputClass} value={formData.seoKeywords} onChange={(e) => updateSeoFields({ seoKeywords: e.target.value })} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <SectionHeader number="02" title={ADMIN_PRODUCT_COPY.form.seo.searchSettingsTitle} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.seo.targetKeyword}</Label>
                            <input className={inputClass} value={formData.targetKeyword} onChange={(e) => updateSeoFields({ targetKeyword: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.seo.searchIntent}</Label>
                            <select className={inputClass} value={formData.searchIntent} onChange={(e) => updateSeoFields({ searchIntent: e.target.value as SearchIntent })}>
                                <option value="informational">informational</option>
                                <option value="commercial">commercial</option>
                                <option value="transactional">transactional</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.seo.secondaryKeywords}</Label>
                            <textarea className={`${inputClass} min-h-[100px]`} value={listToTextarea(formData.secondaryKeywords)} onChange={(e) => updateSeoFields({ secondaryKeywords: textareaToList(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.seo.sourceUrl}</Label>
                            <input className={inputClass} value={formData.sourceUrl} onChange={(e) => updateSeoFields({ sourceUrl: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.seo.sourceCheckedAt}</Label>
                            <input type="date" className={inputClass} value={formData.sourceCheckedAt} onChange={(e) => updateSeoFields({ sourceCheckedAt: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.seo.contentStatus}</Label>
                            <select className={inputClass} value={formData.contentStatus} onChange={(e) => updateSeoFields({ contentStatus: e.target.value as ContentStatus })}>
                                <option value="draft">draft</option>
                                <option value="reviewed">reviewed</option>
                                <option value="published">published</option>
                                <option value="stale">stale</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.seo.contentReviewedAt}</Label>
                            <input type="date" className={inputClass} value={formData.contentReviewedAt} onChange={(e) => updateSeoFields({ contentReviewedAt: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100 transition-all hover:bg-white hover:shadow-lg">
                                <div onClick={() => updateSeoFields({ needsRevalidation: !formData.needsRevalidation })} className={`w-12 h-7 rounded-full transition-all relative cursor-pointer ${formData.needsRevalidation ? 'bg-amber-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.needsRevalidation ? 'left-[22px]' : 'left-0.5'}`} />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-gray-700">{ADMIN_PRODUCT_COPY.form.seo.needsRevalidationTitle}</div>
                                    <div className="text-[10px] font-bold text-gray-400">{ADMIN_PRODUCT_COPY.form.seo.needsRevalidationHint}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-4 lg:sticky lg:top-8 self-start">
                <Card>
                    <h3 className="text-base font-black text-gray-800 mb-3">{ADMIN_PRODUCT_COPY.form.googlePreview}</h3>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-xs text-green-700 font-mono mb-1 truncate">{seoPreviewUrl}</div>
                        <div className="text-base text-blue-700 font-bold mb-1 line-clamp-2">{seoPreviewTitle}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{seoPreviewDesc}</div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-base font-black text-gray-800 mb-3">{ADMIN_PRODUCT_COPY.form.seo.checklistTitle}</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'SEO Title', ok: !!formData.seoTitle },
                            { label: 'SEO Description', ok: !!formData.seoDescription },
                            { label: 'Slug', ok: !!formData.seoSlug },
                            { label: ADMIN_PRODUCT_COPY.form.seo.targetKeyword, ok: !!formData.targetKeyword },
                            { label: ADMIN_PRODUCT_COPY.form.seo.sourceUrl, ok: !!formData.sourceUrl },
                            { label: ADMIN_PRODUCT_COPY.form.seo.sourceCheckedAt, ok: !!formData.sourceCheckedAt },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                                <span className="font-bold text-gray-600">{item.label}</span>
                                <span className={`font-black ${item.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{item.ok ? ADMIN_PRODUCT_COPY.form.seo.checklistComplete : ADMIN_PRODUCT_COPY.form.seo.checklistPending}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <button type="button" onClick={handleSaveSeo} disabled={loading || !id}
                    className="w-full py-4 rounded-2xl bg-sky-600 text-white font-black hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/30 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? ADMIN_PRODUCT_COPY.common.saving : ADMIN_PRODUCT_COPY.form.seo.saveButton}
                </button>
            </div>
        </div>
    );
}
