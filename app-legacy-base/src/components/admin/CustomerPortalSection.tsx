'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatMobile } from '@/lib/phone-format';

interface ContactInfo {
    id: string;
    name: string;
    title?: string | null;
    email?: string | null;
    mobile?: string | null;
    isPrimary?: boolean;
}

interface PortalUserInfo {
    id: string;
    username: string;
    displayName: string;
    status: string;
    lastLoginAt: string | null;
    createdAt: string;
    contactId: string | null;
    contact: ContactInfo | null;
}

interface CustomerResponse {
    contacts: ContactInfo[];
    portalToken: string | null;
}

export default function CustomerPortalSection({ customerId }: { customerId: string }) {
    const [origin, setOrigin] = useState('');
    const [portalToken, setPortalToken] = useState<string | null>(null);
    const [contacts, setContacts] = useState<ContactInfo[]>([]);
    const [portalUsers, setPortalUsers] = useState<PortalUserInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [customerRes, usersRes] = await Promise.all([
                fetch(`/api/customers/${customerId}`),
                fetch(`/api/admin/customers/${customerId}/portal/users`),
            ]);

            if (customerRes.ok) {
                const customerData = await customerRes.json() as { customer: CustomerResponse };
                setPortalToken(customerData.customer.portalToken || null);
                setContacts(customerData.customer.contacts || []);
            }

            if (usersRes.ok) {
                setPortalUsers(await usersRes.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (typeof window !== 'undefined') setOrigin(window.location.origin);
    }, []);

    const portalUsersByContact = useMemo(() => {
        return new Map(portalUsers.filter((user) => user.contactId).map((user) => [user.contactId as string, user]));
    }, [portalUsers]);

    const generateToken = async () => {
        setGenerating(true);
        try {
            const res = await fetch(`/api/admin/customers/${customerId}/portal/token`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setPortalToken(data.token);
            }
        } finally {
            setGenerating(false);
        }
    };

    const disableToken = async () => {
        if (!confirm('停用這個註冊連結後，客戶將無法再用同一個連結申請客戶入口帳號。要繼續嗎？')) return;
        const res = await fetch(`/api/admin/customers/${customerId}/portal/token`, { method: 'DELETE' });
        if (res.ok) setPortalToken(null);
    };

    const copyLink = async () => {
        if (!portalToken) return;
        await navigator.clipboard.writeText(`${origin}/portal/register?token=${portalToken}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleUserStatus = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
        const res = await fetch(`/api/admin/customers/${customerId}/portal/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) await fetchData();
    };

    if (loading) return <div className="h-40 animate-pulse rounded-3xl bg-gray-100" />;

    return (
        <div className="rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 md:flex-row md:items-start md:justify-between">
                <div>
                    <h3 className="text-xl font-black text-efan-primary">客戶入口帳號</h3>
                    <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500">
                        連結是客戶層級共用，但真正建立帳號時會綁定到單一聯絡人。每位聯絡人最多只能有一個客戶入口帳號。
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {portalToken ? (
                        <>
                            <button
                                onClick={copyLink}
                                className="rounded-2xl bg-efan-primary px-4 py-2.5 text-sm font-black text-white"
                            >
                                {copied ? '已複製註冊連結' : '複製註冊連結'}
                            </button>
                            <button
                                onClick={generateToken}
                                disabled={generating}
                                className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm font-black text-gray-700"
                            >
                                重新產生連結
                            </button>
                            <button
                                onClick={disableToken}
                                className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-600"
                            >
                                停用連結
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={generateToken}
                            disabled={generating}
                            className="rounded-2xl bg-efan-primary px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
                        >
                            {generating ? '產生中...' : '產生註冊連結'}
                        </button>
                    )}
                </div>
            </div>

            {portalToken ? (
                <div className="mt-5 rounded-3xl bg-gray-50 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">註冊連結</div>
                    <div className="mt-2 break-all rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-xs text-gray-600">
                        {origin || 'https://www.efan.tw'}/portal/register?token={portalToken}
                    </div>
                </div>
            ) : null}

            <div className="mt-6 space-y-3">
                {contacts.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-gray-100 px-5 py-10 text-center text-sm font-bold text-gray-400">
                        這位客戶還沒有聯絡人，請先新增聯絡人後再建立客戶入口帳號。
                    </div>
                ) : (
                    contacts.map((contact) => {
                        const portalUser = portalUsersByContact.get(contact.id);
                        return (
                            <div key={contact.id} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-4 shadow-sm">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-base font-black text-gray-900">{contact.name}</div>
                                            {contact.isPrimary ? (
                                                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                                                    主要聯絡人
                                                </span>
                                            ) : null}
                                            {portalUser ? (
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${portalUser.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                                    {portalUser.status === 'active' ? '已啟用' : '已停用'}
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-gray-200 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                    尚未開通
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                            {contact.title ? <span>{contact.title}</span> : null}
                                            {contact.email ? <span>{contact.email}</span> : null}
                                            {contact.mobile ? <span>{formatMobile(contact.mobile)}</span> : null}
                                        </div>
                                        {portalUser ? (
                                            <div className="mt-3 text-xs text-gray-500">
                                                <span className="font-black text-gray-700">{portalUser.username}</span>
                                                {' · '}
                                                顯示名稱：{portalUser.displayName}
                                                {' · '}
                                                最近登入：{portalUser.lastLoginAt ? new Date(portalUser.lastLoginAt).toLocaleString('zh-TW') : '尚未登入'}
                                            </div>
                                        ) : (
                                            <div className="mt-3 text-xs text-gray-400">
                                                這位聯絡人目前還沒有客戶入口帳號，可用上方註冊連結完成申請。
                                            </div>
                                        )}
                                    </div>

                                    {portalUser ? (
                                        <button
                                            onClick={() => toggleUserStatus(portalUser.id, portalUser.status)}
                                            className={`rounded-2xl px-4 py-2.5 text-sm font-black ${portalUser.status === 'active' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}
                                        >
                                            {portalUser.status === 'active' ? '停用帳號' : '啟用帳號'}
                                        </button>
                                    ) : (
                                        <div className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-gray-500">
                                            等待申請
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
