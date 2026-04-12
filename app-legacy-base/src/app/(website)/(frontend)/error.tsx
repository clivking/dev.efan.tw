'use client';

import Link from 'next/link';

export default function FrontendError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="text-6xl mb-6">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    頁面載入發生問題
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    很抱歉，目前無法載入此頁面。請稍後再試，或直接撥打電話聯繫我們。
                </p>
                <div className="space-y-4">
                    <button
                        onClick={reset}
                        className="w-full bg-efan-accent hover:bg-efan-accent-dark text-white font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        重新載入
                    </button>
                    <Link
                        href="/"
                        className="block w-full text-center text-efan-primary font-bold py-3 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        返回首頁
                    </Link>
                </div>
            </div>
        </div>
    );
}
