'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const InquiryBadge = dynamic(() => import('@/components/products/InquiryBadge'), { ssr: false });
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false });
const CookieBanner = dynamic(() => import('@/components/layout/CookieBanner'), { ssr: false });
const ScrollToTop = dynamic(() => import('@/components/common/ScrollToTop'), { ssr: false });

export default function ClientFeatures() {
    const [isChatReady, setIsChatReady] = useState(false);
    const [isCookieReady, setIsCookieReady] = useState(false);
    const [isUiReady, setIsUiReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const handleInteraction = () => {
            if (!isMounted) return;
            setIsUiReady(true);
            setIsChatReady(true);
            setIsCookieReady(true);
        };

        window.addEventListener('scroll', handleInteraction, { passive: true, once: true });
        window.addEventListener('pointerdown', handleInteraction, { passive: true, once: true });
        window.addEventListener('touchstart', handleInteraction, { passive: true, once: true });

        const cookieTimer = setTimeout(() => {
            if (isMounted) {
                setIsCookieReady(true);
            }
        }, 5000);


        return () => {
            isMounted = false;
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('pointerdown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            clearTimeout(cookieTimer);
        };
    }, []);

    return (
        <>
            {isUiReady && <InquiryBadge />}
            {isUiReady && <ScrollToTop />}
            {isChatReady && <ChatWidget source="web_home" />}
            {isCookieReady && <CookieBanner />}
        </>
    );
}
