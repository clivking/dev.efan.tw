'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { resolveCustomerQuoteDefaults } from '@/lib/customer-defaults';

interface Customer {
    id: string;
    customerNumber: string;
    primaryCompanyName: string;
    primaryContact: string;
}

interface CustomerDetail {
    id: string;
    companyNames: { id: string; companyName: string; isPrimary: boolean }[];
    contacts: { id: string; name: string; isPrimary: boolean }[];
    locations: { id: string; name: string; address: string; isPrimary: boolean }[];
}

interface Template {
    id: string;
    name: string;
    category: { name: string } | null;
    _count: { items: number };
}

export default function NewQuotePage() {
    const router = useRouter();
    const [customerSearch, setCustomerSearch] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
    const [companyNameId, setCompanyNameId] = useState('');
    const [contactId, setContactId] = useState('');
    const [locationId, setLocationId] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [taxRate, setTaxRate] = useState(5);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [creating, setCreating] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    useEffect(() => {
        if (!customerSearch || customerSearch.length < 1) {
            setCustomers([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}&pageSize=10`);
                const data = await res.json();
                setCustomers(data.customers || []);
                setShowCustomerDropdown(true);
            } catch (error) {
                console.error(error);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [customerSearch]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/templates');
                const data = await res.json();
                setTemplates(data.templates || []);
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);

    const selectCustomer = async (customerId: string) => {
        setShowCustomerDropdown(false);

        try {
            const res = await fetch(`/api/customers/${customerId}`);
            const data = await res.json();
            const customer = data.customer;

            setSelectedCustomer(customer);
            setCustomerSearch(
                customer.companyNames?.[0]?.companyName
                || customer.contacts?.[0]?.name
                || customer.customerNumber
            );

            const defaults = resolveCustomerQuoteDefaults(customer);
            setCompanyNameId(defaults.defaultCompanyNameId || '');
            setContactId(defaults.defaultContactId || '');
            setLocationId(defaults.defaultLocationId || '');
        } catch (error) {
            console.error(error);
            toast.error('讀取客戶資料失敗');
        }
    };

    const handleCreate = async () => {
        if (!selectedCustomer || !contactId) {
            toast.error('請先選擇客戶與聯絡人');
            return;
        }

        setCreating(true);

        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: selectedCustomer.id,
                    companyNameId: companyNameId || null,
                    contactIds: [contactId],
                    locationId: locationId || null,
                    templateId: templateId || null,
                    taxRate,
                }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                toast.error(error.error || '建立報價失敗');
                return;
            }

            const data = await res.json();
            toast.success(`報價單 ${data.quoteNumber} 已建立`);
            router.push(`/admin/quotes/${data.quoteNumber}`);
        } catch (error) {
            console.error(error);
            toast.error('建立報價時發生錯誤');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6 md:space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="mb-2 text-3xl font-black tracking-tight text-efan-primary">新增報價單</h1>
                <p className="text-gray-500 font-medium">
                    先選客戶、聯絡人與案場，建立後就能直接進入報價工作台。
                </p>
            </div>

            <div className="space-y-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm md:space-y-6 md:p-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                        客戶
                        <span className="text-red-400"> *</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="輸入公司名稱、聯絡人或客戶編號搜尋..."
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setSelectedCustomer(null);
                            }}
                            onFocus={() => customers.length > 0 && setShowCustomerDropdown(true)}
                            className="w-full rounded-2xl bg-gray-50 px-4 py-4 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-efan-primary md:px-5"
                        />

                        {showCustomerDropdown && customers.length > 0 && (
                            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-lg">
                                {customers.map((customer) => (
                                    <button
                                        key={customer.id}
                                        onClick={() => selectCustomer(customer.id)}
                                        className="w-full px-4 py-3 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-gray-50 md:px-5"
                                    >
                                        <div className="font-bold text-gray-700">
                                            {customer.primaryCompanyName || customer.primaryContact}
                                        </div>
                                        <div className="text-xs text-gray-400">{customer.customerNumber}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {selectedCustomer && (
                    <>
                        {selectedCustomer.companyNames.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">報價公司名稱</label>
                                <select
                                    value={companyNameId}
                                    onChange={(e) => setCompanyNameId(e.target.value)}
                                    className="w-full rounded-2xl bg-gray-50 px-4 py-4 font-bold text-gray-700 focus:ring-2 focus:ring-efan-primary md:px-5"
                                >
                                    <option value="">沿用主要公司名稱</option>
                                    {selectedCustomer.companyNames.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.companyName}
                                            {item.isPrimary ? '（主要）' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">
                                聯絡人
                                <span className="text-red-400"> *</span>
                            </label>
                            <select
                                value={contactId}
                                onChange={(e) => setContactId(e.target.value)}
                                className="w-full rounded-2xl bg-gray-50 px-4 py-4 font-bold text-gray-700 focus:ring-2 focus:ring-efan-primary md:px-5"
                            >
                                {selectedCustomer.contacts.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                        {item.isPrimary ? '（主要）' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedCustomer.locations.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">案場</label>
                                <select
                                    value={locationId}
                                    onChange={(e) => setLocationId(e.target.value)}
                                    className="w-full rounded-2xl bg-gray-50 px-4 py-4 font-bold text-gray-700 focus:ring-2 focus:ring-efan-primary md:px-5"
                                >
                                    <option value="">不指定案場</option>
                                    {selectedCustomer.locations.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} | {item.address}
                                            {item.isPrimary ? '（主要）' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">報價模板</label>
                    <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full rounded-2xl bg-gray-50 px-4 py-4 font-bold text-gray-700 focus:ring-2 focus:ring-efan-primary md:px-5"
                    >
                        <option value="">先建立空白報價</option>
                        {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.name}（{template._count.items} 項）
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">稅率</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                            onClick={() => setTaxRate(5)}
                            className={`rounded-2xl py-4 font-bold transition-all ${taxRate === 5 ? 'bg-efan-primary text-white shadow-lg shadow-efan-primary/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            5% 含稅報價
                        </button>
                        <button
                            onClick={() => setTaxRate(0)}
                            className={`rounded-2xl py-4 font-bold transition-all ${taxRate === 0 ? 'bg-efan-primary text-white shadow-lg shadow-efan-primary/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            0% 未稅報價
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleCreate}
                    disabled={creating || !selectedCustomer || !contactId}
                    className="sticky bottom-4 w-full rounded-2xl bg-efan-primary py-4 text-lg font-bold text-white shadow-lg shadow-efan-primary/20 transition-all hover:bg-efan-primary-dark disabled:opacity-50"
                >
                    {creating ? '建立中...' : '建立報價單'}
                </button>
            </div>
        </div>
    );
}
