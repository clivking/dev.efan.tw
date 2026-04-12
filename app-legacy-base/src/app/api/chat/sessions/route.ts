import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/sessions — List all chat sessions (admin)
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const url = request.nextUrl;
      const status = url.searchParams.get('status'); // active / transferred / closed
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const where: any = {};
      if (status) where.status = status;

      const [sessions, total] = await Promise.all([
        prisma.chatSession.findMany({
          where,
          include: {
            customer: {
              include: {
                contacts: { where: { isPrimary: true }, take: 1 },
                companyNames: { where: { isPrimary: true }, take: 1 },
              },
            },
            transferredToUser: { select: { name: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { content: true, role: true, createdAt: true },
            },
            _count: { select: { messages: true } },
          },
          orderBy: [
            { status: 'asc' }, // active first
            { updatedAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        }),
        prisma.chatSession.count({ where }),
      ]);

      // Format for frontend
      const formatted = sessions.map(s => ({
        id: s.id,
        source: s.source,
        status: s.status,
        visitorName: s.visitorName,
        visitorContact: s.visitorContact,
        customerName: s.visitorName
          || s.customer?.contacts?.[0]?.name
          || s.customer?.companyNames?.[0]?.companyName
          || '未知訪客',
        transferredTo: s.transferredToUser?.name || null,
        lastMessage: s.messages[0] || null,
        messageCount: s._count.messages,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));

      return NextResponse.json({ sessions: formatted, total });
    } catch (error: any) {
      console.error('List sessions error:', error);
      return NextResponse.json({ error: '取得對話列表失敗' }, { status: 500 });
    }
  });
}
