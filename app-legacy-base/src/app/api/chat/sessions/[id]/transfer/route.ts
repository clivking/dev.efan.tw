import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getAuthUser } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/sessions/[id]/transfer — Admin takes over the conversation
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

      await prisma.chatSession.update({
        where: { id },
        data: {
          status: 'transferred',
          transferredTo: user.id,
          transferredAt: new Date(),
        },
      });

      // Add system message
      const transferMessage = `${user.name} 已接手對話`;
      await prisma.chatMessage.create({
        data: {
          sessionId: id,
          role: 'admin',
          content: transferMessage,
          senderName: '系統',
        },
      });

      return NextResponse.json({ success: true, message: '已接手對話' });
    } catch (error: any) {
      console.error('Transfer error:', error);
      return NextResponse.json({ error: '接手失敗' }, { status: 500 });
    }
  });
}
