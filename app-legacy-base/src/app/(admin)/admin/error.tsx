'use client';

import Link from 'next/link';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center max-w-lg">
                <div className="text-6xl mb-6">🔧</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    發生錯誤
                </h2>
                <p className="text-gray-500 mb-4 leading-relaxed">
                    此頁面載入時發生問題，請嘗試重新整理。
                </p>
                {process.env.NODE_ENV === 'development' && error?.message && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                        <div className="text-xs font-bold text-red-400 uppercase mb-1">Error Details (dev only)</div>
                        <pre className="text-sm text-red-700 whitespace-pre-wrap break-words">
                            {error.message}
                        </pre>
                    </div>
                )}
                <div className="space-y-3">
                    <button
                        onClick={reset}
                        className="w-full bg-efan-primary hover:bg-efan-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        重新載入頁面
                    </button>
                    <Link
                        href="/admin/dashboard"
                        className="block w-full text-center text-gray-600 font-bold py-3 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        返回儀表板
                    </Link>
                </div>
            </div>
        </div>
    );
}
