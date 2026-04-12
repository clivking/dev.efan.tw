// import { Noto_Sans_TC, Inter } from 'next/font/google';

/* 
Temporarily disabled Web Fonts to achieve 98+ Lighthouse score.
System fonts are used for instant FCP.
*/

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant-TW">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
