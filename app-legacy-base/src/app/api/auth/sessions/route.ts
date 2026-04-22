import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { listAuthSessions, revokeAuthSession, revokeUserSessions } from '@/lib/auth-sessions';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const sessions = await listAuthSessions(req.user!.id);
        return NextResponse.json({
            sessions,
            currentSessionId: req.user?.sessionId || null,
        });
    });
}

export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const body = await request.json().catch(() => ({}));
        const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;
        const revokeOthers = body.revokeOthers === true;

        if (revokeOthers) {
            const revokedCount = await revokeUserSessions(req.user!.id, req.user?.sessionId || null);
            await writeAudit({
                userId: req.user!.id,
                action: 'session_revoked',
                tableName: 'auth_sessions',
                recordId: req.user?.sessionId || req.user!.id,
                after: {
                    scope: 'others',
                    revokedCount,
                },
            });

            return NextResponse.json({ success: true, revokedCount });
        }

        if (!sessionId) {
            return NextResponse.json({ error: '缺少 sessionId' }, { status: 400 });
        }

        const sessions = await listAuthSessions(req.user!.id);
        if (!sessions.some((session) => session.id === sessionId)) {
            return NextResponse.json({ error: '找不到指定 session' }, { status: 404 });
        }

        await revokeAuthSession(sessionId);
        await writeAudit({
            userId: req.user!.id,
            action: 'session_revoked',
            tableName: 'auth_sessions',
            recordId: sessionId,
            after: {
                scope: sessionId === req.user?.sessionId ? 'self' : 'single',
            },
        });

        const response = NextResponse.json({ success: true });
        if (sessionId === req.user?.sessionId) {
            response.cookies.set('token', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 0,
                path: '/',
            });
        }

        return response;
    });
}
