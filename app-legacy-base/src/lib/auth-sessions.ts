import crypto from 'node:crypto';
import { Prisma } from '@/generated/prisma-v7/client';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getSetting } from '@/lib/settings';
import { getClientIp, getClientUserAgent } from '@/lib/request-metadata';
import { ensureSecurityTables } from '@/lib/security-tables';

type AuthSessionRow = {
    id: string;
    user_id: string;
    created_at: Date;
    expires_at: Date;
    last_seen_at: Date;
    revoked_at: Date | null;
    ip_address: string | null;
    user_agent: string | null;
    last_seen_ip: string | null;
    last_seen_user_agent: string | null;
};

const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export async function createAuthSession(userId: string, request: NextRequest): Promise<string> {
    await ensureSecurityTables();

    const sessionDays = await getSetting('security_session_days', 30);
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + sessionDays * 24 * 60 * 60 * 1000);
    const ipAddress = getClientIp(request);
    const userAgent = getClientUserAgent(request);

    await prisma.$executeRaw`
        INSERT INTO auth_sessions (id, user_id, expires_at, ip_address, user_agent, last_seen_ip, last_seen_user_agent)
        VALUES (${sessionId}::uuid, ${userId}::uuid, ${expiresAt}, ${ipAddress}, ${userAgent}, ${ipAddress}, ${userAgent})
    `;

    return sessionId;
}

export async function getAuthSession(sessionId: string, userId: string): Promise<AuthSessionRow | null> {
    await ensureSecurityTables();
    const rows = await prisma.$queryRaw<AuthSessionRow[]>`
        SELECT *
        FROM auth_sessions
        WHERE id = ${sessionId}::uuid
          AND user_id = ${userId}::uuid
        LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function validateAuthSession(sessionId: string, userId: string, request: NextRequest): Promise<AuthSessionRow | null> {
    const session = await getAuthSession(sessionId, userId);
    if (!session) return null;
    if (session.revoked_at) return null;
    if (session.expires_at.getTime() <= Date.now()) return null;

    if (Date.now() - session.last_seen_at.getTime() >= SESSION_TOUCH_INTERVAL_MS) {
        const ipAddress = getClientIp(request);
        const userAgent = getClientUserAgent(request);
        await prisma.$executeRaw`
            UPDATE auth_sessions
            SET last_seen_at = now(),
                last_seen_ip = ${ipAddress},
                last_seen_user_agent = ${userAgent}
            WHERE id = ${sessionId}::uuid
        `;
    }

    return session;
}

export async function listAuthSessions(userId: string): Promise<Array<{
    id: string;
    createdAt: string;
    expiresAt: string;
    lastSeenAt: string;
    revokedAt: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    lastSeenIp: string | null;
    lastSeenUserAgent: string | null;
}>> {
    await ensureSecurityTables();
    const rows = await prisma.$queryRaw<AuthSessionRow[]>`
        SELECT *
        FROM auth_sessions
        WHERE user_id = ${userId}::uuid
        ORDER BY created_at DESC
    `;

    return rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at.toISOString(),
        expiresAt: row.expires_at.toISOString(),
        lastSeenAt: row.last_seen_at.toISOString(),
        revokedAt: row.revoked_at?.toISOString() ?? null,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        lastSeenIp: row.last_seen_ip,
        lastSeenUserAgent: row.last_seen_user_agent,
    }));
}

export async function revokeAuthSession(sessionId: string): Promise<void> {
    await ensureSecurityTables();
    await prisma.$executeRaw`
        UPDATE auth_sessions
        SET revoked_at = now()
        WHERE id = ${sessionId}::uuid
          AND revoked_at IS NULL
    `;
}

export async function revokeUserSessions(userId: string, exceptSessionId?: string | null): Promise<number> {
    await ensureSecurityTables();

    const exceptClause = exceptSessionId
        ? Prisma.sql`AND id <> ${exceptSessionId}::uuid`
        : Prisma.empty;

    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
        WITH updated AS (
            UPDATE auth_sessions
            SET revoked_at = now()
            WHERE user_id = ${userId}::uuid
              AND revoked_at IS NULL
              ${exceptClause}
            RETURNING 1
        )
        SELECT COUNT(*)::bigint AS count FROM updated
    `;

    return Number(rows[0]?.count ?? BigInt(0));
}

export async function deleteUserSessions(userId: string): Promise<void> {
    await ensureSecurityTables();
    await prisma.$executeRaw`
        DELETE FROM auth_sessions
        WHERE user_id = ${userId}::uuid
    `;
}

export async function countActiveSessionsByUserIds(userIds: string[]): Promise<Map<string, number>> {
    await ensureSecurityTables();
    if (userIds.length === 0) return new Map();

    const rows = await prisma.$queryRaw<Array<{ user_id: string; count: bigint }>>`
        SELECT user_id, COUNT(*)::bigint AS count
        FROM auth_sessions
        WHERE user_id IN (${Prisma.join(userIds.map((id) => Prisma.sql`${id}::uuid`))})
          AND revoked_at IS NULL
          AND expires_at > now()
        GROUP BY user_id
    `;

    return new Map(rows.map((row) => [row.user_id, Number(row.count)]));
}

export async function cleanupExpiredAuthSessions(): Promise<number> {
    await ensureSecurityTables();
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
        WITH deleted AS (
            DELETE FROM auth_sessions
            WHERE expires_at < now() - interval '7 days'
               OR revoked_at < now() - interval '7 days'
            RETURNING 1
        )
        SELECT COUNT(*)::bigint AS count FROM deleted
    `;

    return Number(rows[0]?.count ?? BigInt(0));
}
