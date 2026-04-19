'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import MoneyDisplay from '@/components/admin/quotes/MoneyDisplay';
import QuoteSummary from '@/components/admin/quotes/QuoteSummary';
import ProductPicker from '@/components/admin/quotes/ProductPicker';
import EditableCell from '@/components/admin/quotes/EditableCell';
import CustomerPicker from '@/components/admin/quotes/CustomerPicker';
import QuoteInteractionPanel from './components/QuoteInteractionPanel';
import QuoteSignaturePanel from './components/QuoteSignaturePanel';
import VariantTabBar from './components/VariantTabBar';
import DocumentDownloadPanel from './components/DocumentDownloadPanel';
import PaymentRecordPanel from './components/PaymentRecordPanel';
import QuoteViewHistory from './components/QuoteViewHistory';
import QuoteHeaderSection from './components/QuoteHeaderSection';
import QuoteAlertsSection from './components/QuoteAlertsSection';
import InvoiceInfoSection from './components/InvoiceInfoSection';
import CustomerNoteSection from './components/CustomerNoteSection';
import WarrantyInfoSection from './components/WarrantyInfoSection';
import InternalNoteSection from './components/InternalNoteSection';
import CompletionInfoSection from './components/CompletionInfoSection';
import { getWarrantyStatus, getWarrantyRemainingDays, WARRANTY_ELIGIBLE_STATUSES } from '@/lib/warranty';
import { calculateQuoteWithTaxExtraRate } from '@/lib/quote-calculator-core';
import { resolveCustomerQuoteDefaults } from '@/lib/customer-defaults';
import { DEFAULT_CUSTOMER_NOTE } from '@/lib/quote-defaults';
import { sanitizeReturnTo, withReturnTo } from '@/lib/admin-return-to';

interface QuoteDetail {
    id: string;
    quoteNumber: string;
    customerId: string;
    companyNameId: string | null;
    contactId: string;
    locationId: string | null;
    status: string;
    taxRate: string;
    subtotalAmount: string;
    discountAmount: string;
    discountNote: string | null;
    discountExpiryAt: string | null;
    totalAmount: string;
    totalCost: string;
    totalProfit: string;
    taxCost: string;
    actualProfit: string;
    transportFee: string;
    transportFeeCost: string;
    hasTransportFee: boolean;
    internalNote: string | null;
    customerNote: string | null;
    completion_note: string | null;
    validUntil: string;
    isSuperseded: boolean;
    parentQuoteId: string | null;
    parentQuote: { quoteNumber: string } | null;
    childQuotes: { id: string; quoteNumber: string }[];
    completedAt: string | null;
    invoiceIssuedAt: string | null;
    warrantyStartDate: string | null;
    warrantyMonths: number | null;
    warrantyExpiresAt: string | null;
    selectedVariantId: string | null;
    customer: any;
    companyName: any;
    contact: any;
    location: any;
    name: string | null;
    nameEn: string | null;
    items: QuoteItem[];
    variants: Variant[];
}

interface Variant {
    id: string;
    name: string;
    isRecommended: boolean;
    sortOrder: number;
    subtotalAmount: string;
    totalAmount: string;
    totalCost: string;
}

interface QuoteItem {
    id: string;
    productId: string | null;
    name: string;
    description: string | null;
    unit: string | null;
    quantity: number;
    unitPrice: string;
    costPrice: string;
    subtotal: string;
    isHiddenItem: boolean;
    internalNote: string | null;
    customerNote: string | null;
    sortOrder: number;
    variantId: string | null;
}

function isValidDateInput(value: string | null | undefined) {
    if (!value) return true;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
}

function isNonNegativeNumber(value: unknown) {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0;
}

function validateQuoteDraft(quote: QuoteDetail | null) {
    if (!quote) return '報價單資料不存在';

    if (!isNonNegativeNumber(quote.discountAmount)) return '折扣金額不可為負數';
    if (!isNonNegativeNumber(quote.transportFee)) return '車馬費報價不可為負數';
    if (!isNonNegativeNumber(quote.transportFeeCost)) return '車馬費成本不可為負數';
    if (!isNonNegativeNumber(quote.warrantyMonths ?? 0)) return '保固月數不可為負數';
    if (!isValidDateInput(quote.discountExpiryAt)) return '折扣期限日期格式錯誤';
    if (!isValidDateInput(quote.completedAt)) return '施工日期格式錯誤';
    if (!isValidDateInput(quote.invoiceIssuedAt)) return '開票日期格式錯誤';
    if (!isValidDateInput(quote.warrantyStartDate)) return '保固起算日格式錯誤';

    for (const item of quote.items) {
        if (!String(item.name ?? '').trim()) return '品項名稱不可為空白';
        if (!isNonNegativeNumber(item.quantity)) return `品項「${item.name}」數量不可為負數`;
        if (!isNonNegativeNumber(item.unitPrice)) return `品項「${item.name}」單價不可為負數`;
        if (!isNonNegativeNumber(item.costPrice)) return `品項「${item.name}」成本不可為負數`;
    }

    return null;
}

