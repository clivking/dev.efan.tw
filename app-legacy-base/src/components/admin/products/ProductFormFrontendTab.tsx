'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ADMIN_PRODUCT_COPY } from '@/lib/admin-product-copy';
import { Card, Label, SectionHeader, inputClass, inputSmClass, listToTextarea, textareaToList } from './productFormShared';

const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), {
    ssr: false,
    loading: () => <div className="h-[300px] bg-gray-50 rounded-xl animate-pulse" />,
});
const SpecificationsEditor = dynamic(() => import('@/components/admin/products/SpecificationsEditor'), {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-50 rounded-xl animate-pulse" />,
});
const VideoUrlInput = dynamic(() => import('@/components/admin/products/VideoUrlInput'), {
    ssr: false,
    loading: () => <div className="h-[80px] bg-gray-50 rounded-xl animate-pulse" />,
});
const FaqEditor = dynamic(() => import('@/components/admin/products/FaqEditor'), {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-50 rounded-xl animate-pulse" />,
});
const DocumentUploader = dynamic(() => import('@/components/admin/products/DocumentUploader'), {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-50 rounded-xl animate-pulse" />,
});

type DisplayMode = 'contain' | 'cover';

interface WebsiteImage {
    id: string;
    filename: string;
    filepath: string;
    sortOrder: number;
}

interface ContentImage {
    id: string;
    filename: string;
    filepath: string;
    sortOrder: number;
    displayMode: DisplayMode;
}

interface SeoReview {
    author: string;
    rating: number;
    body: string;
    date?: string;
}

export interface FrontendTabFormData {
    showOnWebsite: boolean;
    seoTitle: string;
    seoSlug: string;
    seoDescription: string;
    seoKeywords: string;
    content: any;
    specifications: any[];
    videoUrl: string;
    faqs: any[];
    useCases: string[];
    bestFor: string[];
    notFor: string[];
    compatibility: string[];
    installationNotes: string[];
    maintenanceTips: string[];
    comparisonNotes: string;
    imageAlt: string;
    imageCaption: string;
    seoRatingValue: string | number;
    seoRatingCount: string | number;
    seoReviews: SeoReview[];
    productUrl: string;
}

interface ProductFormFrontendTabProps {
    id?: string;
    formData: FrontendTabFormData;
    summaryItems: string[];
    websiteImages: WebsiteImage[];
    contentImages: ContentImage[];
    documents: any[];
    specTemplate: any;
    dragIndex: number | null;
    contentDragIndex: number | null;
    uploadingImage: boolean;
    uploadingContentImage: boolean;
    seoPreviewUrl: string;
    seoPreviewTitle: string;
    seoPreviewDesc: string;
    loading: boolean;
    generateSlug: () => void;
    updateFrontendFields: (fields: Partial<FrontendTabFormData>) => void;
    updateSummaryItems: (nextItems: string[]) => void;
    setDocuments: (documents: any[]) => void;
    handleWebsiteImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteWebsiteImage: (imageId: string) => void;
    handleDragStart: (index: number) => void;
    handleDragOver: (e: React.DragEvent, index: number) => void;
    handleDragEnd: () => void;
    handleContentImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteContentImage: (imageId: string) => void;
    handleContentDragStart: (index: number) => void;
    handleContentDragOver: (e: React.DragEvent, index: number) => void;
    handleContentDragEnd: () => void;
    handleContentImageDisplayModeChange: (imageId: string, displayMode: DisplayMode) => void;
    handleSaveFrontend: () => void;
}

