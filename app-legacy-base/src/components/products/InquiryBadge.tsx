'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useInquiry } from './InquiryContext';

export default function InquiryBadge() {
    const { totalCount } = useInquiry();
    const pathname = usePathname();

    if (totalCount === 0 || pathname === '/products/inquiry') return null;

    return (
        <Link
            href="/products/inquiry"
            className="fixed bottom-24 right-6 z-50 bg-efan-accent hover:bg-efan-accent-dark text-white px-6 py-3.5 rounded-full font-bold shadow-2xl shadow-efan-accent/40 transition-all active:scale-95 flex items-center gap-2 animate-bounce-subtle"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            詢價清單
            <span className="bg-white text-efan-accent w-6 h-6 rounded-full flex items-center justify-center text-sm font-black">
                {totalCount}
            </span>
        </Link>
    );
}
