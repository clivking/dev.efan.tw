import type { NextConfig } from 'next';
import { NEXT_CONDITIONAL_REDIRECTS, SHARED_EXACT_REDIRECTS } from './src/lib/redirect-rules';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
  "media-src 'self' blob: data: https:",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer'],
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/(.*)\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg|woff2|woff|ttf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/admin/login',
        destination: '/login',
        permanent: true,
      },
      ...NEXT_CONDITIONAL_REDIRECTS.slice(0, 1),
      ...SHARED_EXACT_REDIRECTS,
      {
        source: '/product-category/entry-guard/rfid-cards',
        destination: '/products/category/reader',
        permanent: true,
      },
      {
        source: '/product-category/entry-guard/rfid-cards/:path*',
        destination: '/products/category/reader',
        permanent: true,
      },
      {
        source: '/product-category/chair',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/product-category/chair/:path*',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/product-category/:path*',
        destination: '/products/category/:path*',
        permanent: true,
      },
      {
        source: '/category/uncategorized',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/category/uncategorized/:path*',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/$',
        destination: '/',
        permanent: true,
      },
      {
        source: '/&',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index.php/:path*',
        destination: '/',
        permanent: true,
      },
      ...NEXT_CONDITIONAL_REDIRECTS.slice(1),
    ];
  },
};

export default nextConfig;
