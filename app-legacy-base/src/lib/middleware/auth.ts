import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAuthSession } from '@/lib/auth-sessions';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        id: string;
        username: string;
        name: string;
        role: string;
        sessionId?: string;
    };
}

type AuthenticatedUser = NonNullable<AuthenticatedRequest['user']>;

export async function withAuth(
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
    noStore();
    try {
        const authHeader = request.headers.get('Authorization');
        let token: string | null = null;

        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        } else {
            token = request.cookies.get('token')?.value ?? null;
        }

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload.sessionId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, username: true, name: true, role: true, isActive: true },
        });

        if (!user || !user.isActive) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = await validateAuthSession(payload.sessionId, user.id, request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        (request as AuthenticatedRequest).user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            sessionId: payload.sessionId,
        };

        return handler(request as AuthenticatedRequest);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

/**
 * Get the authenticated user from the request.
 * Must be called inside a withAuth handler where the request has been augmented.
 */
export async function getAuthUser(request: NextRequest): Promise<{ id: string; username: string; name: string; role: string; sessionId?: string } | null> {
    const authReq = request as AuthenticatedRequest;
    return authReq.user || null;
}

export async function requireRole(
    request: NextRequest,
    roles: string[]
): Promise<AuthenticatedUser | NextResponse> {
    const user = await getAuthUser(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!roles.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return user;
}

export async function withRole(
    request: NextRequest,
    roles: string[],
    handler: (req: AuthenticatedRequest, user: AuthenticatedUser) => Promise<NextResponse>
): Promise<NextResponse> {
    return withAuth(request, async (req) => {
        const roleResult = await requireRole(req, roles);
        if (roleResult instanceof NextResponse) {
            return roleResult;
        }

        return handler(req, roleResult);
    });
}

export async function withAdmin(
    request: NextRequest,
    handler: (req: AuthenticatedRequest, user: AuthenticatedUser) => Promise<NextResponse>
): Promise<NextResponse> {
    return withRole(request, ['admin'], handler);
}
