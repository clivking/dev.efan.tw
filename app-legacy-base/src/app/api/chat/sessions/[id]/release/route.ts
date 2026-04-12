import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/sessions/[id]/release — Release back to AI
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    const { id } = await params;

    try {
      const session = await prisma.chatSession.findUnique({ where: { id } });
      if (!session) return NextResponse.json({ error: '對話不存在' }, { status: 404 });

      await prisma.chatSession.update({
        where: { id },
        data: {
          status: 'active',
          transferredTo: null,
          transferredAt: null,
        },
      });

      await prisma.chatMessage.create({
        data: {
          sessionId: id,
          role: 'admin',
          content: '已交回 AI 客服',
          senderName: '系統',
        },
      });

      return NextResponse.json({ success: true, message: '已交回 AI' });
    } catch (error: any) {
      console.error('Release error:', error);
      return NextResponse.json({ error: '交回失敗' }, { status: 500 });
    }
  });
}
