'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function DelayedGoogleAnalytics({ gaId }: { gaId: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!gaId) return;
    if (process.env.NODE_ENV !== 'production') return;

    let settled = false;

    const enable = () => {
      if (settled) return;
      settled = true;
      setEnabled(true);
      window.removeEventListener('scroll', enable);
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
      window.removeEventListener('touchstart', enable);
    };

    const idleTimer = window.setTimeout(enable, 12000);

    window.addEventListener('scroll', enable, { passive: true, once: true });
    window.addEventListener('pointerdown', enable, { passive: true, once: true });
    window.addEventListener('keydown', enable, { passive: true, once: true });
    window.addEventListener('touchstart', enable, { passive: true, once: true });

    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener('scroll', enable);
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
      window.removeEventListener('touchstart', enable);
    };
  }, [gaId]);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="ga-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
