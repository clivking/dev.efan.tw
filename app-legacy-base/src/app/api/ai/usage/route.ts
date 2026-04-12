import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware/auth';
import { getAIUsageSummary } from '@/lib/ai/usage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/usage
 * Returns AI usage totals for today, this month, last month, and lifetime.
 */
export async function GET(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const summary = await getAIUsageSummary();
      return NextResponse.json(summary);
    } catch (error: any) {
      console.error('AI usage error:', error);
      return NextResponse.json(
        { error: error?.message || '無法載入 AI 用量統計。' },
        { status: 500 },
      );
    }
  });
}
