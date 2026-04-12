import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/sessions/batch-delete — Delete sessions older than N days
 * Body: { olderThanDays: number }
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const { olderThanDays } = await request.json();

      if (!olderThanDays || olderThanDays < 1) {
        return NextResponse.json({ error: '請指定天數' }, { status: 400 });
      }

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - olderThanDays);

      // Find sessions older than cutoff
      const oldSessions = await prisma.chatSession.findMany({
        where: { createdAt: { lt: cutoff } },
        select: { id: true },
      });

      if (oldSessions.length === 0) {
        return NextResponse.json({ success: true, deleted: 0, message: '沒有符合條件的對話' });
      }

      const sessionIds = oldSessions.map(s => s.id);

      // Delete messages first, then sessions
      const msgResult = await prisma.chatMessage.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });

      const sessionResult = await prisma.chatSession.deleteMany({
        where: { id: { in: sessionIds } },
      });

      return NextResponse.json({
        success: true,
        deleted: sessionResult.count,
        messagesDeleted: msgResult.count,
        message: `已刪除 ${sessionResult.count} 個對話（${msgResult.count} 則訊息）`,
      });
    } catch (error: any) {
      console.error('Batch delete error:', error);
      return NextResponse.json({ error: '批次刪除失敗' }, { status: 500 });
    }
  });
}
