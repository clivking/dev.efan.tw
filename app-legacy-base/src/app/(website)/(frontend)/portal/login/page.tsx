'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CirclePlay, LifeBuoy, ShieldCheck } from 'lucide-react';

export default function PortalLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/portal/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (res.ok) {
                router.push('/portal');
            } else {
                setError(data.error || '登入失敗');
            }
        } catch {
            setError('網路錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full">
            <section className="relative overflow-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_44%,#edf4ff_100%)] px-4 py-14 md:py-18">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_24%)]" />
                <div className="relative mx-auto max-w-5xl">
                    <div className="mb-8 text-center">
                        <div className="inline-flex rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-black tracking-[0.2em] text-blue-700 shadow-sm">
                            CUSTOMER PORTAL
                        </div>
                        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">教學專區登入</h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                            一帆安全成交客戶專屬教學影片入口。登入後即可查看操作教學、使用說明與後續支援內容。
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
                                <CirclePlay className="h-4 w-4 text-blue-600" />
                                專屬教學影片
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
                                <ShieldCheck className="h-4 w-4 text-blue-600" />
                                客戶專屬入口
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
                                <LifeBuoy className="h-4 w-4 text-blue-600" />
                                操作與支援內容
                            </div>
                        </div>
                    </div>

                    <div className="mx-auto w-full max-w-md">
                        <div className="overflow-hidden rounded-[28px] border border-blue-200 bg-[#f3f7ff] shadow-[0_24px_60px_-28px_rgba(29,78,216,0.35)]">
                            <div className="bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_60%,#60a5fa_100%)] px-8 py-5 text-white">
                                <div className="text-xs font-black tracking-[0.18em] text-blue-100">LOGIN</div>
                                <h2 className="mt-2 text-2xl font-black">登入帳號</h2>
                                <p className="mt-2 text-sm leading-6 text-blue-100">請輸入您的教學專區帳號密碼</p>
                            </div>
                            <div className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">帳號</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="請輸入帳號"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">密碼</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="請輸入密碼"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                                            ❌ {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || !username || !password}
                                        className="w-full rounded-xl bg-efan-primary py-3 text-base font-bold text-white shadow-lg shadow-efan-primary/20 transition-all hover:bg-efan-primary/90 disabled:opacity-50"
                                    >
                                        {loading ? '登入中...' : '登入'}
                                    </button>
                                </form>

                                <div className="mt-6 text-center">
                                    <p className="text-xs text-gray-400">
                                        還沒有帳號？請聯繫一帆安全取得專屬註冊連結
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-6">
                            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                                ← 回到首頁
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white/25" />
            </section>
        </div>
    );
}
