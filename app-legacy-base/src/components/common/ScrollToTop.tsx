'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 監聽滾動事件
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // 平滑滾動至網頁頂部
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="回頂端"
      className={`fixed right-6 bottom-24 z-50 p-3 rounded-2xl bg-white text-emerald-600 shadow-[0_8px_30px_rgba(16,185,129,0.2)] border border-emerald-100 hover:bg-emerald-50 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(16,185,129,0.3)] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
    >
      <ArrowUp strokeWidth={2.5} size={22} />
    </button>
  );
}
