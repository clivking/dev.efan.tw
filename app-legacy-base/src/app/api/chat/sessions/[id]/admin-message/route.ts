import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getAuthUser } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/sessions/[id]/admin-message — Admin sends a message to the customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 });

    try {
      const session = await prisma.chatSession.findUnique({ where: { id } });
      if (!session) return NextResponse.json({ error: '對話不存在' }, { status: 404 });
      if (session.status === 'closed') {
        return NextResponse.json({ error: '此對話已結束' }, { status: 400 });
      }

      const body = await request.json();
      const content = body.message?.trim();
      if (!content) {
        return NextResponse.json({ error: '訊息不能為空' }, { status: 400 });
      }

      const message = await prisma.chatMessage.create({
        data: {
          sessionId: id,
          role: 'admin',
          content,
          senderName: user.name,
        },
      });

      // Auto-transfer if session is still AI mode
      if (session.status === 'active') {
        await prisma.chatSession.update({
          where: { id },
          data: {
            status: 'transferred',
            transferredTo: user.id,
            transferredAt: new Date(),
          },
        });
      }

      return NextResponse.json({ success: true, message });
    } catch (error: any) {
      console.error('Admin message error:', error);
      return NextResponse.json({ error: '發送失敗' }, { status: 500 });
    }
  });
}
