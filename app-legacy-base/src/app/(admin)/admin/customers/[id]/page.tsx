'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatMobile, formatPhone } from '@/lib/phone-format';
import MergeDialog from '@/components/admin/MergeDialog';
import NotePreview from '@/components/admin/NotePreview';
import QuoteStatusBadge from '@/components/admin/quotes/QuoteStatusBadge';
import WarrantyBadge from '@/components/WarrantyBadge';
import CustomerPortalSection from '@/components/admin/CustomerPortalSection';
import { buildReturnTo, withReturnTo } from '@/lib/admin-return-to';

type ContactDraft = {
    id?: string;
    name: string;
    title: string;
    mobile: string;
    phone: string;
    fax: string;
    email: string;
    hasLine: boolean;
    isPrimary: boolean;
    notes: string;
};

type LocationDraft = {
    id?: string;
    name: string;
    address: string;
    isPrimary: boolean;
    notes: string;
};

const emptyContactDraft: ContactDraft = {
    name: '',
    title: '',
    mobile: '',
    phone: '',
    fax: '',
    email: '',
    hasLine: false,
    isPrimary: false,
    notes: '',
};

const emptyLocationDraft: LocationDraft = {
    name: '',
    address: '',
    isPrimary: false,
    notes: '',
};

function ContactEditorDialog({
    open,
    mode,
    draft,
    saving,
    onClose,
    onChange,
    onSubmit,
}: {
    open: boolean;
    mode: 'create' | 'edit';
    draft: ContactDraft;
    saving: boolean;
    onClose: () => void;
    onChange: (field: keyof ContactDraft, value: string | boolean) => void;
    onSubmit: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm md:items-center md:p-4">
            <div className="w-full rounded-t-[32px] bg-white p-5 shadow-2xl md:max-w-2xl md:rounded-[32px] md:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">聯絡人管理</div>
                        <h3 className="mt-2 text-2xl font-black text-efan-primary">
                            {mode === 'create' ? '新增聯絡人' : '編輯聯絡人'}
                        </h3>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                            讓客戶主檔、報價與客戶入口帳號都能對應到正確聯絡人。
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl bg-gray-100 px-3 py-2 text-sm font-black text-gray-500"
                    >
                        關閉
                    </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-black text-gray-700">姓名 *</label>
                        <input
                            value={draft.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                            placeholder="例如：王小明"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-black text-gray-700">職稱</label>
                        <input
                            value={draft.title}
                            onChange={(e) => onChange('title', e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                            placeholder="例如：總務、店長"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-black text-gray-700">手機</label>
                        <input
                            value={draft.mobile}
                            onChange={(e) => onChange('mobile', e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                            placeholder="09xx-xxx-xxx"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-black text-gray-700">市話</label>
                        <input
                            value={draft.phone}
                            onChange={(e) => onChange('phone', e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                            placeholder="02-xxxx-xxxx"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-black text-gray-700">傳真</label>
                        <input
                            value={draft.fax}
                            onChange={(e) => onChange('fax', e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                            placeholder="02-xxxx-xxxx"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-black text-gray-700">電子郵件</label>
                        <input
                            value={draft.email}
                            onChange={(e) => onChange('email', e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                            placeholder="name@example.com"
                        />
                    </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                        <div>
                            <div className="text-sm font-black text-gray-700">設為主要聯絡人</div>
                            <div className="mt-1 text-xs font-medium text-gray-400">建立報價與客戶入口時優先帶入</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={draft.isPrimary}
                            onChange={(e) => onChange('isPrimary', e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-efan-primary focus:ring-efan-primary"
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                        <div>
                            <div className="text-sm font-black text-gray-700">已加入 LINE</div>
                            <div className="mt-1 text-xs font-medium text-gray-400">方便業務快速判斷聯絡方式</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={draft.hasLine}
                            onChange={(e) => onChange('hasLine', e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-efan-primary focus:ring-efan-primary"
                        />
                    </label>
                </div>

                <div className="mt-4">
                    <label className="mb-1.5 block text-sm font-black text-gray-700">備註</label>
                    <textarea
                        value={draft.notes}
                        onChange={(e) => onChange('notes', e.target.value)}
                        className="min-h-[110px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                        placeholder="例如：只接受簡訊、平日 10:00 後方便接電話"
                    />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={saving}
                        className="rounded-2xl bg-efan-primary px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                        {saving ? '儲存中...' : mode === 'create' ? '建立聯絡人' : '儲存變更'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function LocationEditorDialog({
    open,
    mode,
    draft,
    saving,
    onClose,
    onChange,
    onSubmit,
}: {
    open: boolean;
    mode: 'create' | 'edit';
    draft: LocationDraft;
    saving: boolean;
    onClose: () => void;
    onChange: (field: keyof LocationDraft, value: string | boolean) => void;
    onSubmit: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm md:items-center md:p-4">
            <div className="w-full rounded-t-[32px] bg-white p-5 shadow-2xl md:max-w-2xl md:rounded-[32px] md:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">案場管理</div>
                        <h3 className="mt-2 text-2xl font-black text-efan-primary">
                            {mode === 'create' ? '新增案場' : '編輯案場'}
                        </h3>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                            讓報價單、工程紀錄與客戶資訊都能對應到正確案場。
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl bg-gray-100 px-3 py-2 text-sm font-black text-gray-500"
                    >
                        關閉
                    </button>
                </div>

                <div className="mt-6 grid gap-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-black text-gray-700">案場名稱 *</label>
                        <input
                            value={draft.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                            placeholder="例如：總店、台北辦公室"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-black text-gray-700">案場地址 *</label>
                        <input
                            value={draft.address}
                            onChange={(e) => onChange('address', e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                            placeholder="例如：台北市大安區四維路 14 巷 15 號"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                        <div>
                            <div className="text-sm font-black text-gray-700">設為主要案場</div>
                            <div className="mt-1 text-xs font-medium text-gray-400">建立報價時優先帶入這個案場</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={draft.isPrimary}
                            onChange={(e) => onChange('isPrimary', e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-efan-primary focus:ring-efan-primary"
                        />
                    </label>
                </div>

                <div className="mt-4">
                    <label className="mb-1.5 block text-sm font-black text-gray-700">備註</label>
                    <textarea
                        value={draft.notes}
                        onChange={(e) => onChange('notes', e.target.value)}
                        className="min-h-[110px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                        placeholder="例如：停車不便、需先聯絡管理室"
                    />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={saving}
                        className="rounded-2xl bg-efan-primary px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                        {saving ? '儲存中...' : mode === 'create' ? '建立案場' : '儲存變更'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CustomerDetailPage() {
    const { id } = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [creatingQuote, setCreatingQuote] = useState(false);
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [contactDialogMode, setContactDialogMode] = useState<'create' | 'edit'>('create');
    const [contactSaving, setContactSaving] = useState(false);
    const [contactDraft, setContactDraft] = useState<ContactDraft>(emptyContactDraft);
    const [locationDialogOpen, setLocationDialogOpen] = useState(false);
    const [locationDialogMode, setLocationDialogMode] = useState<'create' | 'edit'>('create');
    const [locationSaving, setLocationSaving] = useState(false);
    const [locationDraft, setLocationDraft] = useState<LocationDraft>(emptyLocationDraft);
    const returnTo = buildReturnTo(pathname, searchParams);

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/customers/${id}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                router.push('/admin/customers');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const setPrimary = async (type: 'companies' | 'contacts' | 'locations', entityId: string) => {
        setActionLoading(entityId);
        try {
            const res = await fetch(`/api/customers/${id}/${type}/${entityId}/primary`, {
                method: 'PUT',
            });
            if (res.ok) {
                toast.success('已設為主要');
                fetchDetail();
            } else {
                toast.error('設定失敗');
            }
        } catch (e) {
            toast.error('連線出錯');
        } finally {
            setActionLoading(null);
        }
    };

    const deleteEntity = async (type: 'companies' | 'contacts' | 'locations', entityId: string) => {
        if (!confirm('確定要刪除此筆資料嗎？')) return;
        setActionLoading(entityId);
        try {
            const res = await fetch(`/api/customers/${id}/${type}/${entityId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('已刪除');
                fetchDetail();
            } else {
                const err = await res.json();
                toast.error(err.error || '刪除失敗');
            }
        } catch (e) {
            toast.error('連線出錯');
        } finally {
            setActionLoading(null);
        }
    };

    const openCreateContactDialog = () => {
        setContactDialogMode('create');
        setContactDraft({
            ...emptyContactDraft,
            isPrimary: !data?.customer?.contacts?.length,
        });
        setContactDialogOpen(true);
    };

    const openEditContactDialog = (contact: any) => {
        setContactDialogMode('edit');
        setContactDraft({
            id: contact.id,
            name: contact.name || '',
            title: contact.title || '',
            mobile: contact.mobile || '',
            phone: contact.phone || '',
            fax: contact.fax || '',
            email: contact.email || '',
            hasLine: Boolean(contact.hasLine),
            isPrimary: Boolean(contact.isPrimary),
            notes: contact.notes || '',
        });
        setContactDialogOpen(true);
    };

    const updateContactDraft = (field: keyof ContactDraft, value: string | boolean) => {
        setContactDraft((prev) => ({ ...prev, [field]: value }));
    };

    const saveContact = async () => {
        if (!contactDraft.name.trim()) {
            toast.error('請先填寫聯絡人姓名');
            return;
        }

        setContactSaving(true);
        try {
            const isEdit = contactDialogMode === 'edit' && contactDraft.id;
            const endpoint = isEdit
                ? `/api/customers/${id}/contacts/${contactDraft.id}`
                : `/api/customers/${id}/contacts`;

            const res = await fetch(endpoint, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactDraft),
            });

            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error || '儲存失敗');
                return;
            }

            toast.success(isEdit ? '聯絡人已更新' : '聯絡人已建立');
            setContactDialogOpen(false);
            setContactDraft(emptyContactDraft);
            fetchDetail();
        } catch (error) {
            console.error(error);
            toast.error('連線出錯');
        } finally {
            setContactSaving(false);
        }
    };

    const openCreateLocationDialog = () => {
        setLocationDialogMode('create');
        setLocationDraft({
            ...emptyLocationDraft,
            isPrimary: !data?.customer?.locations?.length,
        });
        setLocationDialogOpen(true);
    };

    const openEditLocationDialog = (location: any) => {
        setLocationDialogMode('edit');
        setLocationDraft({
            id: location.id,
            name: location.name || '',
            address: location.address || '',
            isPrimary: Boolean(location.isPrimary),
            notes: location.notes || '',
        });
        setLocationDialogOpen(true);
    };

    const updateLocationDraft = (field: keyof LocationDraft, value: string | boolean) => {
        setLocationDraft((prev) => ({ ...prev, [field]: value }));
    };

    const saveLocation = async () => {
        if (!locationDraft.name.trim() || !locationDraft.address.trim()) {
            toast.error('請先填寫案場名稱與地址');
            return;
        }

        setLocationSaving(true);
        try {
            const isEdit = locationDialogMode === 'edit' && locationDraft.id;
            const endpoint = isEdit
                ? `/api/customers/${id}/locations/${locationDraft.id}`
                : `/api/customers/${id}/locations`;

            const res = await fetch(endpoint, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(locationDraft),
            });

            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error || '儲存失敗');
                return;
            }

            toast.success(isEdit ? '案場已更新' : '案場已建立');
            setLocationDialogOpen(false);
            setLocationDraft(emptyLocationDraft);
            fetchDetail();
        } catch (error) {
            console.error(error);
            toast.error('連線出錯');
        } finally {
            setLocationSaving(false);
        }
    };

    const handleCreateQuote = async () => {
        if (!customer.id) return;
        setCreatingQuote(true);
        try {
            const primaryCompany = customer.companyNames?.find((c: any) => c.isPrimary);
            const primaryContact = customer.contacts?.find((c: any) => c.isPrimary);
            const primaryLocation = customer.locations?.find((l: any) => l.isPrimary);

            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customer.id,
                    companyNameId: primaryCompany?.id,
                    contactIds: primaryContact ? [primaryContact.id] : [],
                    locationId: primaryLocation?.id,
                    name: `${primaryName} - 新報價單`,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('報價單已建立');
                router.push(withReturnTo(`/admin/quotes/${data.quoteNumber}`, returnTo));
            } else {
                const err = await res.json();
                toast.error(err.error || '建立失敗');
                setCreatingQuote(false);
            }
        } catch (e) {
            console.error(e);
            toast.error('發生錯誤');
            setCreatingQuote(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-efan-primary"></div>
                <span className="text-gray-400 font-bold animate-pulse">正在讀取詳細資料...</span>
            </div>
        );
    }

    const customer = data?.customer ?? {};
    const stats = data?.stats ?? { quoteCount: 0, dealCount: 0, dealTotal: 0, lastQuoteDate: null };
    const primaryContact = customer.contacts?.find((c: any) => c.isPrimary) || customer.contacts?.[0] || null;
    const primaryEmail = primaryContact?.email || null;
    const primaryMobile = primaryContact?.mobile || null;

    const primaryName = (customer.companyNames?.find((c: any) => c.isPrimary)?.companyName) ||
        (customer.contacts?.find((c: any) => c.isPrimary)?.name) ||
        '未命名客戶';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4 items-start">
                    <div className="bg-efan-primary/5 p-4 rounded-3xl text-3xl">👤</div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-sm font-black bg-gray-100 px-3 py-1 rounded-full text-gray-500">
                                {customer.customerNumber ?? '---'}
                            </span>
                            {customer.isDeleted && (
                                <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded tracking-tighter uppercase">已刪除</span>
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-efan-primary tracking-tight">{primaryName}</h1>
                    </div>
                </div>
                <div className="hidden gap-2 md:flex md:flex-wrap md:justify-end">
                    {customer.id && (
                        <>
                            <button
                                onClick={handleCreateQuote}
                                disabled={creatingQuote}
                                className="px-6 py-3 rounded-xl bg-efan-primary text-white font-bold hover:bg-efan-primary-dark transition-all shadow-lg shadow-efan-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {creatingQuote ? '⏳ 處理中...' : '➕ 新增報價單'}
                            </button>
                            <Link
                                href={`/admin/customers/${customer.id}/edit`}
                                className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm text-center"
                            >
                                ✏️ 編輯客戶
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:hidden">
                {primaryMobile && (
                    <a
                        href={`tel:${primaryMobile}`}
                        className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-700 shadow-sm"
                    >
                        撥打電話
                    </a>
                )}
                {primaryEmail && (
                    <a
                        href={`mailto:${primaryEmail}`}
                        className="rounded-2xl bg-sky-50 px-4 py-3 text-center text-sm font-black text-sky-700 shadow-sm"
                    >
                        寄送郵件
                    </a>
                )}
                <button
                    onClick={handleCreateQuote}
                    disabled={creatingQuote || !customer.id}
                    className="rounded-2xl bg-efan-primary px-4 py-3 text-center text-sm font-black text-white shadow-sm disabled:opacity-50"
                >
                    新增報價
                </button>
                {customer.id && (
                    <Link
                        href={`/admin/customers/${customer.id}/edit`}
                        className="rounded-2xl bg-white border border-gray-200 px-4 py-3 text-center text-sm font-black text-gray-700 shadow-sm"
                    >
                        編輯客戶
                    </Link>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: '報價次數', value: stats.quoteCount ?? 0, icon: '📝' },
                    { label: '成交次數', value: stats.dealCount ?? 0, icon: '🤝' },
                    { label: '成交金額', value: `$ ${(stats.dealTotal ?? 0).toLocaleString()}`, icon: '💰' },
                    { label: '施作記錄', value: stats.completionRecordCount ?? 0, icon: '🔧' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-4 md:p-6 rounded-[28px] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:shadow-efan-primary/5">
                        <div className="text-2xl mb-2">{s.icon}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                        <div className="text-xl font-black text-efan-primary">{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Company Names */}
                    <div className="bg-white p-4 md:p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                        <h2 className="text-xl font-black text-efan-primary border-l-4 border-efan-accent pl-4">公司名稱</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">公司名稱 / 統編</th>
                                        <th className="py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">主要</th>
                                        <th className="py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {customer.companyNames.map((c: any) => (
                                        <tr key={c.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4">
                                                <div className="font-bold text-gray-900">{c.companyName}</div>
                                                <div className="text-xs font-mono text-gray-400">{c.taxId || '無統編'}</div>
                                            </td>
                                            <td className="py-4 text-center">
                                                {c.isPrimary ? (
                                                    <span className="text-efan-accent text-xl">⭐</span>
                                                ) : (
                                                    <button
                                                        onClick={() => setPrimary('companies', c.id)}
                                                        disabled={actionLoading === c.id}
                                                        className="text-gray-200 hover:text-efan-accent transition-colors text-xl"
                                                        title="設為主要"
                                                    >
                                                        ☆
                                                    </button>
                                                )}
                                            </td>
                                            <td className="py-4 text-right">
                                                <button
                                                    onClick={() => deleteEntity('companies', c.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all p-2"
                                                    title="刪除"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Contacts */}
                    <div className="bg-white p-4 md:p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-black text-efan-primary border-l-4 border-efan-accent pl-4">聯絡人</h2>
                                <p className="mt-2 text-sm font-medium text-gray-500">在同一頁就能維護聯絡資料，並指定主要聯絡人供報價與客戶入口使用。</p>
                            </div>
                            <button
                                onClick={openCreateContactDialog}
                                className="rounded-2xl bg-efan-primary px-4 py-2.5 text-sm font-black text-white shadow-sm"
                            >
                                新增聯絡人
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {customer.contacts.map((c: any) => (
                                <div key={c.id} className="p-5 md:p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
                                    {c.isPrimary ? (
                                        <div className="absolute top-0 right-0 bg-efan-accent text-white px-3 py-1 text-[10px] font-black rounded-bl-xl shadow-sm">主要</div>
                                    ) : (
                                        <button
                                            onClick={() => setPrimary('contacts', c.id)}
                                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-gray-200 text-gray-500 px-3 py-1 text-[10px] font-black rounded-bl-xl hover:bg-efan-primary hover:text-white transition-all"
                                        >
                                            設為主要
                                        </button>
                                    )}
                                    <div className="flex justify-between items-start mb-2 gap-3">
                                        <div>
                                            <div className="font-black text-efan-primary text-xl flex items-center gap-2">
                                                {c.name}
                                                {c.hasLine && <span className="bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">LINE</span>}
                                            </div>
                                            {c.title && <div className="text-xs font-black text-gray-400 mt-0.5">🏢 {c.title}</div>}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => openEditContactDialog(c)}
                                                className="rounded-xl bg-white px-3 py-1.5 text-xs font-black text-gray-600 ring-1 ring-gray-200"
                                            >
                                                編輯
                                            </button>
                                            <button
                                                onClick={() => deleteEntity('contacts', c.id)}
                                                className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-black text-red-500"
                                            >
                                                刪除
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 pt-2 border-t border-gray-50">
                                        {c.mobile && <a href={`tel:${c.mobile}`} className="text-sm font-bold flex items-center gap-2 text-gray-700">📱 <span className="font-mono">{formatMobile(c.mobile)}</span></a>}
                                        {c.phone && <a href={`tel:${c.phone}`} className="text-sm font-medium text-gray-500 flex items-center gap-2">📞 <span className="font-mono">{formatPhone(c.phone)}</span></a>}
                                        {c.fax && <div className="text-sm font-medium text-gray-400 flex items-center gap-2">📠 <span className="font-mono">{formatPhone(c.fax)}</span></div>}
                                        {c.email && <a href={`mailto:${c.email}`} className="text-sm font-medium text-gray-500 flex items-center gap-2 mt-1">✉️ <span className="truncate">{c.email}</span></a>}
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {!c.isPrimary ? (
                                            <button
                                                onClick={() => setPrimary('contacts', c.id)}
                                                className="rounded-xl bg-white px-3 py-2 text-xs font-black text-gray-600 ring-1 ring-gray-200"
                                            >
                                                設為主要聯絡人
                                            </button>
                                        ) : (
                                            <span className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-700">
                                                目前為主要聯絡人
                                            </span>
                                        )}
                                        {c.mobile ? (
                                            <a
                                                href={`tel:${c.mobile}`}
                                                className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
                                            >
                                                撥打電話
                                            </a>
                                        ) : null}
                                        {c.email ? (
                                            <a
                                                href={`mailto:${c.email}`}
                                                className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700"
                                            >
                                                寄送郵件
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Locations */}
                    <div className="bg-white p-4 md:p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-black text-efan-primary border-l-4 border-efan-accent pl-4">案場地址</h2>
                                <p className="mt-2 text-sm font-medium text-gray-500">同一頁直接維護案場資料，讓報價與施工紀錄都有明確對應地點。</p>
                            </div>
                            <button
                                onClick={openCreateLocationDialog}
                                className="rounded-2xl bg-efan-primary px-4 py-2.5 text-sm font-black text-white shadow-sm"
                            >
                                新增案場
                            </button>
                        </div>
                        <div className="space-y-4">
                            {customer.locations.map((l: any) => (
                                <div key={l.id} className="flex gap-4 p-4 md:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group relative">
                                    <div className="text-2xl">🏢</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-black text-gray-900">{l.name}</div>
                                            {l.isPrimary ? (
                                                <span className="bg-efan-accent/10 text-efan-accent text-[10px] font-black px-2 py-0.5 rounded leading-none pt-1">主要</span>
                                            ) : (
                                                <button
                                                    onClick={() => setPrimary('locations', l.id)}
                                                    className="opacity-0 group-hover:opacity-100 bg-gray-100 text-gray-400 text-[10px] font-black px-2 py-0.5 rounded leading-none pt-1 hover:bg-efan-primary hover:text-white transition-all"
                                                >
                                                    設為主要
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-sm font-medium text-gray-500 leading-relaxed">{l.address}</div>
                                    </div>
                                    <div className="flex flex-col gap-2 self-center opacity-100 transition-all md:opacity-0 md:group-hover:opacity-100">
                                        <button
                                            onClick={() => openEditLocationDialog(l)}
                                            className="rounded-xl bg-white px-3 py-2 text-xs font-black text-gray-600 ring-1 ring-gray-200"
                                        >
                                            編輯
                                        </button>
                                        <button
                                            onClick={() => deleteEntity('locations', l.id)}
                                            className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-500"
                                        >
                                            刪除
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Notes & Portal */}
                <div className="space-y-8">
                    <div className="bg-efan-primary p-4 md:p-8 rounded-[32px] shadow-xl text-white space-y-6">
                        <h2 className="text-xl font-black border-l-4 border-efan-accent pl-4">備註事項</h2>
                        <p className="text-white/80 font-medium whitespace-pre-wrap leading-relaxed italic">
                            {customer.notes || '尚無備註資訊。'}
                        </p>
                    </div>

                    <div className="rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm md:p-6">
                        <h2 className="border-l-4 border-efan-accent pl-4 text-xl font-black text-efan-primary">管理工具</h2>
                        <div className="mt-5 grid gap-3">
                            <MergeDialog targetId={customer.id} targetName={primaryName} onSuccess={fetchDetail} />
                            <button
                                onClick={() => setDeleteDialog(true)}
                                className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition-all hover:bg-red-100"
                            >
                                刪除客戶
                            </button>
                        </div>
                    </div>

                    <CustomerPortalSection customerId={customer.id} />
                </div>
            </div>

            {/* Full-width Quote List Table */}
            <div className="bg-white p-4 md:p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-black text-efan-primary border-l-4 border-efan-accent pl-4">📋 報價單列表</h2>
                    <span className="text-sm font-bold text-gray-400">共 {customer.quotes?.length ?? 0} 筆</span>
                </div>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="搜尋報價單號、名稱、公司、案場或施工備註..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-efan-primary shadow-inner pl-10"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                </div>

                {(() => {
                    const filteredQuotes = customer.quotes?.filter((q: any) => {
                        if (!searchTerm) return true;
                        const s = searchTerm.toLowerCase();
                        return (
                            q.quoteNumber?.toLowerCase().includes(s) ||
                            q.name?.toLowerCase().includes(s) ||
                            q.location?.name?.toLowerCase().includes(s) ||
                            q.companyName?.companyName?.toLowerCase().includes(s) ||
                            q.completion_note?.toLowerCase().includes(s)
                        );
                    });

                    if (!filteredQuotes || filteredQuotes.length === 0) {
                        return (
                            <div className="py-12 text-center text-gray-300 font-bold border-2 border-dashed border-gray-50 rounded-2xl">
                                {searchTerm ? '找不到符合的報價單' : '尚無報價紀錄'}
                            </div>
                        );
                    }

                    const highlightText = (text: string) => {
                        if (!searchTerm || !text) return text;
                        const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
                        return parts.map((part, i) =>
                            part.toLowerCase() === searchTerm.toLowerCase()
                                ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-px px-0.5">{part}</mark>
                                : part
                        );
                    };

                    const formatDate = (q: any) => {
                        if (q.completedAt) return `完工 ${new Date(q.completedAt).toLocaleDateString()}`;
                        if (q.sentAt) return `發送 ${new Date(q.sentAt).toLocaleDateString()}`;
                        return new Date(q.createdAt).toLocaleDateString();
                    };

                    return (
                        <>
                        <div className="grid gap-4 md:hidden">
                            {filteredQuotes.map((q: any) => (
                                <div key={q.id} className="rounded-3xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <Link href={withReturnTo(`/admin/quotes/${q.quoteNumber}`, returnTo)} className="font-mono text-sm font-black text-efan-primary">
                                                {highlightText(q.quoteNumber)}
                                            </Link>
                                            <div className="mt-1 text-sm font-bold text-gray-700 break-words">
                                                {highlightText(q.name || '未命名報價單')}
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                            <QuoteStatusBadge status={q.status} />
                                            <WarrantyBadge quote={q} />
                                        </div>
                                    </div>
                                    {q.companyName?.companyName && (
                                        <div className="text-sm font-medium text-gray-500 break-words">
                                            {highlightText(q.companyName.companyName)}
                                        </div>
                                    )}
                                    {q.location?.name && (
                                        <div className="text-sm font-medium text-gray-500 break-words">
                                            {highlightText(q.location.name)}
                                        </div>
                                    )}
                                    {q.completion_note && (
                                        <NotePreview className="text-xs text-indigo-600 font-medium bg-indigo-50 rounded-lg px-2.5 py-1.5">
                                            <span className="font-black text-indigo-400 mr-1">🔧</span>
                                            {highlightText(q.completion_note)}
                                        </NotePreview>
                                    )}
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">金額</span>
                                        <span className="font-black text-efan-primary text-sm">$ {Number(q.totalAmount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">日期</span>
                                        <span className="text-xs font-bold text-gray-500">{formatDate(q)}</span>
                                    </div>
                                    <Link href={withReturnTo(`/admin/quotes/${q.quoteNumber}`, returnTo)} className="block rounded-2xl bg-white border border-gray-200 px-4 py-2.5 text-center text-sm font-black text-gray-700">
                                        開啟報價
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        <th className="py-3 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">單號</th>
                                        <th className="py-3 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">報價名稱</th>
                                        <th className="py-3 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">公司</th>
                                        <th className="py-3 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">案場</th>
                                        <th className="py-3 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">狀態</th>
                                        <th className="py-3 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">金額</th>
                                        <th className="py-3 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">日期</th>
                                        <th className="py-3 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">保固</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredQuotes.map((q: any) => (
                                        <tr key={q.id} className="group hover:bg-efan-primary/[0.02] transition-colors">
                                            <td className="py-3 px-2">
                                                <Link href={withReturnTo(`/admin/quotes/${q.quoteNumber}`, returnTo)} className="font-mono text-sm font-bold text-efan-primary hover:underline whitespace-nowrap">
                                                    {highlightText(q.quoteNumber)}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="text-sm font-bold text-gray-700 truncate max-w-[200px]">
                                                    {highlightText(q.name || '(未命名)')}
                                                </div>
                                                {q.completion_note && (
                                                    <NotePreview className="mt-1 max-w-[400px] text-xs text-indigo-600 font-medium bg-indigo-50 rounded-lg px-2.5 py-1.5">
                                                        <span className="font-black text-indigo-400 mr-1">🔧</span>
                                                        {highlightText(q.completion_note)}
                                                    </NotePreview>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 hidden md:table-cell">
                                                <span className="text-xs font-medium text-gray-500 truncate max-w-[120px] block">
                                                    {q.companyName?.companyName || '—'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 hidden lg:table-cell">
                                                <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                                                    {q.location?.name ? highlightText(q.location.name) : '—'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2">
                                                <QuoteStatusBadge status={q.status} />
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <span className="font-black text-efan-primary text-sm whitespace-nowrap">
                                                    $ {Number(q.totalAmount).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 hidden sm:table-cell">
                                                <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap">
                                                    {formatDate(q)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 hidden lg:table-cell">
                                                <WarrantyBadge quote={q} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </>
                    );
                })()}
            </div>

            {/* Delete Confirmation Dialog */}
            {deleteDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-lg w-full animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black text-red-600 mb-3 flex items-center gap-2">
                            ⚠️ 確認刪除客戶
                        </h2>
                        <p className="text-gray-600 font-medium mb-2">
                            即將永久刪除客戶 <span className="font-black text-efan-primary">{primaryName}</span> 及所有相關資料（公司名稱、聯絡人、案場地址）。
                        </p>
                        {stats.quoteCount > 0 && (
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl mb-4">
                                <p className="text-orange-700 font-bold text-sm">
                                    📝 此客戶有 <span className="text-lg font-black">{stats.quoteCount}</span> 筆報價單，請選擇處理方式：
                                </p>
                            </div>
                        )}
                        <p className="text-xs text-gray-400 font-bold mb-6">此操作無法復原！</p>
                        <div className="space-y-3">
                            {stats.quoteCount > 0 && (
                                <button
                                    onClick={async () => {
                                        setDeleteDialog(false);
                                        const res = await fetch(`/api/customers/${id}?deleteQuotes=false`, { method: 'DELETE' });
                                        if (res.ok) {
                                            toast.success('客戶已刪除，報價單已保留為歷史快照');
                                            router.push('/admin/customers');
                                        } else {
                                            const err = await res.json();
                                            toast.error(err.error || '刪除失敗');
                                        }
                                    }}
                                    className="w-full px-6 py-4 rounded-2xl bg-efan-primary text-white font-bold hover:bg-efan-primary-dark shadow-lg shadow-efan-primary/20 transition-all"
                                >
                                    🗑️ 刪除客戶，但保留報價單（快照）
                                </button>
                            )}
                            <button
                                onClick={async () => {
                                    setDeleteDialog(false);
                                    const res = await fetch(`/api/customers/${id}?deleteQuotes=true`, { method: 'DELETE' });
                                    if (res.ok) {
                                        toast.success('客戶及所有報價單已刪除');
                                        router.push('/admin/customers');
                                    } else {
                                        const err = await res.json();
                                        toast.error(err.error || '刪除失敗');
                                    }
                                }}
                                className="w-full px-6 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all"
                            >
                                🗑️ 刪除客戶{stats.quoteCount > 0 ? '以及所有報價單' : ''}
                            </button>
                            <button
                                onClick={() => setDeleteDialog(false)}
                                className="w-full px-6 py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-all"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ContactEditorDialog
                open={contactDialogOpen}
                mode={contactDialogMode}
                draft={contactDraft}
                saving={contactSaving}
                onClose={() => {
                    if (contactSaving) return;
                    setContactDialogOpen(false);
                    setContactDraft(emptyContactDraft);
                }}
                onChange={updateContactDraft}
                onSubmit={saveContact}
            />

            <LocationEditorDialog
                open={locationDialogOpen}
                mode={locationDialogMode}
                draft={locationDraft}
                saving={locationSaving}
                onClose={() => {
                    if (locationSaving) return;
                    setLocationDialogOpen(false);
                    setLocationDraft(emptyLocationDraft);
                }}
                onChange={updateLocationDraft}
                onSubmit={saveLocation}
            />
        </div>
    );
}
