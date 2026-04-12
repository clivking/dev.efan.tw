'use client';

import { useEffect, useRef } from 'react';

export function ViewTracker({ token }: { token: string }) {
    const viewIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        // 1. Record view
        const recordView = async () => {
            try {
                const res = await fetch(`/api/public/q/${token}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userAgent: navigator.userAgent,
                        deviceType: detectDeviceType(),
                    }),
                });
                const data = await res.json();
                viewIdRef.current = data.viewId;
            } catch (e) {
                console.error('View tracking failed:', e);
            }
        };

        recordView();

        // 2. Report duration on exit
        const reportDuration = () => {
            if (!viewIdRef.current || viewIdRef.current === 'tracking-disabled') return;

            const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
            const blob = new Blob(
                [JSON.stringify({ durationSeconds: duration })],
                { type: 'application/json' }
            );

            navigator.sendBeacon(
                `/api/public/q/${token}/view/${viewIdRef.current}`,
                blob
            );
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                reportDuration();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', reportDuration);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', reportDuration);
        };
    }, [token]);

    return null;
}

function detectDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android/i.test(ua)) return 'mobile';
    return 'desktop';
}
