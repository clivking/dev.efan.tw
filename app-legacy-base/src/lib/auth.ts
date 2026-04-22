import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const SALT_ROUNDS = 12;

type AuthenticatedUser = {
    id: string;
    username: string;
    name: string;
    mobile: string | null;
    email: string | null;
    role: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export type AuthenticateUserResult =
    | { ok: true; user: AuthenticatedUser }
    | { ok: false; reason: 'invalid_credentials' | 'inactive' };

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function signToken(payload: { userId: string; role: string; sessionId?: string }): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<{ userId: string; role: string; sessionId?: string }> {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as { userId: string; role: string; sessionId?: string };
}

export async function authenticateUserDetailed(username: string, password: string): Promise<AuthenticateUserResult> {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return { ok: false, reason: 'invalid_credentials' };
    if (!user.isActive) return { ok: false, reason: 'inactive' };

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return { ok: false, reason: 'invalid_credentials' };

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return { ok: true, user: userWithoutPassword };
}

export async function authenticateUser(username: string, password: string) {
    const result = await authenticateUserDetailed(username, password);
    return result.ok ? result.user : null;
}
