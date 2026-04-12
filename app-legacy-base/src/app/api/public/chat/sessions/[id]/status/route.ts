import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/public/chat/sessions/[id]/status
 * Reset session status when the visitor returns to free chat.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: '找不到聊天工作階段。' }, { status: 404 });
    }

    const body = await request.json();
    const newStatus = body.status;

    if (newStatus !== 'active') {
      return NextResponse.json({ error: '無效的狀態值。' }, { status: 400 });
    }

    if (session.status === 'closed') {
      return NextResponse.json({ error: '已關閉的聊天不可重新開啟。' }, { status: 400 });
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: 'active' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Update session status error:', error);
    return NextResponse.json({ error: '無法更新聊天狀態。' }, { status: 500 });
  }
}
