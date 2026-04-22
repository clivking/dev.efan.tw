import { NextRequest } from 'next/server';
import { normalizeIpAddress } from '@/lib/ip';

export function getClientIp(request: NextRequest): string | null {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = normalizeIpAddress(forwardedFor || realIp);
    return ipAddress === 'unknown' ? null : ipAddress;
}

export function getClientUserAgent(request: NextRequest): string | null {
    const userAgent = request.headers.get('user-agent')?.trim();
    return userAgent || null;
}
