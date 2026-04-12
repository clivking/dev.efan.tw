'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('./Footer'));

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Skip layout for specific paths
    const isHideFrontendLayout =
        pathname === '/login' ||
        pathname?.startsWith('/admin/') ||
        pathname === '/admin' ||
        pathname?.startsWith('/login/') ||
        pathname?.startsWith('/q/');

    // Only render header/footer if not hidden
    const showHeaderFooter = pathname && !isHideFrontendLayout;

    return (
        <>
            {showHeaderFooter && <Header />}
            {children}
            {showHeaderFooter && <Footer />}
        </>
    );
}
