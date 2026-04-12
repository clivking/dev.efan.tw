'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cleanPhone, formatMobile, formatPhone, validateTaxId } from '@/lib/phone-format';

interface Props {
    initialData?: any;
}

const DEFAULT_LOCATION_NAME = '地址';

function createLocationRow(isPrimary: boolean) {
    return { name: DEFAULT_LOCATION_NAME, address: '', isPrimary };
}

export default function CustomerForm({ initialData }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [companyNames, setCompanyNames] = useState(
        (initialData?.companyNames || [{ companyName: '', taxId: '', isPrimary: true }]).map((c: any) => ({
            ...c,
            companyName: c.companyName || '',
            taxId: c.taxId || '',
        }))
    );
    const [contacts, setContacts] = useState(
        (initialData?.contacts || [{ name: '', mobile: '', phone: '', email: '', isPrimary: true }]).map((c: any) => ({
            ...c,
            name: c.name || '',
            title: c.title || '',
            email: c.email || '',
            mobile: c.mobile || '',
            phone: c.phone || '',
            fax: c.fax || '',
        }))
    );
    const [locations, setLocations] = useState(
        (initialData?.locations || [createLocationRow(true)]).map((l: any) => ({
            ...l,
            name: l.name || DEFAULT_LOCATION_NAME,
            address: l.address || '',
        }))
    );
    const [duplicates, setDuplicates] = useState<any[]>([]);

    const handleSubmit = async (e: React.FormEvent, skipCheck = false) => {
        e.preventDefault();
        setLoading(true);

        try {
            const filteredCompanyNames = companyNames.filter((c: any) => c.companyName.trim() !== '' || c.taxId.trim() !== '');
            const filteredContacts = contacts.filter((c: any) => c.name.trim() !== '' || c.mobile.trim() !== '' || c.phone.trim() !== '');
            const filteredLocations = locations
                .filter((l: any) => l.address.trim() !== '')
                .map((l: any) => ({
                    ...l,
                    name: l.name.trim() || DEFAULT_LOCATION_NAME,
                }));

            const res = await fetch(initialData ? `/api/customers/${initialData.id}` : '/api/customers', {
                method: initialData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notes,
                    companyNames: filteredCompanyNames,
                    contacts: filteredContacts,
                    locations: filteredLocations,
                    skipDuplicateCheck: skipCheck,
                }),
            });

            if (res.status === 409) {
                const data = await res.json();
                setDuplicates(data.duplicates);
                setLoading(false);
                return;
            }

            if (res.ok) {
                router.push('/admin/customers');
            } else {
                const err = await res.json();
                alert(err.error || '儲存失敗');
            }
        } catch (error) {
            console.error(error);
            alert('發生錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const addRow = (setter: any, defaultValue: any) => {
        setter((prev: any) => [...prev, defaultValue]);
    };

    const updateRow = (setter: any, index: number, field: string, value: any) => {
        setter((prev: any) => prev.map((item: any, i: number) => (i === index ? { ...item, [field]: value } : item)));
    };

    const removeRow = (setter: any, index: number) => {
        setter((prev: any) => prev.filter((_: any, i: number) => i !== index));
    };

    const setPrimary = (setter: any, index: number) => {
        setter((prev: any) =>
            prev.map((item: any, i: number) => ({
                ...item,
                isPrimary: i === index,
            }))
        );
    };

    return (
        <div className="max-w-5xl animate-in slide-in-from-bottom-4 space-y-6 duration-500 md:space-y-8">
            {duplicates.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[32px] bg-white p-5 shadow-2xl md:p-8">
                        <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-red-600">發現可能重複的客戶</h2>
                        <p className="mb-6 font-medium text-gray-600">目前資料與既有客戶可能重複，先檢查一下，避免建立重複客戶。</p>
                        <div className="mb-8 space-y-4">
                            {duplicates.map((d) => (
                                <div key={d.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                    <div>
                                        <div className="font-bold text-efan-primary">{d.primaryCompanyName || '未命名客戶'}</div>
                                        <div className="font-mono text-xs text-gray-500">
                                            {d.customerNumber} - {d.primaryContact}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/admin/customers/${d.id}`)}
                                        className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-200"
                                    >
                                        查看客戶
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setDuplicates([])}
                                className="rounded-2xl bg-gray-100 px-6 py-4 font-bold text-gray-700 hover:bg-gray-200"
                            >
                                返回修改
                            </button>
                            <button
                                onClick={(e) => handleSubmit(e, true)}
                                className="rounded-2xl bg-efan-primary px-6 py-4 font-bold text-white shadow-lg shadow-efan-primary/20 hover:bg-efan-primary-dark"
                            >
                                仍然建立
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <section className="space-y-6 rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm md:p-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="border-l-4 border-efan-accent pl-4 text-xl font-black text-efan-primary">公司名稱</h2>
                            <p className="mt-2 text-sm font-medium text-gray-500">桌機版改成同一列輸入公司名稱與統一編號，減少表單高度。</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => addRow(setCompanyNames, { companyName: '', taxId: '', isPrimary: false })}
                            className="rounded-2xl bg-efan-primary px-4 py-2.5 text-sm font-black text-white shadow-sm"
                        >
                            新增公司
                        </button>
                    </div>

                    <div className="space-y-4">
                        {companyNames.map((c: any, i: number) => (
                            <div key={i} className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 md:p-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                                    <div className="min-w-0">
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-gray-400">公司名稱</label>
                                        <input
                                            type="text"
                                            className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-2 font-bold focus:border-efan-primary focus:ring-0"
                                            value={c.companyName || ''}
                                            onChange={(e) => updateRow(setCompanyNames, i, 'companyName', e.target.value)}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-gray-400">統一編號</label>
                                        <input
                                            type="text"
                                            maxLength={8}
                                            placeholder="8 碼"
                                            className={`w-full border-b-2 bg-transparent px-0 py-2 font-mono font-bold focus:ring-0 ${c.taxId && !validateTaxId(c.taxId) ? 'border-red-500' : 'border-gray-200 focus:border-efan-primary'}`}
                                            value={c.taxId || ''}
                                            onChange={(e) => updateRow(setCompanyNames, i, 'taxId', cleanPhone(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPrimary(setCompanyNames, i)}
                                        className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${c.isPrimary ? 'bg-efan-accent text-white shadow-md' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        {c.isPrimary ? '主要公司' : '設為主要'}
                                    </button>
                                    {companyNames.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRow(setCompanyNames, i)}
                                            className="p-2 text-gray-300 hover:text-red-500"
                                        >
                                            刪除
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6 rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm md:p-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="border-l-4 border-efan-accent pl-4 text-xl font-black text-efan-primary">聯絡人</h2>
                            <p className="mt-2 text-sm font-medium text-gray-500">保留原本的多聯絡人結構，讓報價與後續聯繫都能沿用。</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => addRow(setContacts, { name: '', mobile: '', phone: '', email: '', isPrimary: false })}
                            className="rounded-2xl bg-efan-primary px-4 py-2.5 text-sm font-black text-white shadow-sm"
                        >
                            新增聯絡人
                        </button>
                    </div>

                    <div className="space-y-4">
                        {contacts.map((c: any, i: number) => (
                            <div key={i} className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 md:p-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-gray-400">姓名</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-2 font-bold focus:border-efan-primary focus:ring-0"
                                            value={c.name || ''}
                                            onChange={(e) => updateRow(setContacts, i, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-gray-400">職稱</label>
                                        <input
                                            type="text"
                                            className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-2 font-bold focus:border-efan-primary focus:ring-0"
                                            value={c.title || ''}
                                            onChange={(e) => updateRow(setContacts, i, 'title', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-gray-400">手機</label>
                                        <input
                                            type="text"
                                            className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-2 font-mono font-bold focus:border-efan-primary focus:ring-0"
                                            value={formatMobile(c.mobile)}
                                            onChange={(e) => updateRow(setContacts, i, 'mobile', cleanPhone(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-gray-400">電話</label>
                                        <input
                                            type="text"
                                            className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-2 font-mono font-bold focus:border-efan-primary focus:ring-0"
                                            value={formatPhone(c.phone)}
                                            onChange={(e) => updateRow(setContacts, i, 'phone', cleanPhone(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-gray-400">傳真</label>
                                        <input
                                            type="text"
                                            className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-2 font-mono font-bold focus:border-efan-primary focus:ring-0"
                                            value={formatPhone(c.fax)}
                                            onChange={(e) => updateRow(setContacts, i, 'fax', cleanPhone(e.target.value))}
                                        />
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-gray-400">Email</label>
                                        <input
                                            type="email"
                                            className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-2 text-sm font-medium focus:border-efan-primary focus:ring-0"
                                            value={c.email || ''}
                                            onChange={(e) => updateRow(setContacts, i, 'email', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <label className="group flex cursor-pointer items-center gap-2">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={!!c.hasLine}
                                                    onChange={(e) => updateRow(setContacts, i, 'hasLine', e.target.checked)}
                                                />
                                                <div className="h-5 w-10 rounded-full bg-gray-200 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:content-[''] after:transition-all peer-checked:bg-green-500 peer-checked:after:translate-x-5" />
                                            </div>
                                            <span className="text-xs font-black text-gray-500 transition-colors group-hover:text-green-600">有 LINE</span>
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => setPrimary(setContacts, i)}
                                            className={`rounded-lg px-4 py-1.5 text-[10px] font-black transition-all ${c.isPrimary ? 'bg-efan-accent text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            {c.isPrimary ? '主要聯絡人' : '設為主要'}
                                        </button>
                                    </div>

                                    {contacts.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRow(setContacts, i)}
                                            className="flex items-center gap-1 text-sm font-bold text-gray-300 hover:text-red-500"
                                        >
                                            刪除此聯絡人
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6 rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm md:p-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="border-l-4 border-efan-accent pl-4 text-xl font-black text-efan-primary">案場地址</h2>
                            <p className="mt-2 text-sm font-medium text-gray-500">第一筆案場名稱預設為「［地址］」，只要填地址就能直接建立。</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => addRow(setLocations, createLocationRow(false))}
                            className="rounded-2xl bg-efan-primary px-4 py-2.5 text-sm font-black text-white shadow-sm"
                        >
                            新增案場
                        </button>
                    </div>

                    <div className="space-y-4">
                        {locations.map((l: any, i: number) => (
                            <div key={i} className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 md:p-6">
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <div className="sm:w-1/3">
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-gray-400">案場名稱</label>
                                        <input
                                            type="text"
                                            placeholder={i === 0 ? DEFAULT_LOCATION_NAME : '例如：總店、住家、工地'}
                                            className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-2 font-bold focus:border-efan-primary focus:ring-0"
                                            value={l.name || ''}
                                            onChange={(e) => updateRow(setLocations, i, 'name', e.target.value)}
                                        />
                                        {i === 0 && <p className="mt-1 text-xs font-medium text-gray-400">第一筆可直接保留預設名稱。</p>}
                                    </div>

                                    <div className="flex-1">
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-gray-400">案場地址</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="請輸入完整案場地址"
                                            className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-2 font-medium focus:border-efan-primary focus:ring-0"
                                            value={l.address || ''}
                                            onChange={(e) => updateRow(setLocations, i, 'address', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPrimary(setLocations, i)}
                                        className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${l.isPrimary ? 'bg-efan-accent text-white shadow-md' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        {l.isPrimary ? '主要案場' : '設為主要'}
                                    </button>
                                    {locations.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRow(setLocations, i)}
                                            className="p-2 text-gray-300 hover:text-red-500"
                                        >
                                            刪除
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6 rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm md:p-8">
                    <div>
                        <h2 className="border-l-4 border-efan-accent pl-4 text-xl font-black text-efan-primary">備註</h2>
                        <p className="mt-2 text-sm font-medium text-gray-500">保留給你和你老婆自己看的內部註記，不增加額外管理欄位。</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold uppercase tracking-widest text-gray-400">客戶備註</label>
                        <textarea
                            className="min-h-[100px] w-full rounded-2xl border-none bg-gray-50 px-6 py-4 font-medium focus:ring-2 focus:ring-efan-primary"
                            placeholder="可記錄客戶偏好、注意事項或內部備忘..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </section>

                <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 border-t border-gray-100 bg-white/95 pt-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:bg-transparent sm:backdrop-blur-0">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-2xl border border-gray-200 bg-white px-8 py-4 font-bold text-gray-400 transition-all hover:bg-gray-50"
                    >
                        返回
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-2xl bg-efan-primary px-12 py-4 font-black text-white shadow-xl shadow-efan-primary/20 transition-all hover:bg-efan-primary-dark disabled:opacity-50"
                    >
                        {loading ? '儲存中...' : initialData ? '儲存客戶' : '建立客戶'}
                    </button>
                </div>
            </form>
        </div>
    );
}
