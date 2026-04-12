import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getAuthUser } from '@/lib/middleware/auth';
import { hashPassword } from '@/lib/auth';
import { SYSTEM_USER_ID } from '@/lib/system-user';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/users/[id] — Update user (change password, toggle active, etc.)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        const { id } = await params;
        const authUser = await getAuthUser(request);
        
        // Only admin can update other users; users can update their own password
        const isSelf = authUser?.id === id;
        if (!isSelf && authUser?.role !== 'admin') {
            return NextResponse.json({ error: '權限不足' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
        }

        const body = await request.json();
        const updateData: any = {};

        // Update name
        if (body.name !== undefined) updateData.name = body.name;
        // Update email
        if (body.email !== undefined) updateData.email = body.email || null;
        // Update mobile
        if (body.mobile !== undefined) updateData.mobile = body.mobile || null;
        // Update role (admin only, can't change yourself)
        if (body.role !== undefined && !isSelf && authUser?.role === 'admin') {
            updateData.role = body.role;
        }
        // Toggle active (admin only, can't deactivate yourself)
        if (body.isActive !== undefined && !isSelf && authUser?.role === 'admin') {
            if (body.isActive === false && user.role === 'admin') {
                const activeAdminCount = await prisma.user.count({
                    where: {
                        role: 'admin',
                        isActive: true,
                    },
                });

                if (user.isActive && activeAdminCount <= 1) {
                    return NextResponse.json({ error: '至少需要保留一個啟用中的管理員帳號' }, { status: 400 });
                }
            }
            updateData.isActive = body.isActive;
        }
        // Change password
        if (body.password) {
            if (body.password.length < 6) {
                return NextResponse.json({ error: '密碼至少需要 6 個字元' }, { status: 400 });
            }
            updateData.passwordHash = await hashPassword(body.password);
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
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
        });

        return NextResponse.json({ user: updated });
    });
}

/**
 * DELETE /api/users/[id] — Delete user (admin only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        const { id } = await params;
        const authUser = await getAuthUser(request);
        if (authUser?.role !== 'admin') {
            return NextResponse.json({ error: '權限不足' }, { status: 403 });
        }
        if (authUser.id === id) {
            return NextResponse.json({ error: '不能刪除自己' }, { status: 400 });
        }
        if (id === '00000000-0000-0000-0000-000000000000') {
            return NextResponse.json({ error: '不能刪除系統帳號' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, role: true, isActive: true },
        });

        if (!user) {
            return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
        }

        if (user.role === 'admin') {
            const activeAdminCount = await prisma.user.count({
                where: {
                    role: 'admin',
                    isActive: true,
                },
            });

            if (user.isActive && activeAdminCount <= 1) {
                return NextResponse.json({ error: '至少需要保留一個啟用中的管理員帳號' }, { status: 400 });
            }
        }

        const systemUser = await prisma.user.findUnique({
            where: { id: SYSTEM_USER_ID },
            select: { id: true },
        });

        if (!systemUser) {
            return NextResponse.json({ error: '系統帳號不存在，無法刪除使用者' }, { status: 500 });
        }

        await prisma.$transaction(async (tx) => {
            await Promise.all([
                tx.auditLog.updateMany({
                    where: { userId: id },
                    data: { userId: SYSTEM_USER_ID },
                }),
                tx.quote.updateMany({
                    where: { createdBy: id },
                    data: { createdBy: SYSTEM_USER_ID },
                }),
                tx.quoteTemplate.updateMany({
                    where: { createdBy: id },
                    data: { createdBy: SYSTEM_USER_ID },
                }),
                tx.quoteToken.updateMany({
                    where: { createdBy: id },
                    data: { createdBy: SYSTEM_USER_ID },
                }),
                tx.payment.updateMany({
                    where: { recordedBy: id },
                    data: { recordedBy: SYSTEM_USER_ID },
                }),
                tx.chatSession.updateMany({
                    where: { transferredTo: id },
                    data: { transferredTo: null },
                }),
            ]);

            await tx.user.delete({
                where: { id },
            });
        });

        return NextResponse.json({ success: true });
    });
}
