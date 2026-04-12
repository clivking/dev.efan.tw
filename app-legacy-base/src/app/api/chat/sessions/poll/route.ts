import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/sessions/poll — Poll for updates (admin)
 * Returns active session count and recent activity
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const afterParam = request.nextUrl.searchParams.get('after');
      const after = afterParam ? new Date(afterParam) : new Date(Date.now() - 10 * 1000);

      // Get counts by status
      const [activeCount, transferredCount] = await Promise.all([
        prisma.chatSession.count({ where: { status: 'active' } }),
        prisma.chatSession.count({ where: { status: 'transferred' } }),
      ]);

      // Get recently updated sessions
      const recentSessions = await prisma.chatSession.findMany({
        where: {
          updatedAt: { gte: after },
          status: { not: 'closed' },
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, content: true, role: true, createdAt: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      });

      // Get new messages across all active sessions
      const newMessages = await prisma.chatMessage.findMany({
        where: {
          createdAt: { gte: after },
          session: { status: { not: 'closed' } },
        },
        select: {
          id: true,
          sessionId: true,
          role: true,
          content: true,
          senderName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      return NextResponse.json({
        activeCount,
        transferredCount,
        totalOpen: activeCount + transferredCount,
        recentSessions: recentSessions.map(s => ({
          id: s.id,
          status: s.status,
          visitorName: s.visitorName,
          lastMessage: s.messages[0] || null,
          updatedAt: s.updatedAt,
        })),
        newMessages,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Poll error:', error);
      return NextResponse.json({ error: '輪詢失敗' }, { status: 500 });
    }
  });
}
