import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware/auth';
import { hashPassword } from '@/lib/auth';
import { countActiveSessionsByUserIds } from '@/lib/auth-sessions';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users - List all users (admin only)
 */
export async function GET(request: NextRequest) {
    return withAdmin(request, async () => {
        const users = await prisma.user.findMany({
            where: { id: { not: '00000000-0000-0000-0000-000000000000' } }, // exclude system
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                email: true,
                mobile: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        const sessionCounts = await countActiveSessionsByUserIds(users.map((user) => user.id));
        return NextResponse.json({
            users: users.map((user) => ({
                ...user,
                activeSessionCount: sessionCounts.get(user.id) || 0,
            })),
        });
    });
}

/**
 * POST /api/users - Create new user (admin only)
 */
export async function POST(request: NextRequest) {
    return withAdmin(request, async (req) => {
        const body = await request.json();
        const { username, password, name, role, email, mobile } = body;

        if (!username || !password || !name) {
            return NextResponse.json({ error: 'username, password, and name are required' }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                username,
                passwordHash,
                name,
                role: role || 'admin',
                email: email || null,
                mobile: mobile || null,
            },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                email: true,
                mobile: true,
                isActive: true,
                createdAt: true,
            },
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'create',
            tableName: 'users',
            recordId: user.id,
            after: {
                username: user.username,
                name: user.name,
                role: user.role,
                email: user.email,
                mobile: user.mobile,
            },
        });

        return NextResponse.json({ user }, { status: 201 });
    });
}
