import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { revokeAuthSession } from '@/lib/auth-sessions';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const response = await withAuth(request, async (req: AuthenticatedRequest) => {
        if (req.user?.sessionId) {
            await revokeAuthSession(req.user.sessionId);
            await writeAudit({
                userId: req.user.id,
                action: 'logout',
                tableName: 'auth',
                recordId: req.user.id,
                after: {
                    username: req.user.username,
                    sessionId: req.user.sessionId,
                },
            });
        }

        return NextResponse.json({ success: true });
    });

    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });

    return response;
}
