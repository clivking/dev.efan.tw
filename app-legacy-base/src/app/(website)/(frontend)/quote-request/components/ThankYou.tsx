'use client';

import Link from 'next/link';

export default function ThankYou({ quoteNumber }: { quoteNumber: string }) {
    return (
        <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-3xl font-black text-efan-primary mb-4">詢價已送出！</h2>
            <p className="text-gray-500 text-lg mb-2">感謝您的詢價，我們已收到您的需求。</p>
            {quoteNumber && (
                <p className="text-gray-500 mb-6">
                    報價單編號：<span className="font-bold text-efan-primary">{quoteNumber}</span>
                </p>
            )}
            <p className="text-gray-400 mb-10">我們將盡快為您準備報價，並主動與您聯繫。</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/"
                    className="bg-efan-primary hover:bg-efan-primary-light text-white px-8 py-3 rounded-xl font-bold transition-all">
                    返回首頁
                </Link>
                <Link href="/products"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold transition-all">
                    瀏覽產品目錄
                </Link>
            </div>
        </div>
    );
}