function getVariantAwareTotals(quote: QuoteDetail | null, activeVariantId: string | null, taxExtraRate: number = 3) {
    if (!quote) {
        return {
            subtotalAmount: 0,
            totalAmount: 0,
            totalCost: 0,
            totalProfit: 0,
            taxCost: 0,
            actualProfit: 0,
        };
    }

    const discountAmount = Number(quote.discountAmount || 0);
    const taxRate = Number(quote.taxRate || 0);
    const transportFee = quote.hasTransportFee ? Number(quote.transportFee || 0) : 0;
    const transportFeeCost = quote.hasTransportFee ? Number(quote.transportFeeCost || 0) : 0;
    const items = quote.items ?? [];

    const sharedItems = items.filter((item) => !item.variantId);
    const variantItems = (variantId: string | null) => items.filter((item) => item.variantId === variantId);
    const toCalcItem = (item: QuoteItem) => ({
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        costPrice: Number(item.costPrice || 0),
    });

    if (!quote.variants?.length) {
        return calculateQuoteWithTaxExtraRate(items.map(toCalcItem), discountAmount, taxRate, transportFee, transportFeeCost, taxExtraRate);
    }

    const variantIds = quote.variants.map((variant) => variant.id);
    const resolvedVariantId = activeVariantId
        || quote.selectedVariantId
        || quote.variants.find((variant) => variant.isRecommended)?.id
        || variantIds[0]
        || null;

    const scopedItems = [...sharedItems, ...variantItems(resolvedVariantId)];
    return calculateQuoteWithTaxExtraRate(scopedItems.map(toCalcItem), discountAmount, taxRate, transportFee, transportFeeCost, taxExtraRate);
}

// Performance Optimized Components
const MemoizedMoneyDisplay = React.memo(MoneyDisplay);
const MemoizedEditableCell = React.memo(EditableCell);
const QuoteInput = React.memo(({ value, onValueChange, placeholder, className, type = "text", disabled = false, ...props }: any) => {
    return (
        <input
            {...props}
            type={type}
            value={value ?? ''}
            disabled={disabled}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={placeholder}
            className={className}
        />
    );
});
QuoteInput.displayName = 'QuoteInput';

