'use client';

import { useState, useEffect } from 'react';

const DEFAULT_LOCATION_NAME = '地址';

interface Customer {
    id: string;
    customerNumber: string;
    primaryCompanyName: string;
    primaryContact: string;
}

interface CustomerPickerProps {
    onSelect: (customer: any) => void;
    onClose: () => void;
    initialMode?: 'search' | 'create';
}

export default function CustomerPicker({ onSelect, onClose, initialMode = 'search' }: CustomerPickerProps) {
    const [mode, setMode] = useState<'search' | 'create'>(initialMode);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);

    // Form states for quick add
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        phone: '',
        mobile: '',
        email: '',
        address: '',
        hasLine: false
    });
    const [isCreating, setIsCreating] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const handleSearch = async (query: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) {
                params.set('search', query);
            } else {
                params.set('pageSize', '10');
                params.set('sortField', 'updatedAt');
                params.set('sortOrder', 'desc');
            }
            const res = await fetch(`/api/customers?${params.toString()}`);
            const data = await res.json();
            setResults(data.customers || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate: at least one of phone or mobile
        const mobileVal = formData.mobile.trim();
        const phoneVal = formData.phone.trim();
        if (!mobileVal && !phoneVal) {
            setPhoneError('手機與電話至少需填寫一項');
            return;
        }
        setPhoneError('');

        setIsCreating(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyNames: formData.companyName.trim()
                        ? [{ companyName: formData.companyName.trim(), isPrimary: true }]
                        : [],
                    contacts: [{ 
                        name: formData.contactName.trim(),
                        mobile: mobileVal || null,
                        phone: phoneVal || null,
                        email: formData.email.trim() || null,
                        hasLine: formData.hasLine,
                        isPrimary: true 
                    }],
                    locations: formData.address.trim()
                        ? [{ name: DEFAULT_LOCATION_NAME, address: formData.address.trim(), isPrimary: true }]
                        : [],
                    skipDuplicateCheck: true
                })
            });

            if (res.ok) {
                const newCustomer = await res.json();
                onSelect({
                    id: newCustomer.id,
                    customerNumber: newCustomer.customerNumber,
                    primaryCompanyName: newCustomer.companyNames[0]?.companyName,
                    primaryContact: newCustomer.contacts[0]?.name
                });
            } else {
                const err = await res.json();
                alert(err.message || '建立失敗');
            }
        } catch (e) {
            console.error(e);
            alert('系統發生錯誤');
        } finally {
            setIsCreating(false);
        }
    };

    // Clear phone error when user types
    useEffect(() => {
        if (formData.mobile.trim() || formData.phone.trim()) {
            setPhoneError('');
        }
    }, [formData.mobile, formData.phone]);

    useEffect(() => {
        if (mode === 'search') {
            const timer = setTimeout(() => {
                handleSearch(search);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [search, mode]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-2xl w-full border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-2xl font-black text-efan-primary">
                            {mode === 'search' ? '選擇報價客戶' : '快速建立新客戶'}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1 font-bold">
                            {mode === 'search' ? '搜尋現有客戶進行報價' : '填寫基本資訊後自動帶入報價單'}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">✕</button>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-gray-100/80 rounded-2xl mb-5">
                    <button
                        onClick={() => setMode('search')}
                        className={`flex-1 py-3 text-sm font-black rounded-[14px] transition-all ${mode === 'search' ? 'bg-white text-efan-primary shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        🔍 搜尋現有客戶
                    </button>
                    <button
                        onClick={() => setMode('create')}
                        className={`flex-1 py-3 text-sm font-black rounded-[14px] transition-all ${mode === 'create' ? 'bg-white text-efan-primary shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        ➕ 快速新增
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {mode === 'search' ? (
                        <>
                            <div className="relative mb-4">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="搜尋客戶編號、公司名稱、聯絡人..."
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-efan-primary font-bold text-gray-700 transition-all shadow-inner"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {loading && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin h-5 w-5 border-b-2 border-efan-primary rounded-full"></div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 pb-4">
                                {!search && results.length > 0 && (
                                    <div className="text-xs font-black text-gray-400 mb-2 uppercase tracking-widest px-1">最近建立的客戶</div>
                                )}

                                {results.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => onSelect(c)}
                                        className="w-full p-4 rounded-2xl bg-gray-50 hover:bg-efan-primary/5 border border-gray-100 hover:border-efan-primary/20 text-left transition-all group flex items-center justify-between"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-lg font-black text-gray-800 group-hover:text-efan-primary transition-colors">
                                                {c.primaryCompanyName || '個人客戶'}
                                            </div>
                                            <div className="text-sm font-bold text-gray-400 font-mono">
                                                {c.customerNumber} · {c.primaryContact}
                                            </div>
                                        </div>
                                        <div className="text-efan-primary opacity-0 group-hover:opacity-100 transition-all font-black">
                                            選擇 →
                                        </div>
                                    </button>
                                ))}

                                {results.length === 0 && search && !loading && (
                                    <div className="py-12 text-center space-y-4">
                                        <div className="text-4xl text-gray-200">🔍</div>
                                        <p className="text-gray-400 font-bold text-lg">找不到相關客戶</p>
                                        <button
                                            onClick={() => setMode('create')}
                                            className="px-6 py-3 bg-efan-primary text-white rounded-xl font-bold hover:bg-efan-primary/90 transition-all shadow-lg shadow-efan-primary/20"
                                        >
                                            立即建立新客戶
                                        </button>
                                    </div>
                                )}

                                {results.length === 0 && !search && !loading && (
                                    <div className="py-12 text-center text-gray-300 font-bold">
                                        尚未建立任何客戶
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleCreate} className="space-y-3.5 pb-4">
                            {/* Row 1: 姓名 + Email */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        聯絡人姓名 <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        required
                                        autoFocus
                                        type="text"
                                        placeholder="對象姓名"
                                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-efan-primary font-bold text-gray-700 transition-all"
                                        value={formData.contactName}
                                        onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">📧 Email</label>
                                    <input
                                        type="email"
                                        placeholder="example@mail.com"
                                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-efan-primary font-bold text-gray-700 transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Row 2: 手機 + 電話 */}
                            <div className="space-y-1">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                            📱 手機 <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="0911-333-555"
                                            className={`w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-efan-primary font-bold text-gray-700 transition-all ${phoneError && !formData.mobile.trim() && !formData.phone.trim() ? 'ring-2 ring-red-300' : ''}`}
                                            value={formData.mobile}
                                            onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                            ☎️ 電話 <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="02-2345-6789"
                                            className={`w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-efan-primary font-bold text-gray-700 transition-all ${phoneError && !formData.mobile.trim() && !formData.phone.trim() ? 'ring-2 ring-red-300' : ''}`}
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {phoneError && (
                                    <p className="text-red-500 text-xs font-bold ml-1 mt-1">{phoneError}</p>
                                )}
                                {!phoneError && (
                                    <p className="text-gray-300 text-[10px] font-bold ml-1 mt-0.5">手機與電話至少填寫一項</p>
                                )}
                            </div>

                            {/* Row 3: 公司名稱 (full width) */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">公司名稱 / 抬頭</label>
                                <input
                                    type="text"
                                    placeholder="選填，可留空"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-efan-primary font-bold text-gray-700 transition-all"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>

                            {/* Row 4: 地址 (full width) */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">案場地址</label>
                                <input
                                    type="text"
                                    placeholder="選填，安裝地址或通訊地址"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-efan-primary font-bold text-gray-700 transition-all"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {/* 已加 Line */}
                            <label className="flex items-center gap-2.5 ml-1 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded-lg border-gray-300 text-[#06C755] focus:ring-[#06C755] transition-all cursor-pointer"
                                    checked={formData.hasLine}
                                    onChange={e => setFormData({ ...formData, hasLine: e.target.checked })}
                                />
                                <span className="text-sm font-bold text-gray-600">已加 Line</span>
                            </label>

                            <div className="pt-3">
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl ${isCreating ? 'bg-gray-100 text-gray-400' : 'bg-efan-primary text-white hover:bg-efan-primary/90 shadow-efan-primary/20 hover:scale-[1.01] active:scale-[0.98]'}`}
                                >
                                    {isCreating ? '建立中...' : '確認建立並加入報價'}
                                </button>
                                <p className="text-center text-[10px] text-gray-400 font-bold mt-3 uppercase tracking-tighter">
                                    建立後將自動跳回報價單，您可以稍後再到客戶管理補充詳細資料
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
