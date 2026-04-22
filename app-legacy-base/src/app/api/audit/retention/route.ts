import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware/auth';
import { runAuditRetentionIfDue } from '@/lib/audit-retention';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    return withAdmin(request, async () => {
        const result = await runAuditRetentionIfDue(true);
        return NextResponse.json({ success: true, ...result });
    });
}
