import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: '一帆報價系統 V6' },
  description: '一帆安全整合內部登入入口。',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
    },
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
