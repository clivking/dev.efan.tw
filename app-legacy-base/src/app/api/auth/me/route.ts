export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        return NextResponse.json({ user: req.user });
    });
}
