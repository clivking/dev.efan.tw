'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BreadcrumbTrail from '@/components/common/BreadcrumbTrail';
import JsonLdScript from '@/components/common/JsonLdScript';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/structured-data';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Load saved username on mount
    useEffect(() => {
        const saved = localStorage.getItem('efan_saved_username');
        if (saved) {
            setUsername(saved);
            setRememberMe(true);
        }
    }, []);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error === 'Invalid credentials' ? '帳號或密碼錯誤' : (data.error || '登入失敗'));
                setLoading(false);
                return;
            }

            // Save or clear username
            if (rememberMe) {
                localStorage.setItem('efan_saved_username', username);
            } else {
                localStorage.removeItem('efan_saved_username');
            }

            router.push('/admin/dashboard');
        } catch (err) {
            setError('連線失敗，請稍後再試');
            setLoading(false);
        }
    }

    const breadcrumbs = withHomeBreadcrumb('系統登入');
    const breadcrumbSchema = buildBreadcrumbSchema(
        toBreadcrumbSchemaItems(
            breadcrumbs,
            typeof window !== 'undefined' ? window.location.origin : '',
            '/login',
        ),
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center p-4">
            <JsonLdScript data={breadcrumbSchema} />
            <div className="w-full max-w-sm">
                <div className="mb-6">
                    <BreadcrumbTrail items={breadcrumbs} tone="light" />
                </div>
            <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 pb-6">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg flex items-center justify-center text-white text-2xl font-bold">
                            一帆
                        </div>
                    </div>
                    <h1 className="text-2xl font-semibold text-center text-slate-800 mb-2">
                        一帆報價系統 V6
                    </h1>
                    <p className="text-center text-slate-500 mb-8 text-sm">請輸入您的帳號密碼登入系統</p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="username">
                                用戶名稱
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="輸入您的帳號"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                                密碼
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="輸入您的密碼"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="rememberMe"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer select-none">
                                記住帳號
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md transition-all active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '登入中...' : '登入'}
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
                    <p className="text-xs text-slate-400">&copy; 2026 一帆報價系統. All rights reserved.</p>
                </div>
            </div>
            </div>
        </div>
    );
}
