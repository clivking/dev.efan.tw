import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getOriginFromRequest } from '@/lib/site-url';
import { withAdmin } from '@/lib/middleware/auth';

const PORTAL_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 3;

// POST: generate portal registration token for customer
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(req, async () => {
        try {
            const { id } = await params;
            const token = crypto.randomBytes(16).toString('hex');
            const expiresAt = new Date(Date.now() + PORTAL_TOKEN_TTL_MS);

            await prisma.customer.update({
                where: { id },
                data: {
                    portalToken: token,
                    portalTokenExpires: expiresAt,
                },
            });

            const baseUrl = getOriginFromRequest(req);
            const registerUrl = `${baseUrl}/portal/register?token=${token}`;

            return NextResponse.json({
                success: true,
                token,
                expiresAt: expiresAt.toISOString(),
                registerUrl,
            });
        } catch (error) {
            console.error('[Admin Generate Portal Token]', error);
            return NextResponse.json({ error: '建立客戶入口註冊連結失敗' }, { status: 500 });
        }
    });
}

// DELETE: disable portal token (clear it)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(req, async () => {
        try {
            const { id } = await params;
            await prisma.customer.update({
                where: { id },
                data: {
                    portalToken: null,
                    portalTokenExpires: null,
                },
            });
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('[Admin Delete Portal Token]', error);
            return NextResponse.json({ error: '停用客戶入口註冊連結失敗' }, { status: 500 });
        }
    });
}
