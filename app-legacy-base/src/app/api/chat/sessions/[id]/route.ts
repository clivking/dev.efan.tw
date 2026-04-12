import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/sessions/[id] — Get session detail + all messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    const { id } = await params;

    try {
      const session = await prisma.chatSession.findUnique({
        where: { id },
        include: {
          customer: {
            include: {
              contacts: { orderBy: { sortOrder: 'asc' } },
              companyNames: { orderBy: { sortOrder: 'asc' } },
              locations: { orderBy: { sortOrder: 'asc' } },
            },
          },
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              status: true,
              totalAmount: true,
            },
          },
          transferredToUser: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              role: true,
              content: true,
              senderName: true,
              provider: true,
              model: true,
              promptTokens: true,
              completionTokens: true,
              totalTokens: true,
              estimatedCost: true,
              extractedInfo: true,
              createdAt: true,
            },
          },
        },
      });

      if (!session) {
        return NextResponse.json({ error: '對話不存在' }, { status: 404 });
      }

      // Aggregate extracted info from all messages
      let aggregatedInfo: any = {};
      for (const msg of session.messages) {
        if (msg.extractedInfo && typeof msg.extractedInfo === 'object') {
          const info = msg.extractedInfo as Record<string, any>;
          for (const [k, v] of Object.entries(info)) {
            if (v && v !== null) aggregatedInfo[k] = v;
          }
        }
      }

      return NextResponse.json({
        session: {
          id: session.id,
          source: session.source,
          status: session.status,
          visitorName: session.visitorName,
          visitorContact: session.visitorContact,
          transferredTo: session.transferredToUser,
          metadata: session.metadata,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        customer: session.customer,
        quote: session.quote,
        messages: session.messages,
        aggregatedInfo,
      });
    } catch (error: any) {
      console.error('Get session detail error:', error);
      return NextResponse.json({ error: '取得對話詳情失敗' }, { status: 500 });
    }
  });
}

/**
 * DELETE /api/chat/sessions/[id] — Delete a session and all its messages
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    const { id } = await params;

    try {
      // Delete messages first, then the session
      await prisma.chatMessage.deleteMany({ where: { sessionId: id } });
      await prisma.chatSession.delete({ where: { id } });

      return NextResponse.json({ success: true, message: '對話已刪除' });
    } catch (error: any) {
      console.error('Delete session error:', error);
      return NextResponse.json({ error: '刪除對話失敗' }, { status: 500 });
    }
  });
}
