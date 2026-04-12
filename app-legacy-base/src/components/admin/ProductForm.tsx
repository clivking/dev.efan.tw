'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ADMIN_PRODUCT_COPY } from '@/lib/admin-product-copy';
import ProductFormFrontendTab from '@/components/admin/products/ProductFormFrontendTab';
import ProductFormQuoteTab from '@/components/admin/products/ProductFormQuoteTab';
import ProductFormSeoTab from '@/components/admin/products/ProductFormSeoTab';

interface ProductFormProps {
    id?: string;
    initialData?: any;
}

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
    displayMode: 'contain' | 'cover';
}

function parseSummaryItems(value: string): string[] {
    const lines = value
        .replace(/\r/g, '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

    return lines.length > 0 ? lines : [''];
}

function serializeSummaryItems(items: string[]): string {
    return items
        .map((item) => item.trim())
        .filter(Boolean)
        .join('\n');
}

function toDateInputValue(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value.slice(0, 10);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return '';
}

export default function ProductForm({ id, initialData }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'quote' | 'frontend' | 'seo'>('quote');
    const [categories, setCategories] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [websiteImages, setWebsiteImages] = useState<WebsiteImage[]>([]);
    const [contentImages, setContentImages] = useState<ContentImage[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingContentImage, setUploadingContentImage] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [contentDragIndex, setContentDragIndex] = useState<number | null>(null);
    const [specTemplate, setSpecTemplate] = useState<any>(null);
    const [summaryItems, setSummaryItems] = useState<string[]>(() => parseSummaryItems(initialData?.websiteDescription || ''));

    const [formData, setFormData] = useState({
        // Tab 1: quote data
        categoryId: initialData?.categoryId || '',
        brand: initialData?.brand || '',
        model: initialData?.model || '',
        name: initialData?.name || '',
        description: initialData?.description || '',
        quoteName: initialData?.quoteName || '',
        quoteDesc: initialData?.quoteDesc || '',
        type: initialData?.type || 'single',
        unit: initialData?.unit || '',
        costPrice: initialData?.costPrice || 0,
        marketPrice: initialData?.marketPrice || 0,
        sellingPrice: initialData?.sellingPrice || 0,
        repairPrice: initialData?.repairPrice || 0,
        isHiddenItem: initialData?.isHiddenItem || false,
        isQuickAccess: initialData?.isQuickAccess || false,
        isAI: initialData?.isAI || false,
        isHot: initialData?.isHot || false,
        isNew: initialData?.isNew || false,
        notes: initialData?.notes || '',
        currentStock: initialData?.currentStock || 0,
        lowStockThreshold: initialData?.lowStockThreshold || 0,
        trackInventory: initialData?.trackInventory ?? false,
        productUrl: initialData?.productUrl || '',
        bundleItems: initialData?.bundleItems?.map((bi: any) => ({
            productId: bi.productId,
            quantity: bi.quantity,
            sortOrder: bi.sortOrder
        })) || [],
        // Tab 2: frontend content
        showOnWebsite: initialData?.showOnWebsite || false,
        websiteDescription: initialData?.websiteDescription || '',
        content: initialData?.content || null,
        specifications: initialData?.specifications || [],
        videoUrl: initialData?.videoUrl || '',
        faqs: initialData?.faqs || [],
        useCases: initialData?.useCases || [],
        bestFor: initialData?.bestFor || [],
        notFor: initialData?.notFor || [],
        compatibility: initialData?.compatibility || [],
        installationNotes: initialData?.installationNotes || [],
        maintenanceTips: initialData?.maintenanceTips || [],
        comparisonNotes: initialData?.comparisonNotes || '',
        imageAlt: initialData?.imageAlt || '',
        imageCaption: initialData?.imageCaption || '',
        seoRatingValue: initialData?.seoRatingValue ?? '',
        seoRatingCount: initialData?.seoRatingCount ?? '',
        seoReviews: initialData?.seoReviews || [],
        seoTitle: initialData?.seoTitle || '',
        seoDescription: initialData?.seoDescription || '',
        seoSlug: initialData?.seoSlug || '',
        seoKeywords: initialData?.seoKeywords || '',
        targetKeyword: initialData?.targetKeyword || '',
        secondaryKeywords: initialData?.secondaryKeywords || [],
        searchIntent: initialData?.searchIntent || 'commercial',
        sourceUrl: initialData?.sourceUrl || '',
        sourceCheckedAt: toDateInputValue(initialData?.sourceCheckedAt),
        contentStatus: initialData?.contentStatus || 'draft',
        contentReviewedAt: toDateInputValue(initialData?.contentReviewedAt),
        needsRevalidation: initialData?.needsRevalidation || false,
    });

    // Dirty state tracking
    const lastSavedTab1 = useRef<string>('');
    const lastSavedFrontend = useRef<string>('');
    const lastSavedSeo = useRef<string>('');

    const getTab1Fields = useCallback(() => {
        const { categoryId, brand, model, name, description, quoteName, quoteDesc, type, unit,
            costPrice, marketPrice, sellingPrice, repairPrice, isHiddenItem, isQuickAccess,
            isAI, isHot, isNew,
            notes, currentStock, lowStockThreshold, trackInventory, bundleItems } = formData;
        return JSON.stringify({ categoryId, brand, model, name, description, quoteName, quoteDesc, type, unit,
            costPrice, marketPrice, sellingPrice, repairPrice, isHiddenItem, isQuickAccess,
            isAI, isHot, isNew,
            notes, currentStock, lowStockThreshold, trackInventory, bundleItems });
    }, [formData]);

    const getFrontendFields = useCallback(() => {
        const {
            showOnWebsite, websiteDescription, content, specifications, videoUrl, faqs, productUrl,
            useCases, bestFor, notFor, compatibility, installationNotes, maintenanceTips,
            comparisonNotes, imageAlt, imageCaption
        } = formData;
        return JSON.stringify({
            showOnWebsite, websiteDescription, content, specifications, videoUrl, faqs, productUrl,
            useCases, bestFor, notFor, compatibility, installationNotes, maintenanceTips,
            comparisonNotes, imageAlt, imageCaption
        });
    }, [formData]);

    const getSeoFields = useCallback(() => {
        const {
            seoTitle, seoDescription, seoSlug, seoKeywords,
            targetKeyword, secondaryKeywords, searchIntent,
            sourceUrl, sourceCheckedAt, contentStatus, contentReviewedAt, needsRevalidation,
            seoRatingValue, seoRatingCount, seoReviews
        } = formData;
        return JSON.stringify({
            seoTitle, seoDescription, seoSlug, seoKeywords,
            targetKeyword, secondaryKeywords, searchIntent,
            sourceUrl, sourceCheckedAt, contentStatus, contentReviewedAt, needsRevalidation,
            seoRatingValue, seoRatingCount, seoReviews
        });
    }, [formData]);

    // Initialize saved state
    useEffect(() => {
        lastSavedTab1.current = getTab1Fields();
        lastSavedFrontend.current = getFrontendFields();
        lastSavedSeo.current = getSeoFields();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetch('/api/products/categories').then(res => res.json()).then(data => setCategories(data.categories || []));
        fetch('/api/products?pageSize=1000').then(res => res.json()).then(data => setAllProducts(data.products || []));
    }, []);

    // Load product data when editing (content fields, images, documents)
    useEffect(() => {
        if (id) {
            fetch(`/api/products/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.product) {
                        // Update content fields from full product data
                        setFormData(prev => ({
                            ...prev,
                            websiteDescription: data.product.websiteDescription || '',
                            content: data.product.content || null,
                            specifications: data.product.specifications || [],
                            videoUrl: data.product.videoUrl || '',
                            faqs: data.product.faqs || [],
                            useCases: data.product.useCases || [],
                            bestFor: data.product.bestFor || [],
                            notFor: data.product.notFor || [],
                            compatibility: data.product.compatibility || [],
                            installationNotes: data.product.installationNotes || [],
                            maintenanceTips: data.product.maintenanceTips || [],
                            comparisonNotes: data.product.comparisonNotes || '',
                            imageAlt: data.product.imageAlt || '',
                            imageCaption: data.product.imageCaption || '',
                            targetKeyword: data.product.targetKeyword || '',
                            secondaryKeywords: data.product.secondaryKeywords || [],
                            searchIntent: data.product.searchIntent || 'commercial',
                            sourceUrl: data.product.sourceUrl || '',
                            sourceCheckedAt: toDateInputValue(data.product.sourceCheckedAt),
                            contentStatus: data.product.contentStatus || 'draft',
                            contentReviewedAt: toDateInputValue(data.product.contentReviewedAt),
                            needsRevalidation: data.product.needsRevalidation || false,
                        }));
                        setSummaryItems(parseSummaryItems(data.product.websiteDescription || ''));
                        setSpecTemplate(data.specTemplate || null);
                    }
                    if (data.websiteImages) setWebsiteImages(data.websiteImages);
                    if (data.contentImages) setContentImages(data.contentImages);
                    if (data.documents) setDocuments(data.documents);

                    // Update saved state after loading
                    setTimeout(() => {
                        lastSavedTab1.current = getTab1Fields();
                        lastSavedFrontend.current = getFrontendFields();
                        lastSavedSeo.current = getSeoFields();
                    }, 100);
                })
                .catch(() => {});
        }
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Tab switching with dirty check
    const switchTab = (tab: 'quote' | 'frontend' | 'seo') => {
        if (tab === activeTab) return;

        const currentDirty = activeTab === 'quote'
            ? getTab1Fields() !== lastSavedTab1.current
            : activeTab === 'frontend'
                ? getFrontendFields() !== lastSavedFrontend.current
                : getSeoFields() !== lastSavedSeo.current;

        if (currentDirty) {
            if (!confirm(ADMIN_PRODUCT_COPY.form.confirmTabSwitch)) return;
        }
        setActiveTab(tab);
    };

    // --- Tab 1 Save ---
    const handleSaveTab1 = async () => {
        setLoading(true);
        try {
            const tab1Data = {
                categoryId: formData.categoryId,
                brand: formData.brand,
                model: formData.model,
                name: formData.name,
                description: formData.description,
                quoteName: formData.quoteName,
                quoteDesc: formData.quoteDesc,
                type: formData.type,
                unit: formData.unit,
                costPrice: formData.costPrice,
                marketPrice: formData.marketPrice,
                sellingPrice: formData.sellingPrice,
                repairPrice: formData.repairPrice,
                isHiddenItem: formData.isHiddenItem,
                isQuickAccess: formData.isQuickAccess,
                isAI: formData.isAI,
                isHot: formData.isHot,
                isNew: formData.isNew,
                notes: formData.notes,
                currentStock: formData.currentStock,
                lowStockThreshold: formData.lowStockThreshold,
                trackInventory: formData.trackInventory,
                bundleItems: formData.bundleItems,
            };

            const url = id ? `/api/products/${id}` : '/api/products';
            const method = id ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tab1Data)
            });

            if (res.ok) {
                const result = await res.json();
                if (!id && result.id) {
                    // New product created ??redirect to edit page
                    toast.success(ADMIN_PRODUCT_COPY.form.quote.saveSuccessNew);
                    router.push(`/admin/products/${result.id}/edit`);
                    return;
                }
                toast.success(ADMIN_PRODUCT_COPY.form.quote.saveSuccess);
                lastSavedTab1.current = getTab1Fields();
            } else {
                const data = await res.json();
                toast.error(data.error || ADMIN_PRODUCT_COPY.form.genericSaveError);
            }
        } catch (e) {
            console.error(e);
            toast.error(ADMIN_PRODUCT_COPY.form.genericSaveError);
        } finally {
            setLoading(false);
        }
    };

    // --- Tab 2 Save ---
    const handleSaveFrontend = async () => {
        if (!id) {
            toast.error(ADMIN_PRODUCT_COPY.form.frontend.saveBlocked);
            return;
        }
        setLoading(true);
        try {
            const frontendData = {
                showOnWebsite: formData.showOnWebsite,
                websiteDescription: formData.websiteDescription,
                content: formData.content,
                specifications: formData.specifications,
                videoUrl: formData.videoUrl,
                faqs: formData.faqs,
                productUrl: formData.productUrl,
                useCases: formData.useCases,
                bestFor: formData.bestFor,
                notFor: formData.notFor,
                compatibility: formData.compatibility,
                installationNotes: formData.installationNotes,
                maintenanceTips: formData.maintenanceTips,
                comparisonNotes: formData.comparisonNotes,
                imageAlt: formData.imageAlt,
                imageCaption: formData.imageCaption,
            };

            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(frontendData)
            });

            if (res.ok) {
                toast.success(ADMIN_PRODUCT_COPY.form.frontend.saveSuccess);
                lastSavedFrontend.current = getFrontendFields();
            } else {
                const data = await res.json();
                toast.error(data.error || ADMIN_PRODUCT_COPY.form.genericSaveError);
            }
        } catch (e) {
            console.error(e);
            toast.error(ADMIN_PRODUCT_COPY.form.genericSaveError);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSeo = async () => {
        if (!id) {
            toast.error(ADMIN_PRODUCT_COPY.form.seo.saveBlocked);
            return;
        }
        setLoading(true);
        try {
            const seoData = {
                seoTitle: formData.seoTitle,
                seoDescription: formData.seoDescription,
                seoSlug: formData.seoSlug,
                seoKeywords: formData.seoKeywords,
                targetKeyword: formData.targetKeyword,
                secondaryKeywords: formData.secondaryKeywords,
                searchIntent: formData.searchIntent,
                sourceUrl: formData.sourceUrl,
                sourceCheckedAt: formData.sourceCheckedAt || null,
                contentStatus: formData.contentStatus,
                contentReviewedAt: formData.contentReviewedAt || null,
                needsRevalidation: formData.needsRevalidation,
                seoRatingValue: formData.seoRatingValue || null,
                seoRatingCount: formData.seoRatingCount ? Number(formData.seoRatingCount) : null,
                seoReviews: formData.seoReviews,
            };

            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(seoData)
            });

            if (res.ok) {
                toast.success(ADMIN_PRODUCT_COPY.form.seo.saveSuccess);
                lastSavedSeo.current = getSeoFields();
            } else {
                const data = await res.json();
                toast.error(data.error || ADMIN_PRODUCT_COPY.form.seo.saveError);
            }
        } catch (e) {
            console.error(e);
            toast.error(ADMIN_PRODUCT_COPY.form.seo.saveError);
        } finally {
            setLoading(false);
        }
    };

    // Website image management
    const handleWebsiteImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch(`/api/products/${id}/website-images`, { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) {
                setWebsiteImages(prev => [...prev, data.image]);
                toast.success(ADMIN_PRODUCT_COPY.form.frontend.websiteImageUploadSuccess);
            } else {
                toast.error(data.error || ADMIN_PRODUCT_COPY.form.frontend.websiteImageUploadError);
            }
        } catch { toast.error(ADMIN_PRODUCT_COPY.form.frontend.websiteImageUploadError); }
        finally { setUploadingImage(false); e.target.value = ''; }
    };

    const handleDeleteWebsiteImage = async (imageId: string) => {
        if (!id || !confirm(ADMIN_PRODUCT_COPY.form.frontend.websiteImageDeleteConfirm)) return;
        try {
            const res = await fetch(`/api/products/${id}/website-images/${imageId}`, { method: 'DELETE' });
            if (res.ok) { setWebsiteImages(prev => prev.filter(img => img.id !== imageId)); toast.success(ADMIN_PRODUCT_COPY.form.frontend.websiteImageDeleteSuccess); }
            else { toast.error(ADMIN_PRODUCT_COPY.form.frontend.websiteImageDeleteError); }
        } catch { toast.error(ADMIN_PRODUCT_COPY.form.frontend.websiteImageDeleteError); }
    };

    const handleDragStart = (index: number) => setDragIndex(index);
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;
        const newImages = [...websiteImages];
        const [moved] = newImages.splice(dragIndex, 1);
        newImages.splice(index, 0, moved);
        setWebsiteImages(newImages);
        setDragIndex(index);
    };
    const handleDragEnd = async () => {
        setDragIndex(null);
        if (!id) return;
        const imageIds = websiteImages.map(img => img.id);
        try { await fetch(`/api/products/${id}/website-images`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageIds }) }); }
        catch { toast.error(ADMIN_PRODUCT_COPY.form.frontend.websiteImageSortError); }
    };

    const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;
        setUploadingContentImage(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch(`/api/products/${id}/content-images`, { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) {
                setContentImages(prev => [...prev, data.image]);
                toast.success(ADMIN_PRODUCT_COPY.form.frontend.contentImageUploadSuccess);
            } else {
                toast.error(data.error || ADMIN_PRODUCT_COPY.form.contentImageUploadError);
            }
        } catch {
            toast.error(ADMIN_PRODUCT_COPY.form.contentImageUploadError);
        } finally {
            setUploadingContentImage(false);
            e.target.value = '';
        }
    };

    const handleDeleteContentImage = async (imageId: string) => {
        if (!id || !confirm(ADMIN_PRODUCT_COPY.form.contentImageDeleteConfirm)) return;
        try {
            const res = await fetch(`/api/products/${id}/content-images/${imageId}`, { method: 'DELETE' });
            if (res.ok) {
                setContentImages(prev => prev.filter(img => img.id !== imageId));
                toast.success(ADMIN_PRODUCT_COPY.form.frontend.contentImageDeleteSuccess);
            } else {
                toast.error(ADMIN_PRODUCT_COPY.form.contentImageDeleteError);
            }
        } catch {
            toast.error(ADMIN_PRODUCT_COPY.form.contentImageDeleteError);
        }
    };

    const handleContentImageDisplayModeChange = async (imageId: string, displayMode: 'contain' | 'cover') => {
        if (!id) return;

        const previousImages = contentImages;
        setContentImages(prev => prev.map(img => img.id === imageId ? { ...img, displayMode } : img));

        try {
            const res = await fetch(`/api/products/${id}/content-images/${imageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayMode }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || ADMIN_PRODUCT_COPY.form.frontend.contentImageDisplayModeUpdateError);
            }

            toast.success(
                displayMode === 'contain'
                    ? ADMIN_PRODUCT_COPY.form.frontend.contentImageDisplayContainSuccess
                    : ADMIN_PRODUCT_COPY.form.frontend.contentImageDisplayCoverSuccess,
            );
        } catch {
            setContentImages(previousImages);
            toast.error(ADMIN_PRODUCT_COPY.form.frontend.contentImageDisplayModeUpdateError);
        }
    };

    const handleContentDragStart = (index: number) => setContentDragIndex(index);
    const handleContentDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (contentDragIndex === null || contentDragIndex === index) return;
        const newImages = [...contentImages];
        const [moved] = newImages.splice(contentDragIndex, 1);
        newImages.splice(index, 0, moved);
        setContentImages(newImages);
        setContentDragIndex(index);
    };
    const handleContentDragEnd = async () => {
        setContentDragIndex(null);
        if (!id) return;
        const imageIds = contentImages.map(img => img.id);
        try {
            await fetch(`/api/products/${id}/content-images`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageIds })
            });
        } catch {
            toast.error(ADMIN_PRODUCT_COPY.form.contentImageSortError);
        }
    };

    // Slug auto-generation
    const generateSlug = useCallback(() => {
        const parts: string[] = [];
        if (formData.brand) parts.push(formData.brand);
        if (formData.model) parts.push(formData.model);
        if (parts.length === 0 && formData.name) parts.push(formData.name);
        const slug = parts.join(' ').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (slug) { setFormData(prev => ({ ...prev, seoSlug: slug })); toast.success(ADMIN_PRODUCT_COPY.form.slugGenerated(slug)); }
        else { toast.error(ADMIN_PRODUCT_COPY.form.slugGenerateError); }
    }, [formData.brand, formData.model, formData.name]);

    const addBundleItem = () => setFormData(prev => ({ ...prev, bundleItems: [...prev.bundleItems, { productId: '', quantity: 1, sortOrder: prev.bundleItems.length }] }));
    const removeBundleItem = (index: number) => { const n = [...formData.bundleItems]; n.splice(index, 1); setFormData(prev => ({ ...prev, bundleItems: n })); };
    const updateBundleItem = (index: number, field: string, value: any) => { const n = [...formData.bundleItems]; n[index] = { ...n[index], [field]: value }; setFormData(prev => ({ ...prev, bundleItems: n })); };

    // Google search preview
    const seoPreviewTitle = formData.seoTitle || `${formData.brand || ''} ${formData.model || ''} ${formData.name}`.trim() || ADMIN_PRODUCT_COPY.form.seoPreviewFallbackTitle;
    const seoPreviewDesc = formData.seoDescription || formData.description?.substring(0, 155) || ADMIN_PRODUCT_COPY.form.seoPreviewFallbackDescription;
    const seoPreviewUrl = formData.seoSlug ? `efan.tw/products/${formData.seoSlug}` : 'efan.tw/products/...';

    const updateSummaryItems = (nextItems: string[]) => {
        const normalizedItems = nextItems.length > 0 ? nextItems : [''];
        setSummaryItems(normalizedItems);
        setFormData(prev => ({
            ...prev,
            websiteDescription: serializeSummaryItems(normalizedItems),
        }));
    };

    const updateFrontendFields = (fields: Partial<{
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
        seoReviews: any[];
        productUrl: string;
    }>) => {
        setFormData(prev => ({ ...prev, ...fields }));
    };

    const updateQuoteFields = (fields: Partial<{
        categoryId: string;
        brand: string;
        model: string;
        name: string;
        description: string;
        quoteName: string;
        quoteDesc: string;
        type: 'single' | 'bundle';
        unit: string;
        costPrice: number;
        marketPrice: number;
        sellingPrice: number;
        repairPrice: number;
        isHiddenItem: boolean;
        isQuickAccess: boolean;
        isAI: boolean;
        isHot: boolean;
        isNew: boolean;
        notes: string;
        currentStock: number;
        lowStockThreshold: number;
        trackInventory: boolean;
        bundleItems: any[];
    }>) => {
        setFormData(prev => ({ ...prev, ...fields }));
    };

    const updateSeoFields = (fields: Partial<{
        seoTitle: string;
        seoSlug: string;
        seoDescription: string;
        seoKeywords: string;
        targetKeyword: string;
        searchIntent: 'informational' | 'commercial' | 'transactional';
        secondaryKeywords: string[];
        sourceUrl: string;
        sourceCheckedAt: string;
        contentStatus: 'draft' | 'reviewed' | 'published' | 'stale';
        contentReviewedAt: string;
        needsRevalidation: boolean;
    }>) => {
        setFormData(prev => ({ ...prev, ...fields }));
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Tab Navigation */}
            <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner w-fit">
                <button type="button" onClick={() => switchTab('quote')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'quote' ? 'bg-white text-efan-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    {ADMIN_PRODUCT_COPY.form.tabs.quote}
                </button>
                <button type="button" onClick={() => switchTab('frontend')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'frontend' ? 'bg-white text-efan-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    {ADMIN_PRODUCT_COPY.form.tabs.frontend}
                    {formData.showOnWebsite && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                </button>
                <button type="button" onClick={() => switchTab('seo')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'seo' ? 'bg-white text-efan-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    SEO
                    {formData.targetKeyword && <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />}
                </button>
            </div>

            {/* ==================== TAB 1: quote data ==================== */}
            <div className={activeTab === 'quote' ? '' : 'hidden'}>
                <ProductFormQuoteTab
                    id={id}
                    formData={formData}
                    categories={categories}
                    allProducts={allProducts}
                    loading={loading}
                    updateQuoteFields={updateQuoteFields}
                    addBundleItem={addBundleItem}
                    removeBundleItem={removeBundleItem}
                    updateBundleItem={updateBundleItem}
                    handleSaveTab1={handleSaveTab1}
                />
            </div>

            {/* ==================== TAB 2: frontend content ==================== */}
            <div className={activeTab === 'frontend' ? '' : 'hidden'}>
                <ProductFormFrontendTab
                    id={id}
                    formData={formData}
                    summaryItems={summaryItems}
                    websiteImages={websiteImages}
                    contentImages={contentImages}
                    documents={documents}
                    specTemplate={specTemplate}
                    dragIndex={dragIndex}
                    contentDragIndex={contentDragIndex}
                    uploadingImage={uploadingImage}
                    uploadingContentImage={uploadingContentImage}
                    seoPreviewUrl={seoPreviewUrl}
                    seoPreviewTitle={seoPreviewTitle}
                    seoPreviewDesc={seoPreviewDesc}
                    loading={loading}
                    generateSlug={generateSlug}
                    updateFrontendFields={updateFrontendFields}
                    updateSummaryItems={updateSummaryItems}
                    setDocuments={setDocuments}
                    handleWebsiteImageUpload={handleWebsiteImageUpload}
                    handleDeleteWebsiteImage={handleDeleteWebsiteImage}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDragEnd={handleDragEnd}
                    handleContentImageUpload={handleContentImageUpload}
                    handleDeleteContentImage={handleDeleteContentImage}
                    handleContentDragStart={handleContentDragStart}
                    handleContentDragOver={handleContentDragOver}
                    handleContentDragEnd={handleContentDragEnd}
                    handleContentImageDisplayModeChange={handleContentImageDisplayModeChange}
                    handleSaveFrontend={handleSaveFrontend}
                />
            </div>

            <div className={activeTab === 'seo' ? '' : 'hidden'}>
                <ProductFormSeoTab
                    formData={formData}
                    updateSeoFields={updateSeoFields}
                    generateSlug={generateSlug}
                    seoPreviewUrl={seoPreviewUrl}
                    seoPreviewTitle={seoPreviewTitle}
                    seoPreviewDesc={seoPreviewDesc}
                    handleSaveSeo={handleSaveSeo}
                    loading={loading}
                    id={id}
                />
            </div>
        </div>
    );
}
