import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const TADA_HOSTS = new Set(['tada.com.tw', 'www.tada.com.tw']);

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
    const { pathname, searchParams, host } = request.nextUrl;

    if (TADA_HOSTS.has(host)) {
        const decodedPath = decodeURIComponent(pathname);
        const absolute = (destination: string) => new URL(destination, 'https://www.efan.tw');
        const modelPdfMatch = decodedPath.match(/\/([a-zA-Z0-9-]+)\.pdf$/);
        if (modelPdfMatch?.[1]) {
            return NextResponse.redirect(absolute(`/products/${modelPdfMatch[1]}`), 308);
        }

        if (decodedPath.startsWith('/電話總機')) {
            return NextResponse.redirect(absolute('/services/phone-system'), 308);
        }
        if (decodedPath.startsWith('/電子鎖')) {
            return NextResponse.redirect(absolute('/products/category/electronic-lock'), 308);
        }
        if (decodedPath.startsWith('/旅館房控系統')) {
            return NextResponse.redirect(absolute('/'), 308);
        }
        if (decodedPath.startsWith('/門禁讀卡機')) {
            return NextResponse.redirect(absolute('/products/category/reader'), 308);
        }
        if (decodedPath.startsWith('/門禁')) {
            const accessModelMatch = decodedPath.match(/\/門禁.*\/([a-zA-Z0-9-]+)$/);
            if (accessModelMatch?.[1]) {
                return NextResponse.redirect(absolute(`/products/${accessModelMatch[1]}`), 308);
            }
            return NextResponse.redirect(absolute('/services/access-control'), 308);
        }
        if (decodedPath.startsWith('/關於一帆')) {
            return NextResponse.redirect(absolute('/about'), 308);
        }
        if (decodedPath.startsWith('/下載') || decodedPath.startsWith('/downloads')) {
            return NextResponse.redirect(absolute('/support/downloads'), 308);
        }

        return NextResponse.redirect(absolute('/'), 308);
    }

    // Strip legacy query params from historical URLs so redirects converge on one clean canonical URL.
    if (pathname === '/access-control.html' && searchParams.has('filter_categories')) {
        const category = searchParams.get('filter_categories');
        if (category === 'electronic-lock') {
            return NextResponse.redirect(new URL('/products/category/electronic-lock', request.url), 308);
        }
        if (category === 'accessories') {
            return NextResponse.redirect(new URL('/products/category/access-accessories', request.url), 308);
        }
        if (category === 'exit-button') {
            return NextResponse.redirect(new URL('/products/category/exit-button', request.url), 308);
        }
        if (category === 'controller') {
            return NextResponse.redirect(new URL('/products/category/access-control', request.url), 308);
        }
    }

    if (pathname.startsWith('/component/easystore/product/') || pathname.startsWith('/component/easystore/products/')) {
        return NextResponse.redirect(new URL('/products', request.url), 308);
    }

    if (!pathname.startsWith('/admin/')) {
        return NextResponse.next();
    }

    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        await jwtVerify(token, getJwtSecret());
        return NextResponse.next();
    } catch {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
    }
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