export default function QuoteWorkbenchPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [quote, setQuote] = useState<QuoteDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [cloning, setCloning] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerMode, setPickerMode] = useState<'search' | 'create'>('search');
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null); // null = shared items
    const [viewData, setViewData] = useState<any>(null);
    const [isInternalNoteOpen, setIsInternalNoteOpen] = useState(false);
    const [isCompletionNoteOpen, setIsCompletionNoteOpen] = useState(false);
    const pendingFieldsRef = React.useRef<Record<string, any>>({});
    const pendingItemFieldsRef = React.useRef<Record<string, Record<string, any>>>({});
    const pendingFocusItemIdRef = React.useRef<string | null>(null);
    const pendingDeleteRestoreRef = React.useRef<{ itemId: string | null; top: number | null } | null>(null);
    const autoSaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoSaveInFlightRef = React.useRef(false);
    const returnTo = sanitizeReturnTo(searchParams.get('returnTo'));

    const fetchViews = useCallback(async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/quotes/${id}/views`);
            if (res.ok) {
                const data = await res.json();
                setViewData(data);
            }
        } catch (e) { console.error(e); }
    }, [id]);

    useEffect(() => {
        if (quote?.status && ['sent', 'signed', 'construction', 'completed', 'paid'].includes(quote.status)) {
            fetchViews();
        }
    }, [id, quote?.status, fetchViews]);

    const isDraft = quote?.status === 'draft';

    const fetchQuote = useCallback(async () => {
        try {
            const res = await fetch(`/api/quotes/${id}`);
            const data = await res.json();
            setQuote(data.quote);
            pendingFieldsRef.current = {};
            pendingItemFieldsRef.current = {};
            setHasUnsavedChanges(false);
        } catch (e) {
            console.error(e);
            toast.error('讀取報價單失敗');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchQuote(); }, [fetchQuote]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!hasUnsavedChanges) return;
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    useEffect(() => {
        const focusItemId = pendingFocusItemIdRef.current;
        if (!focusItemId) return;

        const target = document.querySelector<HTMLElement>(`[data-testid="quote-item-name-${focusItemId}"]`);
        if (!target) return;

        pendingFocusItemIdRef.current = null;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        window.setTimeout(() => {
            target.click();
            window.setTimeout(() => {
                const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`input[data-testid="quote-item-name-${focusItemId}"], textarea[data-testid="quote-item-name-${focusItemId}"]`);
                input?.focus();
                input?.select();
            }, 40);
        }, 80);
    }, [quote?.items, activeVariantId]);

    useEffect(() => {
        const restoreTarget = pendingDeleteRestoreRef.current;
        if (!restoreTarget) return;

        const selector = restoreTarget.itemId ? `[data-quote-item-row="${restoreTarget.itemId}"]` : 'tbody';
        const target = document.querySelector<HTMLElement>(selector);
        if (!target) return;

        pendingDeleteRestoreRef.current = null;

        if (restoreTarget.top == null) return;

        const delta = target.getBoundingClientRect().top - restoreTarget.top;
        if (Math.abs(delta) > 1) {
            window.scrollBy(0, delta);
        }
    }, [quote?.items, activeVariantId]);

    const activeVariant = quote?.variants?.find(v => v.id === activeVariantId);
    const derivedTotals = getVariantAwareTotals(quote, activeVariantId);
    const displaySubtotal = derivedTotals.subtotalAmount;
    const displayTotalAmount = derivedTotals.totalAmount;
    const displayTotalCost = derivedTotals.totalCost;
    const displayTotalProfit = derivedTotals.totalProfit;
    const taxRate = Number(quote?.taxRate || 0);
    const displayTaxCost = derivedTotals.taxCost;
    const displayActualProfit = derivedTotals.actualProfit;
    const requiresInvoice = taxRate > 0;
    const invoiceIssued = Boolean(quote?.invoiceIssuedAt);
    const showInvoiceReminder = Boolean(quote && requiresInvoice && !invoiceIssued && quote.status === 'completed');
    const showPaymentReminder = Boolean(quote && quote.status === 'completed');

    const updateQuote = useCallback((fields: any) => {
        setQuote(prev => prev ? { ...prev, ...fields } : prev);
        pendingFieldsRef.current = { ...pendingFieldsRef.current, ...fields };
        setHasUnsavedChanges(true);
    }, []);

    const persistPendingChanges = useCallback(async ({ showNoChangesMessage = false }: { showNoChangesMessage?: boolean } = {}) => {
        if (!quote) return false as const;

        const hasPendingQuoteFields = Object.keys(pendingFieldsRef.current).length > 0;
        const hasPendingItemFields = Object.keys(pendingItemFieldsRef.current).length > 0;

        if (!hasPendingQuoteFields && !hasPendingItemFields) {
            if (showNoChangesMessage) {
                toast.message('目前沒有未儲存的變更');
            }
            return 'noop' as const;
        }

        const validationError = validateQuoteDraft(quote);
        if (validationError) {
            toast.error(validationError);
            return false;
        }

        const toSend = { ...pendingFieldsRef.current };

        setSaving(true);
        try {
            if (Object.keys(toSend).length > 0) {
                const res = await fetch(`/api/quotes/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(toSend),
                });
                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.error || '儲存失敗');
                    return false;
                }
            }

            const pendingItems = Object.entries(pendingItemFieldsRef.current);
            for (const [itemId, fields] of pendingItems) {
                const res = await fetch(`/api/quotes/${id}/items/${itemId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fields),
                });
                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.error || '品項儲存失敗');
                    return false;
                }
            }

            pendingFieldsRef.current = {};
            pendingItemFieldsRef.current = {};
            setHasUnsavedChanges(false);
            await fetchQuote();
            return 'saved' as const;
        } catch (e) {
            toast.error('發生錯誤');
            return false as const;
        } finally {
            setSaving(false);
        }
    }, [fetchQuote, id, quote]);

    const saveQuote = useCallback(async () => {
        const saved = await persistPendingChanges({ showNoChangesMessage: true });
        if (saved === 'saved') {
            toast.success('報價單變更已儲存');
        }
    }, [persistPendingChanges]);

    useEffect(() => {
        if (!hasUnsavedChanges || saving || autoSaveInFlightRef.current) {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
                autoSaveTimeoutRef.current = null;
            }
            return;
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
            autoSaveInFlightRef.current = true;
            void persistPendingChanges().finally(() => {
                autoSaveInFlightRef.current = false;
            });
        }, 1200);

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
                autoSaveTimeoutRef.current = null;
            }
        };
    }, [hasUnsavedChanges, saving, persistPendingChanges]);

    const saveQuoteFieldsImmediately = useCallback(async (fields: Record<string, any>) => {
        if (!quote) return;
        setQuote(prev => prev ? { ...prev, ...fields } : prev);
        setSaving(true);
        try {
            const res = await fetch(`/api/quotes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fields),
            });
            if (res.ok) {
                pendingFieldsRef.current = {};
                pendingItemFieldsRef.current = {};
                setHasUnsavedChanges(false);
                await fetchQuote();
                toast.success('報價單變更已儲存');
            } else {
                const err = await res.json();
                toast.error(err.error || '儲存失敗');
                await fetchQuote();
            }
        } catch (e) {
            toast.error('發生錯誤');
            await fetchQuote();
        } finally {
            setSaving(false);
        }
    }, [fetchQuote, id, quote]);

    const applySelectedCustomerToQuote = useCallback(async (customerId: string) => {
        try {
            const res = await fetch(`/api/customers/${customerId}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || '載入客戶資料失敗');
                return;
            }

            const data = await res.json();
            const customer = data.customer;
            const defaults = resolveCustomerQuoteDefaults(customer);

            await saveQuoteFieldsImmediately({
                customerId,
                companyNameId: defaults.defaultCompanyNameId,
                contactIds: defaults.defaultContactIds,
                locationId: defaults.defaultLocationId,
            });
        } catch (error) {
            console.error(error);
            toast.error('切換客戶時發生錯誤');
        }
    }, [saveQuoteFieldsImmediately]);

    const handleBackToList = useCallback(() => {
        if (hasUnsavedChanges && !window.confirm('目前有未儲存的變更，確定要離開嗎？')) return;
        router.push(returnTo);
    }, [hasUnsavedChanges, returnTo, router]);

    const insertItemLocally = useCallback((item: QuoteItem) => {
        setQuote(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                items: [...prev.items, item].sort((a, b) => a.sortOrder - b.sortOrder),
            };
        });
        pendingItemFieldsRef.current = {};
        setHasUnsavedChanges(false);
    }, []);

    const refreshQuoteInBackground = useCallback(() => {
        void fetchQuote();
    }, [fetchQuote]);

    const ensureChangesSaved = useCallback(async () => {
        if (!hasUnsavedChanges) return true;

        toast.message('先幫您儲存目前變更...');
        const saved = await persistPendingChanges();
        return saved === 'saved' || saved === 'noop';
    }, [hasUnsavedChanges, persistPendingChanges]);

    const addProductItem = async (productId: string, priceMode: string) => {
        if (!(await ensureChangesSaved())) return;
        try {
            const res = await fetch(`/api/quotes/${id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, priceMode, variantId: activeVariantId }),
            });
            if (res.ok) {
                const createdItem = await res.json();
                pendingFocusItemIdRef.current = createdItem.id;
                insertItemLocally(createdItem);
                setIsProductPickerOpen(false);
                toast.success('已加入');
                refreshQuoteInBackground();
            } else {
                const err = await res.json();
                toast.error(err.error || '加入失敗');
            }
        } catch (e) { toast.error('發生錯誤'); }
    };

    const addManualItem = async () => {
        if (!(await ensureChangesSaved())) return;
        try {
            const res = await fetch(`/api/quotes/${id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: '新項目',
                    unit: '組',
                    quantity: 1,
                    unitPrice: 0,
                    costPrice: 0,
                    variantId: activeVariantId
                }),
            });
            if (res.ok) {
                const createdItem = await res.json();
                pendingFocusItemIdRef.current = createdItem.id;
                insertItemLocally(createdItem);
                refreshQuoteInBackground();
            }
        } catch (e) { toast.error('發生錯誤'); }
    };

    const updateItem = useCallback((itemId: string, fields: any) => {
        setQuote(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                items: prev.items.map(item => {
                    if (item.id !== itemId) return item;
                    const nextItem = { ...item, ...fields } as QuoteItem;
                    const quantity = Number(nextItem.quantity);
                    const unitPrice = Number(nextItem.unitPrice);
                    nextItem.subtotal = String(Math.round(quantity * unitPrice));
                    return nextItem;
                })
            };
        });
        pendingItemFieldsRef.current = {
            ...pendingItemFieldsRef.current,
            [itemId]: {
                ...(pendingItemFieldsRef.current[itemId] || {}),
                ...fields,
            }
        };
        setHasUnsavedChanges(true);
    }, []);

    const deleteItem = async (itemId: string) => {
        if (!(await ensureChangesSaved())) return;
        const scopedItems = quote?.items.filter(item => item.variantId === activeVariantId) ?? [];
        const currentIndex = scopedItems.findIndex(item => item.id === itemId);
        const nextItemId = scopedItems[currentIndex + 1]?.id ?? scopedItems[currentIndex - 1]?.id ?? null;
        const currentRow = document.querySelector<HTMLElement>(`[data-quote-item-row="${itemId}"]`);
        pendingDeleteRestoreRef.current = {
            itemId: nextItemId,
            top: currentRow?.getBoundingClientRect().top ?? null,
        };
        try {
            const res = await fetch(`/api/quotes/${id}/items/${itemId}`, { method: 'DELETE' });
            if (res.ok) {
                delete pendingItemFieldsRef.current[itemId];
                toast.success('已刪除');
                await fetchQuote();
            }
        } catch (e) { toast.error('發生錯誤'); }
    };


    const moveItem = async (itemId: string, direction: 'up' | 'down') => {
        if (!(await ensureChangesSaved())) return;
        if (!quote) return;
        const items = [...quote.items];
        const idx = items.findIndex(i => i.id === itemId);
        if (direction === 'up' && idx > 0) {
            [items[idx], items[idx - 1]] = [items[idx - 1], items[idx]];
        } else if (direction === 'down' && idx < items.length - 1) {
            [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
        } else return;
        const reorderData = items.map((item, i) => ({ id: item.id, sortOrder: i }));
        try {
            await fetch(`/api/quotes/${id}/items/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: reorderData }),
            });
            fetchQuote();
        } catch (e) { console.error(e); }
    };

    const changeStatus = async (newStatus: string) => {
        if (!(await ensureChangesSaved())) return;
        try {
            const res = await fetch(`/api/quotes/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                toast.success('狀態已更新');
                setIsProductPickerOpen(false);
                fetchQuote();
            }
            else { const err = await res.json(); toast.error(err.error || '更新失敗'); }
        } catch (e) { toast.error('發生錯誤'); }
    };

    const handleClone = async () => {
        if (!(await ensureChangesSaved())) return;
        if (!window.confirm('確定要複製這份報價單嗎？會產生新的報價編號。')) return;
        setCloning(true);
        try {
            const res = await fetch(`/api/quotes/${id}/clone`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                toast.success('報價單已複製');
                router.push(withReturnTo(`/admin/quotes/${data.id}`, returnTo));
            } else {
                const err = await res.json();
                toast.error(err.error || '複製失敗');
            }
        } catch (e) {
            toast.error('複製時發生錯誤');
        } finally {
            setCloning(false);
        }
    };

    const handleSaveAsTemplate = async () => {
        if (!(await ensureChangesSaved())) return;
        const name = window.prompt('請輸入模板名稱', quote?.name || '');
        if (!name) return;
        setSavingTemplate(true);
        try {
            const res = await fetch(`/api/quotes/${id}/save-as-template`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                toast.success('已存為模板');
            } else {
                const err = await res.json();
                toast.error(err.error || '存檔失敗');
            }
        } catch (e) {
            toast.error('存檔時發生錯誤');
        } finally {
            setSavingTemplate(false);
        }
    };

    const openCustomerPicker = useCallback(async () => {
        if (!(await ensureChangesSaved())) return;
        setPickerMode('search');
        setIsPickerOpen(true);
    }, [ensureChangesSaved]);

    const openProductPicker = useCallback(async () => {
        if (!(await ensureChangesSaved())) return;
        setIsProductPickerOpen(true);
    }, [ensureChangesSaved]);

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-efan-primary"></div>
                <span className="text-gray-400 font-bold animate-pulse">載入中...</span>
            </div>
        );
    }

    if (!quote) {
        return <div className="py-20 text-center text-gray-400 font-bold">報價單不存在</div>;
    }

    return (
        <div className="min-h-screen bg-white animate-in fade-in duration-500 pb-20">
            {/* Header / Row 1 & 2 */}
            <QuoteHeaderSection quote={quote} isDraft={isDraft}
                saving={saving}
                hasUnsavedChanges={hasUnsavedChanges}
                onManualSave={saveQuote}
                cloning={cloning}
                savingTemplate={savingTemplate}
                updateQuote={updateQuote}
                onChangeStatus={changeStatus}
                onOpenPicker={openCustomerPicker}
                onClone={handleClone}
                onSaveAsTemplate={handleSaveAsTemplate}
                onRefresh={fetchQuote}
                viewData={viewData}
                onRefreshViews={fetchViews}
                onBack={handleBackToList}
                onViewCustomer={() => router.push(`/admin/customers/${quote.customerId}`)}
                onEditCustomer={() => router.push(`/admin/customers/${quote.customerId}/edit`)}
            />

            <div className="flex flex-col gap-0">
                <QuoteAlertsSection
                    requiresInvoice={requiresInvoice}
                    showInvoiceReminder={showInvoiceReminder}
                    showPaymentReminder={showPaymentReminder}
                />

                {/* Row 3: Items Table (Full Width) */}
                <div className="relative border-b border-gray-100 min-h-[400px]">
                    {/* Collapsible Product Picker Overlay - Placeholder for Phase 3 */}
                    <div className="p-4 md:p-8">
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            {isDraft && (
                                <>
                                    <button
                                        onClick={openProductPicker}
                                        className="px-5 py-3 sm:py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        🔍 產品快選 ▶
                                    </button>
                                    <button onClick={addManualItem}
                                        className="px-5 py-3 sm:py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm">
                                        ＋ 新增項目
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                            {quote.variants && quote.variants.length > 0 && (
                                <VariantTabBar
                                    quoteId={id}
                                    variants={quote.variants}
                                    activeVariantId={activeVariantId}
                                    onTabChange={setActiveVariantId}
                                    onRefresh={fetchQuote}
                                    disabled={!isDraft}
                                />
                            )}
                            <table className="min-w-[900px] w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-5 py-4 text-xs font-black text-gray-400 uppercase tracking-wider w-[3%]">#</th>
                                        <th className="px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-wider w-[42%]">品名 / 描述</th>
                                        <th className="px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-wider w-[8%] text-right">數量</th>
                                        <th className="px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-wider w-[5%]">單位</th>
                                        <th className="px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-wider w-[12%] text-right">單價</th>
                                        <th className="px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-wider w-[12%] text-right text-gray-300 font-normal">成本</th>
                                        <th className="px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-wider w-[13%] text-right">小計</th>
                                        <th className="px-2 py-4 w-[5%]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quote.items
                                        .filter(item => item.variantId === activeVariantId)
                                        .map((item, idx) => (
                                            <tr key={item.id} data-quote-item-row={item.id} className="group border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex flex-col items-center group-hover:gap-1">
                                                        <span className="text-[13px] font-bold text-gray-300 group-hover:hidden">{idx + 1}</span>
                                                        <div className="hidden group-hover:flex flex-col items-center">
                                                            <button onClick={() => moveItem(item.id, 'up')} className="text-[10px] text-gray-400 hover:text-efan-primary">▲</button>
                                                            <button onClick={() => moveItem(item.id, 'down')} className="text-[10px] text-gray-400 hover:text-efan-primary">▼</button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex flex-col">
                                                        <MemoizedEditableCell value={item.name} disabled={!isDraft} onSave={(v) => updateItem(item.id, { name: v })} className="text-sm font-bold text-gray-800" dataTestId={`quote-item-name-${item.id}`} />
                                                        <MemoizedEditableCell value={item.description || ''} multiline={true} disabled={!isDraft} onSave={(v) => updateItem(item.id, { description: v })} className="text-xs text-gray-400 mt-1" placeholder="點擊新增描述..." />
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <MemoizedEditableCell value={item.quantity} type="number" disabled={!isDraft} onSave={(v) => updateItem(item.id, { quantity: Number(v) })} className="text-right" />
                                                        {item.quantity === 0 && (
                                                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black rounded whitespace-nowrap">選購</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <MemoizedEditableCell value={item.unit || ''} disabled={!isDraft} onSave={(v) => updateItem(item.id, { unit: v })} />
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <MemoizedEditableCell value={Number(item.unitPrice)} type="number" disabled={!isDraft} onSave={(v) => updateItem(item.id, { unitPrice: Number(v) })} className="text-right" />
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <MemoizedEditableCell value={Number(item.costPrice)} type="number" disabled={!isDraft} onSave={(v) => updateItem(item.id, { costPrice: Number(v) })} className="text-gray-300 text-right" />
                                                </td>
                                                <td className="px-3 py-3 text-right font-bold text-gray-700">
                                                    <MemoizedMoneyDisplay amount={item.subtotal} />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => updateItem(item.id, { isHiddenItem: !item.isHiddenItem })}
                                                            className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${item.isHiddenItem ? 'bg-amber-50 text-amber-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                                            title={item.isHiddenItem ? '隱藏項目' : '顯示項目'}>
                                                            {item.isHiddenItem ? '🙈' : '👁️'}
                                                        </button>
                                                        {isDraft && (
                                                            <button onClick={() => deleteItem(item.id)} className="rounded-md px-2 py-1 text-[11px] font-bold text-red-400 transition-colors hover:bg-red-50 hover:text-red-600" title="刪除此項目">刪除</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    {quote.items.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-gray-200 font-bold">
                                                尚無明細項目
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Row 4: Discount, Tax, Transport (Left) & Summary (Right) */}
                <div className="grid grid-cols-1 border-b border-gray-100 lg:grid-cols-12 lg:divide-x divide-gray-100">
                    {/* Left: Inputs */}
                    <div className="space-y-6 p-4 md:p-8 lg:col-span-8 lg:space-y-8">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
                            <div className="space-y-2 md:col-span-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">折扣金額</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <QuoteInput type="number" value={Number(quote.discountAmount)} disabled={!isDraft}
                                        onValueChange={(v: any) => updateQuote({ discountAmount: Number(v) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 bg-gray-50 rounded-xl border-none font-bold focus:ring-2 focus:ring-efan-primary text-sm shadow-inner" placeholder="0" />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-6">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">折扣說明</label>
                                <QuoteInput value={quote.discountNote} disabled={!isDraft}
                                    onValueChange={(v: string) => updateQuote({ discountNote: v })}
                                    className="w-full px-4 py-2 bg-gray-50 rounded-xl border-none font-bold focus:ring-2 focus:ring-efan-primary text-sm shadow-inner" placeholder="例：VIP客戶優惠" />
                            </div>
                            <div className="space-y-2 md:col-span-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">折扣期限</label>
                                <QuoteInput type="date" value={quote.discountExpiryAt ? quote.discountExpiryAt.split('T')[0] : ''} disabled={!isDraft}
                                    onValueChange={(v: string) => updateQuote({ discountExpiryAt: v || null })}
                                    max="9999-12-31"
                                    className="w-full px-4 py-2 bg-gray-50 rounded-xl border-none font-bold focus:ring-2 focus:ring-efan-primary text-sm shadow-inner" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end">
                            <div className="space-y-3 md:col-span-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">稅率選擇</label>
                                <div className="flex flex-wrap items-center gap-6">
                                    <button
                                        onClick={() => isDraft && updateQuote({ taxRate: 5, discountAmount: Number(quote.discountAmount) })}
                                        className="flex items-center gap-3 group"
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${Number(quote.taxRate) === 5 ? 'border-efan-primary bg-efan-primary ring-4 ring-efan-primary/10' : 'border-gray-200 bg-white group-hover:border-gray-300'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full bg-white transition-all ${Number(quote.taxRate) === 5 ? 'scale-100' : 'scale-0'}`} />
                                        </div>
                                        <span className={`text-sm font-bold ${Number(quote.taxRate) === 5 ? 'text-gray-800' : 'text-gray-400'}`}>5%</span>
                                    </button>
                                    <button
                                        onClick={() => isDraft && updateQuote({ taxRate: 0, discountAmount: Number(quote.discountAmount) })}
                                        className="flex items-center gap-3 group"
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${Number(quote.taxRate) === 0 ? 'border-efan-primary bg-efan-primary ring-4 ring-efan-primary/10' : 'border-gray-200 bg-white group-hover:border-gray-300'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full bg-white transition-all ${Number(quote.taxRate) === 0 ? 'scale-100' : 'scale-0'}`} />
                                        </div>
                                        <span className={`text-sm font-bold ${Number(quote.taxRate) === 0 ? 'text-gray-800' : 'text-gray-400'}`}>0%</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-8">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">車馬費 ( 報價 / 成本 )</label>
                                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                        <div className={`relative flex-1 transition-all ${quote.hasTransportFee ? 'opacity-100' : 'opacity-30'}`}>
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <QuoteInput
                                                type="number"
                                                value={Number(quote.transportFee)}
                                                disabled={!isDraft || !quote.hasTransportFee}
                                                onValueChange={(v: any) => updateQuote({ transportFee: Number(v) || 0 })}
                                                className="w-full pl-8 pr-4 py-2 bg-gray-50 rounded-xl border-none font-bold focus:ring-2 focus:ring-efan-primary text-sm shadow-inner"
                                                placeholder="報價"
                                            />
                                        </div>
                                        <div className={`relative flex-1 transition-all ${quote.hasTransportFee ? 'opacity-100' : 'opacity-30'}`}>
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span>
                                            <QuoteInput
                                                type="number"
                                                value={Number((quote as any).transportFeeCost || 0)}
                                                disabled={!isDraft || !quote.hasTransportFee}
                                                onValueChange={(v: any) => updateQuote({ transportFeeCost: Number(v) || 0 })}
                                                className="w-full pl-8 pr-4 py-2 bg-gray-50/50 rounded-xl border-none font-bold focus:ring-2 focus:ring-gray-300 text-sm text-gray-400 shadow-inner"
                                                placeholder="成本"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => isDraft && updateQuote({ hasTransportFee: !quote.hasTransportFee })}
                                        className={`shrink-0 text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 h-[38px] ${quote.hasTransportFee ? 'bg-efan-primary text-white ring-4 ring-efan-primary/10' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${quote.hasTransportFee ? 'bg-white' : 'bg-gray-300'}`}></span>
                                        {quote.hasTransportFee ? '已啟用' : '未啟用'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <div className="border-t border-gray-100 bg-gray-50/20 p-4 md:p-8 lg:col-span-4 lg:border-t-0">
                        <div className="flex h-full flex-col gap-2 lg:items-end lg:justify-center">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                {activeVariant ? `${activeVariant.name} 合計` : '主表合計'}
                            </h3>
                            <QuoteSummary
                                subtotalAmount={displaySubtotal}
                                discountAmount={Number(quote.discountAmount)}
                                totalAmount={displayTotalAmount}
                                totalCost={displayTotalCost}
                                totalProfit={displayTotalProfit}
                                transportFee={quote.hasTransportFee ? Number(quote.transportFee) : 0}
                                taxRate={taxRate}
                                taxCost={displayTaxCost}
                                actualProfit={displayActualProfit}
                            />
                        </div>
                    </div>
                </div>

                {/* Row 6: Internal Note (Collapsible) */}
                <InternalNoteSection
                    value={quote.internalNote}
                    isOpen={isInternalNoteOpen}
                    onToggle={() => setIsInternalNoteOpen(!isInternalNoteOpen)}
                    onChange={(value) => updateQuote({ internalNote: value })}
                />

                {/* Row 6B: Completion Note (Collapsible Technical Info) */}
                <CompletionInfoSection
                    completedAt={quote.completedAt}
                    note={quote.completion_note}
                    isOpen={isCompletionNoteOpen}
                    onToggle={() => setIsCompletionNoteOpen(!isCompletionNoteOpen)}
                    onChangeCompletedAt={(value) => updateQuote({ completedAt: value })}
                    onChangeNote={(value) => updateQuote({ completion_note: value })}
                />

                <InvoiceInfoSection
                    requiresInvoice={requiresInvoice}
                    invoiceIssued={invoiceIssued}
                    invoiceIssuedAt={quote.invoiceIssuedAt}
                    onChangeInvoiceIssuedAt={(value) => updateQuote({ invoiceIssuedAt: value })}
                />

                {/* Row 5: Customer Note */}
                <CustomerNoteSection
                    value={quote.customerNote ?? DEFAULT_CUSTOMER_NOTE}
                    disabled={!isDraft}
                    onChange={(value) => updateQuote({ customerNote: value })}
                />

                <QuoteViewHistory viewData={viewData} />

                {/* Row 7.5: Warranty Info (only for completed/paid) */}
                {quote && WARRANTY_ELIGIBLE_STATUSES.includes(quote.status as any) && (
                    <WarrantyInfoSection
                        quote={quote}
                        warrantyStatus={getWarrantyStatus(quote)}
                        remainingDays={getWarrantyRemainingDays(quote)}
                        onChangeWarrantyStartDate={(value) => updateQuote({ warrantyStartDate: value })}
                        onChangeWarrantyMonths={(value) => updateQuote({ warrantyMonths: value })}
                    />
                )}

                {/* Row 8: Payment Records */}
                {!isDraft && (
                    <div className="bg-gray-50/30 p-4 md:p-8">
                        <div className="max-w-4xl">
                            {(() => {
                                const taxRateVal = Number(quote?.taxRate || 0);
                                const preTax = Number(quote.totalAmount);
                                const grandTotal = preTax + Math.round(preTax * taxRateVal / 100);
                                return (
                                    <PaymentRecordPanel
                                        quoteId={quote.id}
                                        totalAmount={grandTotal}
                                        status={quote.status}
                                        onChangeStatus={changeStatus}
                                    />
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {isPickerOpen && (
                <CustomerPicker
                    initialMode={pickerMode}
                    onSelect={(c) => {
                        applySelectedCustomerToQuote(c.id);
                        setIsPickerOpen(false);
                    }}
                    onClose={() => setIsPickerOpen(false)}
                />
            )}

            {isProductPickerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsProductPickerOpen(false)}
                            className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
                        >
                            ✕
                        </button>
                        <ProductPicker
                            onAddProduct={(productId: string, priceMode: string) => {
                                addProductItem(productId, priceMode);
                                // Keep open for multiple products
                            }}
                            quoteId={id}
                            activeVariantId={activeVariantId}
                            onImported={() => {
                                fetchQuote();
                                setIsProductPickerOpen(false);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
