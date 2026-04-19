'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BreadcrumbTrail from '@/components/common/BreadcrumbTrail';
import JsonLdScript from '@/components/common/JsonLdScript';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/structured-data';
import { formatMobile } from '@/lib/phone-format';

interface ContactOption {
    id: string;
    name: string;
    title?: string | null;
    email?: string | null;
    mobile?: string | null;
    isPrimary?: boolean;
    portalUser: null | {
        id: string;
        username: string;
        displayName: string;
        status: string;
        lastLoginAt: string | null;
    };
}

function PortalRegisterContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    const [companyName, setCompanyName] = useState('');
    const [contacts, setContacts] = useState<ContactOption[]>([]);
    const [contactId, setContactId] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [tokenError, setTokenError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);

    const breadcrumbs = withHomeBreadcrumb({ label: '教學專區', href: '/portal' }, '註冊');
    const breadcrumbSchema = buildBreadcrumbSchema(
        toBreadcrumbSchemaItems(
            breadcrumbs,
            typeof window !== 'undefined' ? window.location.origin : '',
            '/portal/register',
        ),
    );

    useEffect(() => {
        if (!token) {
            setTokenError('缺少註冊 token，請使用一帆提供的有效邀請連結。');
            setValidating(false);
            return;
        }

        fetch(`/api/portal/auth/register?token=${token}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setTokenError(data.error);
                    return;
                }

                setCompanyName(data.companyName || '');
                setContacts(data.contacts || []);

                const defaultContact = (data.contacts || []).find((contact: ContactOption) => !contact.portalUser) || (data.contacts || [])[0];
                if (defaultContact) {
                    setContactId(defaultContact.id);
                    setDisplayName(defaultContact.name);
                }
            })
            .catch(() => setTokenError('驗證註冊連結時發生錯誤。'))
            .finally(() => setValidating(false));
    }, [token]);

    const selectedContact = useMemo(() => contacts.find((contact) => contact.id === contactId) || null, [contacts, contactId]);

    useEffect(() => {
        if (selectedContact && !displayName) {
            setDisplayName(selectedContact.name);
        }
    }, [selectedContact, displayName]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/portal/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, contactId, username, password, confirmPassword, displayName }),
            });
            const data = await res.json();

            if (res.ok) {
                router.push('/portal');
            } else {
                setError(data.error || '註冊失敗');
            }
        } catch {
            setError('系統忙碌中，請稍後再試。');
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="min-h-[60vh] px-4 py-16">
                <JsonLdScript data={breadcrumbSchema} />
                <div className="mx-auto max-w-6xl">
                    <BreadcrumbTrail items={breadcrumbs} tone="light" className="mb-8" />
                    <div className="flex items-center justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-efan-primary" />
                    </div>
                </div>
            </div>
        );
    }

    if (tokenError) {
        return (
            <div className="min-h-[60vh] px-4 py-16">
                <JsonLdScript data={breadcrumbSchema} />
                <div className="mx-auto max-w-6xl">
                    <BreadcrumbTrail items={breadcrumbs} tone="light" className="mb-8" />
                <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl">
                    <div className="text-5xl">!</div>
                    <h1 className="mt-4 text-xl font-black text-gray-800">註冊連結無效</h1>
                    <p className="mt-3 text-sm text-gray-500">{tokenError}</p>
                    <Link href="/" className="mt-6 inline-flex text-sm font-black text-efan-primary hover:underline">
                        返回網站首頁
                    </Link>
                </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col">
            <JsonLdScript data={breadcrumbSchema} />
            <section className="bg-efan-primary py-20 text-white md:py-28">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <BreadcrumbTrail items={breadcrumbs} tone="dark" className="mb-6" />
                        <div className="text-xs font-black uppercase tracking-[0.28em] text-white/60">客戶入口註冊</div>
                        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">客戶入口帳號申請</h1>
                        <p className="mt-5 text-lg font-medium leading-relaxed text-white/75 md:text-xl">
                            先選擇要綁定的聯絡人，再建立這位聯絡人的客戶入口帳號。每位聯絡人最多只能有一個客戶入口帳號。
                        </p>
                    </div>
                </div>
            </section>

            <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.1fr,0.9fr]">
                <section className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-2 border-b border-gray-100 pb-6">
                        <div className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">客戶資訊</div>
                        <h2 className="text-2xl font-black text-efan-primary">{companyName || '客戶入口'}</h2>
                        <p className="text-sm font-medium text-gray-500">
                            請確認你要綁定哪位聯絡人。若這位聯絡人已經有帳號，請改用既有帳號登入。
                        </p>
                    </div>

                    <div className="mt-6 space-y-3">
                        {contacts.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-gray-100 px-5 py-12 text-center text-sm font-bold text-gray-400">
                                目前沒有可申請的聯絡人，請先聯繫一帆協助建立聯絡人資料。
                            </div>
                        ) : (
                            contacts.map((contact) => {
                                const isSelected = contact.id === contactId;
                                const unavailable = Boolean(contact.portalUser);
                                return (
                                    <button
                                        key={contact.id}
                                        type="button"
                                        onClick={() => {
                                            if (unavailable) return;
                                            setContactId(contact.id);
                                            setDisplayName(contact.name);
                                        }}
                                        disabled={unavailable}
                                        className={`w-full rounded-3xl border p-4 text-left transition-all ${isSelected ? 'border-efan-primary bg-efan-primary/5 shadow-md shadow-efan-primary/10' : 'border-gray-100 bg-gray-50/70'} ${unavailable ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-200 hover:bg-white'}`}
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-base font-black text-gray-900">{contact.name}</div>
                                            {contact.isPrimary ? (
                                                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                                                    主要聯絡人
                                                </span>
                                            ) : null}
                                            {contact.portalUser ? (
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${contact.portalUser.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                                    {contact.portalUser.status === 'active' ? '已註冊' : '已停用'}
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-sky-700">
                                                    可申請
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                            {contact.title ? <span>{contact.title}</span> : null}
                                            {contact.email ? <span>{contact.email}</span> : null}
                                            {contact.mobile ? <span>{formatMobile(contact.mobile)}</span> : null}
                                        </div>
                                        {contact.portalUser ? (
                                            <div className="mt-3 text-xs text-gray-500">
                                                已有帳號：<span className="font-black text-gray-700">{contact.portalUser.username}</span>
                                            </div>
                                        ) : null}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="border-b border-gray-100 pb-6">
                        <div className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">建立帳號</div>
                        <h2 className="mt-3 text-2xl font-black text-gray-900">建立登入帳號</h2>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                            {selectedContact ? `目前綁定聯絡人：${selectedContact.name}` : '請先從左側選一位聯絡人。'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-black text-gray-700">綁定聯絡人</label>
                            <select
                                value={contactId}
                                onChange={(e) => {
                                    setContactId(e.target.value);
                                    const nextContact = contacts.find((contact) => contact.id === e.target.value);
                                    if (nextContact && !nextContact.portalUser) setDisplayName(nextContact.name);
                                }}
                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold"
                                required
                            >
                                <option value="">請選擇聯絡人</option>
                                {contacts.map((contact) => (
                                    <option key={contact.id} value={contact.id} disabled={Boolean(contact.portalUser)}>
                                        {contact.name}{contact.portalUser ? '（已註冊）' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-black text-gray-700">顯示名稱 *</label>
                            <input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                                placeholder="例如：王小明"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-black text-gray-700">登入帳號 *</label>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                                placeholder="4 到 20 碼英數字或底線"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-black text-gray-700">密碼 *</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                                placeholder="至少 6 碼"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-black text-gray-700">確認密碼 *</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                                placeholder="請再次輸入密碼"
                                required
                            />
                        </div>

                        {error ? (
                            <div className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading || !contactId || !username || !password || !displayName}
                            className="w-full rounded-2xl bg-efan-primary py-3 text-sm font-black text-white shadow-lg shadow-efan-primary/20 transition-all disabled:opacity-50"
                        >
                            {loading ? '建立中...' : '建立客戶入口帳號'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/portal/login" className="text-sm font-black text-gray-400 transition-colors hover:text-gray-700">
                            已經有帳號？前往登入
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default function PortalRegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-efan-primary" /></div>}>
            <PortalRegisterContent />
        </Suspense>
    );
}