export default function ProductFormFrontendTab(props: ProductFormFrontendTabProps) {
    const {
        id,
        formData,
        summaryItems,
        websiteImages,
        contentImages,
        documents,
        specTemplate,
        dragIndex,
        contentDragIndex,
        uploadingImage,
        uploadingContentImage,
        seoPreviewUrl,
        seoPreviewTitle,
        seoPreviewDesc,
        loading,
        generateSlug,
        updateFrontendFields,
        updateSummaryItems,
        setDocuments,
        handleWebsiteImageUpload,
        handleDeleteWebsiteImage,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleContentImageUpload,
        handleDeleteContentImage,
        handleContentDragStart,
        handleContentDragOver,
        handleContentDragEnd,
        handleContentImageDisplayModeChange,
        handleSaveFrontend,
    } = props;

    const updateSeoReviews = (nextReviews: SeoReview[]) => updateFrontendFields({ seoReviews: nextReviews });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-green-500/20">🌐</div>
                            <div>
                                <h2 className="text-lg font-black text-gray-800">{ADMIN_PRODUCT_COPY.form.frontend.websiteVisibilityTitle}</h2>
                                <p className="text-xs text-gray-400 font-bold">{ADMIN_PRODUCT_COPY.form.frontend.websiteVisibilityHint}</p>
                            </div>
                        </div>
                        <div
                            onClick={() => {
                                if (!formData.showOnWebsite && !formData.seoSlug?.trim()) {
                                    toast.error(ADMIN_PRODUCT_COPY.form.frontend.websiteVisibilitySlugError);
                                    return;
                                }
                                updateFrontendFields({ showOnWebsite: !formData.showOnWebsite });
                            }}
                            className={`w-16 h-8 rounded-full transition-all relative cursor-pointer ${formData.showOnWebsite ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-all ${formData.showOnWebsite ? 'left-[30px]' : 'left-0.5'}`} />
                        </div>
                    </div>
                    {!id && <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700 font-bold">{ADMIN_PRODUCT_COPY.form.frontend.websiteVisibilityBlocked}</div>}
                </Card>

                <Card>
                    <SectionHeader icon="🔎" title={ADMIN_PRODUCT_COPY.form.frontend.seoSectionTitle} />
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.frontend.seoTitle}</Label>
                            <input placeholder={ADMIN_PRODUCT_COPY.form.frontend.seoTitlePlaceholder} className={inputClass} value={formData.seoTitle} onChange={(e) => updateFrontendFields({ seoTitle: e.target.value })} />
                            <p className="text-[10px] text-gray-400 font-bold pl-3">{formData.seoTitle.length}/60</p>
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.frontend.seoSlug}</Label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-300 font-mono">efan.tw/products/</span>
                                    <input placeholder="soyal-ar-837-ea" className={`${inputClass} pl-[150px] font-mono text-emerald-600`} value={formData.seoSlug} onChange={(e) => updateFrontendFields({ seoSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                                </div>
                                <button type="button" onClick={generateSlug} className="px-4 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap">{ADMIN_PRODUCT_COPY.form.generate}</button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.frontend.seoDescription}</Label>
                            <textarea placeholder={ADMIN_PRODUCT_COPY.form.frontend.seoDescriptionPlaceholder} className={`${inputClass} min-h-[100px]`} value={formData.seoDescription} onChange={(e) => updateFrontendFields({ seoDescription: e.target.value })} />
                            <p className="text-[10px] text-gray-400 font-bold pl-3">{formData.seoDescription.length}/160</p>
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.frontend.seoKeywords}</Label>
                            <input placeholder={ADMIN_PRODUCT_COPY.form.frontend.seoKeywordsPlaceholder} className={inputClass} value={formData.seoKeywords} onChange={(e) => updateFrontendFields({ seoKeywords: e.target.value })} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <SectionHeader icon="✨" title={ADMIN_PRODUCT_COPY.form.frontend.summarySectionTitle} />
                    <p className="text-xs text-gray-400 font-bold mb-3">{ADMIN_PRODUCT_COPY.form.frontend.summarySectionHint}</p>
                    <div className="space-y-3">
                        {summaryItems.map((item, index) => (
                            <div key={`summary-item-${index}`} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                                <div className="pt-3 text-sm font-black text-efan-primary">✦</div>
                                <div className="flex-1 space-y-2">
                                    <input className={inputSmClass} placeholder={ADMIN_PRODUCT_COPY.form.frontend.summaryPlaceholder(index + 1)} value={item} onChange={(e) => {
                                        const nextItems = [...summaryItems];
                                        nextItems[index] = e.target.value;
                                        updateSummaryItems(nextItems);
                                    }} />
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" disabled={index === 0} onClick={() => {
                                            const nextItems = [...summaryItems];
                                            [nextItems[index - 1], nextItems[index]] = [nextItems[index], nextItems[index - 1]];
                                            updateSummaryItems(nextItems);
                                        }} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">{ADMIN_PRODUCT_COPY.form.frontend.moveUp}</button>
                                        <button type="button" disabled={index === summaryItems.length - 1} onClick={() => {
                                            const nextItems = [...summaryItems];
                                            [nextItems[index], nextItems[index + 1]] = [nextItems[index + 1], nextItems[index]];
                                            updateSummaryItems(nextItems);
                                        }} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">{ADMIN_PRODUCT_COPY.form.frontend.moveDown}</button>
                                        <button type="button" onClick={() => updateSummaryItems(summaryItems.filter((_, itemIndex) => itemIndex !== index))} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-black text-red-500 transition-all hover:bg-red-50">{ADMIN_PRODUCT_COPY.form.removeLine}</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => updateSummaryItems([...summaryItems, ''])} className="w-full rounded-2xl border-2 border-dashed border-emerald-200 px-4 py-3 text-sm font-black text-emerald-600 transition-all hover:bg-emerald-50">{ADMIN_PRODUCT_COPY.form.frontend.addSummaryLine}</button>
                    </div>
                </Card>

                <Card>
                    <SectionHeader icon="🖼️" title={ADMIN_PRODUCT_COPY.form.frontend.websiteImagesTitle} />
                    <p className="text-xs text-gray-400 font-bold mb-3">{ADMIN_PRODUCT_COPY.form.frontend.websiteImagesHint}</p>
                    {id ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {websiteImages.map((img, index) => (
                                <div key={img.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} className={`aspect-square rounded-xl bg-gray-50 border-2 relative group/img overflow-hidden cursor-grab active:cursor-grabbing transition-all ${dragIndex === index ? 'border-emerald-500 scale-95 opacity-50' : 'border-gray-100 hover:border-emerald-300'} ${index === 0 ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}>
                                    <Image src={img.filepath} alt={img.filename} fill sizes="(min-width: 768px) 25vw, 50vw" className="w-full h-full object-cover" />
                                    {index === 0 && <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-lg">{ADMIN_PRODUCT_COPY.form.frontend.websiteImageMain}</div>}
                                    <button type="button" onClick={() => handleDeleteWebsiteImage(img.id)} className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-600">{ADMIN_PRODUCT_COPY.form.removeLine}</button>
                                </div>
                            ))}
                            <label className={`aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                <span className="text-2xl">{uploadingImage ? '⏳' : '＋'}</span>
                                <span className="text-[10px] font-black text-gray-400">{uploadingImage ? ADMIN_PRODUCT_COPY.form.frontend.websiteImageUploading : ADMIN_PRODUCT_COPY.form.frontend.websiteImageUpload}</span>
                                <input type="file" accept="image/*" onChange={handleWebsiteImageUpload} className="hidden" disabled={uploadingImage} />
                            </label>
                        </div>
                    ) : (
                        <div className="p-6 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700 font-bold text-center">{ADMIN_PRODUCT_COPY.form.frontend.websiteImageBlocked}</div>
                    )}
                </Card>

                <Card>
                    <SectionHeader icon="🖼️" title={ADMIN_PRODUCT_COPY.form.frontend.contentImagesTitle} />
                    <p className="text-xs text-gray-400 font-bold mb-3">{ADMIN_PRODUCT_COPY.form.frontend.contentImagesHint}</p>
                    {id ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                                {contentImages.map((img, index) => (
                                    <div key={img.id} draggable onDragStart={() => handleContentDragStart(index)} onDragOver={(e) => handleContentDragOver(e, index)} onDragEnd={handleContentDragEnd} className={`relative overflow-hidden rounded-2xl border-2 bg-gray-50 transition-all ${contentDragIndex === index ? 'border-emerald-500 scale-[0.99] opacity-60' : 'border-gray-100 hover:border-emerald-300'}`}>
                                        <div className="relative aspect-[16/9] bg-[linear-gradient(180deg,#f8fafc,#eef2f7)] p-3">
                                            <Image src={img.filepath} alt={img.filename} fill sizes="(min-width: 1024px) 66vw, 100vw" className={img.displayMode === 'cover' ? 'object-cover' : 'object-contain p-3'} />
                                        </div>
                                        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-white/90 px-4 py-3">
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-bold text-gray-400">{ADMIN_PRODUCT_COPY.form.frontend.contentImageSortLabel(index + 1)}</div>
                                                <div className="text-[11px] font-bold text-gray-400">{ADMIN_PRODUCT_COPY.form.frontend.contentImageOrderLabel(index + 1)}</div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => handleContentImageDisplayModeChange(img.id, 'contain')} className={`rounded-full px-3 py-1 text-[11px] font-black transition-colors ${img.displayMode === 'contain' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{ADMIN_PRODUCT_COPY.form.frontend.displayContain}</button>
                                                    <button type="button" onClick={() => handleContentImageDisplayModeChange(img.id, 'cover')} className={`rounded-full px-3 py-1 text-[11px] font-black transition-colors ${img.displayMode === 'cover' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{ADMIN_PRODUCT_COPY.form.frontend.displayCover}</button>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => handleDeleteContentImage(img.id)} className="rounded-full bg-red-50 px-3 py-2 text-[11px] font-black text-red-500 transition-colors hover:bg-red-100">{ADMIN_PRODUCT_COPY.form.removeLine}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <label className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/70 px-6 py-10 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/60 ${uploadingContentImage ? 'pointer-events-none opacity-50' : ''}`}>
                                <span className="text-4xl">{uploadingContentImage ? '⏳' : '🖼️'}</span>
                                <span className="text-sm font-black text-gray-700">{uploadingContentImage ? ADMIN_PRODUCT_COPY.form.frontend.contentImageUploading : ADMIN_PRODUCT_COPY.form.frontend.contentImageUpload}</span>
                                <span className="text-[11px] font-bold text-gray-400">{ADMIN_PRODUCT_COPY.form.frontend.contentImageHint}</span>
                                <input type="file" accept="image/*" onChange={handleContentImageUpload} className="hidden" disabled={uploadingContentImage} />
                            </label>
                        </div>
                    ) : (
                        <div className="p-6 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700 font-bold text-center">{ADMIN_PRODUCT_COPY.form.frontend.contentImageBlocked}</div>
                    )}
                </Card>

                <Card>
                    <SectionHeader icon="📝" title={ADMIN_PRODUCT_COPY.form.frontend.contentIntroTitle} />
                    <p className="text-xs text-gray-400 font-bold mb-3">{ADMIN_PRODUCT_COPY.form.frontend.contentIntroHint}</p>
                    <RichEditor content={formData.content} onChange={(json) => updateFrontendFields({ content: json })} />
                </Card>

                <Card>
                    <SectionHeader icon="📋" title={ADMIN_PRODUCT_COPY.form.frontend.specsTitle} />
                    <SpecificationsEditor value={formData.specifications} onChange={(specs) => updateFrontendFields({ specifications: specs })} specTemplate={specTemplate} />
                </Card>

                <Card>
                    <SectionHeader icon="🎬" title={ADMIN_PRODUCT_COPY.form.frontend.videoTitle} />
                    <VideoUrlInput value={formData.videoUrl} onChange={(url) => updateFrontendFields({ videoUrl: url })} />
                </Card>

                <Card>
                    <SectionHeader icon="📄" title={ADMIN_PRODUCT_COPY.form.frontend.documentsTitle} />
                    {id ? <DocumentUploader productId={id} documents={documents} onUpdate={setDocuments} /> : <div className="p-6 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700 font-bold text-center">{ADMIN_PRODUCT_COPY.form.frontend.documentsBlocked}</div>}
                </Card>

                <Card>
                    <SectionHeader icon="❓" title={ADMIN_PRODUCT_COPY.form.frontend.faqTitle} />
                    <FaqEditor value={formData.faqs} onChange={(faqs) => updateFrontendFields({ faqs })} />
                </Card>

                <Card>
                    <SectionHeader icon="02" title={ADMIN_PRODUCT_COPY.form.frontend.extendedContentTitle} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label>{ADMIN_PRODUCT_COPY.form.frontend.useCases}</Label><textarea className={`${inputClass} min-h-[120px]`} value={listToTextarea(formData.useCases)} onChange={(e) => updateFrontendFields({ useCases: textareaToList(e.target.value) })} /></div>
                        <div className="space-y-1"><Label>{ADMIN_PRODUCT_COPY.form.frontend.bestFor}</Label><textarea className={`${inputClass} min-h-[120px]`} value={listToTextarea(formData.bestFor)} onChange={(e) => updateFrontendFields({ bestFor: textareaToList(e.target.value) })} /></div>
                        <div className="space-y-1"><Label>{ADMIN_PRODUCT_COPY.form.frontend.notFor}</Label><textarea className={`${inputClass} min-h-[120px]`} value={listToTextarea(formData.notFor)} onChange={(e) => updateFrontendFields({ notFor: textareaToList(e.target.value) })} /></div>
                        <div className="space-y-1"><Label>{ADMIN_PRODUCT_COPY.form.frontend.compatibility}</Label><textarea className={`${inputClass} min-h-[120px]`} value={listToTextarea(formData.compatibility)} onChange={(e) => updateFrontendFields({ compatibility: textareaToList(e.target.value) })} /></div>
                        <div className="space-y-1"><Label>{ADMIN_PRODUCT_COPY.form.frontend.installationNotes}</Label><textarea className={`${inputClass} min-h-[120px]`} value={listToTextarea(formData.installationNotes)} onChange={(e) => updateFrontendFields({ installationNotes: textareaToList(e.target.value) })} /></div>
                        <div className="space-y-1"><Label>{ADMIN_PRODUCT_COPY.form.frontend.maintenanceTips}</Label><textarea className={`${inputClass} min-h-[120px]`} value={listToTextarea(formData.maintenanceTips)} onChange={(e) => updateFrontendFields({ maintenanceTips: textareaToList(e.target.value) })} /></div>
                        <div className="md:col-span-2 space-y-1"><Label>{ADMIN_PRODUCT_COPY.form.frontend.comparisonNotes}</Label><textarea className={`${inputClass} min-h-[120px]`} value={formData.comparisonNotes} onChange={(e) => updateFrontendFields({ comparisonNotes: e.target.value })} /></div>
                        <div className="space-y-1"><Label>{ADMIN_PRODUCT_COPY.form.frontend.imageAlt}</Label><input className={inputClass} value={formData.imageAlt} onChange={(e) => updateFrontendFields({ imageAlt: e.target.value })} /></div>
                        <div className="space-y-1"><Label>{ADMIN_PRODUCT_COPY.form.frontend.imageCaption}</Label><input className={inputClass} value={formData.imageCaption} onChange={(e) => updateFrontendFields({ imageCaption: e.target.value })} /></div>
                    </div>
                </Card>

                <Card>
                    <SectionHeader icon="⭐" title={ADMIN_PRODUCT_COPY.form.frontend.seoReviewTitle} />
                    <p className="text-xs text-gray-400 font-bold mb-4">{ADMIN_PRODUCT_COPY.form.frontend.seoReviewHint}</p>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.frontend.averageRating}</Label>
                            <input type="number" step="0.1" min="1" max="5" placeholder="4.9" className={inputSmClass} value={formData.seoRatingValue} onChange={(e) => updateFrontendFields({ seoRatingValue: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.frontend.ratingCount}</Label>
                            <input type="number" min="1" placeholder="128" className={inputSmClass} value={formData.seoRatingCount} onChange={(e) => updateFrontendFields({ seoRatingCount: e.target.value })} />
                            {formData.seoReviews.length > 0 && Number(formData.seoRatingCount) > 0 && Number(formData.seoRatingCount) < formData.seoReviews.length && <p className="text-[10px] text-amber-500 font-bold pl-3">{ADMIN_PRODUCT_COPY.form.frontend.reviewCountWarning(formData.seoReviews.length)}</p>}
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <Label>{ADMIN_PRODUCT_COPY.form.frontend.reviewContent}</Label>
                                <button type="button" onClick={() => updateSeoReviews([...formData.seoReviews, { author: '', rating: 5, body: '', date: new Date().toISOString().split('T')[0] }])} className="px-3 py-1.5 text-xs font-black text-efan-primary bg-efan-primary/5 rounded-xl hover:bg-efan-primary/10 transition-all">{ADMIN_PRODUCT_COPY.form.frontend.addReview}</button>
                            </div>
                            {formData.seoReviews.length === 0 && <div className="py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center"><p className="text-gray-400 font-bold text-sm">{ADMIN_PRODUCT_COPY.form.frontend.noReviews}</p><p className="text-[10px] text-gray-300 mt-1">{ADMIN_PRODUCT_COPY.form.frontend.noReviewsHint}</p></div>}
                            <div className="space-y-3">
                                {formData.seoReviews.map((review, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-gray-400">{ADMIN_PRODUCT_COPY.form.frontend.reviewIndex(index + 1)}</span>
                                            <button type="button" onClick={() => {
                                                const nextReviews = [...formData.seoReviews];
                                                nextReviews.splice(index, 1);
                                                updateSeoReviews(nextReviews);
                                            }} className="text-xs text-red-400 hover:text-red-600 font-bold transition-colors">{ADMIN_PRODUCT_COPY.form.frontend.deleteReview}</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input placeholder={ADMIN_PRODUCT_COPY.form.frontend.reviewAuthorPlaceholder} className={inputSmClass} value={review.author} onChange={(e) => {
                                                const nextReviews = [...formData.seoReviews];
                                                nextReviews[index] = { ...nextReviews[index], author: e.target.value };
                                                updateSeoReviews(nextReviews);
                                            }} />
                                            <div className="flex gap-2">
                                                <select className={inputSmClass} value={review.rating} onChange={(e) => {
                                                    const nextReviews = [...formData.seoReviews];
                                                    nextReviews[index] = { ...nextReviews[index], rating: Number(e.target.value) };
                                                    updateSeoReviews(nextReviews);
                                                }}>
                                                    <option value={5}>{ADMIN_PRODUCT_COPY.form.frontend.reviewRating(5)}</option>
                                                    <option value={4}>{ADMIN_PRODUCT_COPY.form.frontend.reviewRating(4)}</option>
                                                    <option value={3}>{ADMIN_PRODUCT_COPY.form.frontend.reviewRating(3)}</option>
                                                    <option value={2}>{ADMIN_PRODUCT_COPY.form.frontend.reviewRating(2)}</option>
                                                    <option value={1}>{ADMIN_PRODUCT_COPY.form.frontend.reviewRating(1)}</option>
                                                </select>
                                                <input type="date" className={inputSmClass} value={review.date || ''} onChange={(e) => {
                                                    const nextReviews = [...formData.seoReviews];
                                                    nextReviews[index] = { ...nextReviews[index], date: e.target.value };
                                                    updateSeoReviews(nextReviews);
                                                }} />
                                            </div>
                                        </div>
                                        <textarea placeholder={ADMIN_PRODUCT_COPY.form.frontend.reviewBodyPlaceholder} className={`${inputSmClass} min-h-[60px]`} value={review.body} onChange={(e) => {
                                            const nextReviews = [...formData.seoReviews];
                                            nextReviews[index] = { ...nextReviews[index], body: e.target.value };
                                            updateSeoReviews(nextReviews);
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-4 lg:sticky lg:top-8 self-start">
                <Card>
                    <h3 className="text-base font-black text-gray-800 mb-3 flex items-center gap-2">{ADMIN_PRODUCT_COPY.form.googlePreview}</h3>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-xs text-green-700 font-mono mb-1 truncate">{seoPreviewUrl}</div>
                        <div className="text-base text-blue-700 font-bold mb-1 line-clamp-2">{seoPreviewTitle}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{seoPreviewDesc}</div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold mt-3 text-center">{ADMIN_PRODUCT_COPY.form.frontend.googlePreviewHint}</p>
                </Card>

                <Card>
                    <h3 className="text-base font-black text-gray-800 mb-3 flex items-center gap-2">{ADMIN_PRODUCT_COPY.form.frontend.productUrlAiTitle}</h3>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.frontend.productUrl}</Label>
                            <input placeholder="https://www.soyal.com/..." className={inputSmClass} value={formData.productUrl} onChange={(e) => updateFrontendFields({ productUrl: e.target.value })} />
                            <p className="text-[10px] text-gray-400 font-bold pl-3">{ADMIN_PRODUCT_COPY.form.frontend.productUrlHint}</p>
                        </div>
                        <button type="button" disabled={!formData.productUrl.trim()} onClick={() => toast.info(ADMIN_PRODUCT_COPY.form.frontend.aiSummaryPending)} className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-black text-sm hover:border-efan-primary hover:text-efan-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {ADMIN_PRODUCT_COPY.form.frontend.aiSummaryButton}
                        </button>
                    </div>
                </Card>

                <button type="button" onClick={handleSaveFrontend} disabled={loading || !id} className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? ADMIN_PRODUCT_COPY.common.saving : ADMIN_PRODUCT_COPY.form.frontend.saveButton}
                </button>
            </div>
        </div>
    );
}
