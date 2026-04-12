import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const SALT_ROUNDS = 12;
const PORTAL_COOKIE_NAME = 'portal_token';
const PORTAL_JWT_EXPIRY = '7d';

function getPortalJwtSecret(): Uint8Array {
    const secret = process.env.PORTAL_JWT_SECRET;
    if (!secret) throw new Error('PORTAL_JWT_SECRET not set');
    return new TextEncoder().encode(secret);
}

export interface PortalJwtPayload {
    portalUserId: string;
    customerId: string;
    username: string;
    type: 'portal';
    isAdmin?: boolean;
}

export async function hashPortalPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPortalPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function signPortalToken(payload: Omit<PortalJwtPayload, 'type'>): Promise<string> {
    return new SignJWT({ ...payload, type: 'portal' as const })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(PORTAL_JWT_EXPIRY)
        .sign(getPortalJwtSecret());
}

export async function verifyPortalToken(token: string): Promise<PortalJwtPayload> {
    const { payload } = await jwtVerify(token, getPortalJwtSecret());
    if (payload.type !== 'portal') throw new Error('Invalid token type');
    return payload as unknown as PortalJwtPayload;
}

export async function setPortalCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(PORTAL_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
}

export async function clearPortalCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(PORTAL_COOKIE_NAME);
}

export async function getPortalUser(): Promise<PortalJwtPayload | null> {
    try {
        const cookieStore = await cookies();

        // 1. Check portal token first (customer login)
        const portalToken = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
        if (portalToken) {
            return await verifyPortalToken(portalToken);
        }

        // 2. Fallback: check admin token (allows admins to view portal)
        const adminToken = cookieStore.get('token')?.value;
        if (adminToken) {
            const adminSecret = process.env.JWT_SECRET;
            if (!adminSecret) return null;
            const { payload } = await jwtVerify(
                adminToken,
                new TextEncoder().encode(adminSecret)
            );
            if (payload.userId && payload.email) {
                return {
                    portalUserId: payload.userId as string,
                    customerId: '',
                    username: payload.email as string,
                    type: 'portal',
                    isAdmin: true,
                };
            }
        }

        return null;
    } catch {
        return null;
    }
}

export async function authenticatePortalUser(username: string, password: string) {
    const user = await prisma.portalUser.findUnique({
        where: { username },
        include: {
            contact: true,
            customer: {
                include: {
                    companyNames: { where: { isPrimary: true }, take: 1 },
                },
            },
        },
    });
    if (!user) return null;
    if (user.status !== 'active') return { error: 'disabled' as const };

    const valid = await verifyPortalPassword(password, user.passwordHash);
    if (!valid) return null;

    await prisma.portalUser.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });

    return { user };
}
