import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/sessions/[id]/close — Close the conversation
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
        data: { status: 'closed' },
      });

      await prisma.chatMessage.create({
        data: {
          sessionId: id,
          role: 'admin',
          content: '對話已結束',
          senderName: '系統',
        },
      });

      return NextResponse.json({ success: true, message: '對話已結束' });
    } catch (error: any) {
      console.error('Close error:', error);
      return NextResponse.json({ error: '關閉失敗' }, { status: 500 });
    }
  });
}
