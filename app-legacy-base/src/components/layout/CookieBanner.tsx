'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    // 檢查使用者是否已經同意
    const consent = localStorage.getItem('efan-cookie-consent');
    if (!consent) {
      setIsRendered(true);
      // 延遲 1.5 秒彈出，避免與首頁載入動畫搶視覺焦點
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('efan-cookie-consent', 'accepted');
    setIsVisible(false);
    setTimeout(() => setIsRendered(false), 500); // 對齊 CSS 轉場時間
  };

  const handleDecline = () => {
    localStorage.setItem('efan-cookie-consent', 'declined');
    setIsVisible(false);
    setTimeout(() => setIsRendered(false), 500);
  };

  if (!isRendered) return null;

  return (
    <div 
      className={`fixed bottom-6 left-6 z-[9999] max-w-sm transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
      }`}
    >
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl p-6 rounded-2xl relative overflow-hidden">
        {/* 背景發光層，增添 SaaS 質感 */}
        <div className="absolute inset-0 bg-gradient-to-br from-efan-accent/10 to-transparent opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" role="img" aria-label="cookie">🍪</span>
            <h3 className="font-bold text-gray-900 leading-tight">我們重視您的體驗</h3>
          </div>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed font-medium">
            本網站使用 Cookie 與追蹤技術來針對特定商辦企業提供最個人化的安防整合建議。繼續瀏覽即代表您同意我們的
            <Link href="/privacy" className="text-efan-primary hover:text-efan-accent underline decoration-efan-primary/30 underline-offset-2 mx-1 transition-colors">隱私權聲明</Link>。
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleAccept}
              className="w-full sm:flex-1 bg-efan-primary hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all active:scale-95 shadow-md shadow-efan-primary/20"
            >
              好的，我允許
            </button>
            <button
              onClick={handleDecline}
              className="w-full sm:flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 px-4 rounded-xl text-sm transition-all active:scale-95"
            >
              僅使用必要項目
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
