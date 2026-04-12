'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '540px',
      }}>
        {/* 404 大字 */}
        <div style={{
          fontSize: 'clamp(5rem, 15vw, 9rem)',
          fontWeight: 800,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
          letterSpacing: '-0.03em',
        }}>
          404
        </div>

        {/* 標題 */}
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#f1f5f9',
          margin: '0 0 0.75rem',
        }}>
          找不到此頁面
        </h1>

        {/* 說明 */}
        <p style={{
          fontSize: '1rem',
          color: '#94a3b8',
          margin: '0 0 2rem',
          lineHeight: 1.6,
        }}>
          您訪問的頁面不存在或已移動。<br />
          將在 <span style={{ color: '#3b82f6', fontWeight: 600 }}>{countdown}</span> 秒後自動返回首頁。
        </p>

        {/* 快速連結 */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            ← 返回首頁
          </Link>
          <Link href="/products" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'rgba(255,255,255,0.08)',
            color: '#cbd5e1',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            瀏覽產品
          </Link>
          <Link href="/services" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'rgba(255,255,255,0.08)',
            color: '#cbd5e1',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            服務項目
          </Link>
        </div>
      </div>
    </div>
  );
}
