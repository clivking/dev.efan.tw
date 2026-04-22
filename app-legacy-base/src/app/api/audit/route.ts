export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { classifyAuditCategory, classifyAuditSeverity, summarizeAudit } from '@/lib/security-audit';

export async function GET(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const userId = searchParams.get('userId');
        const action = searchParams.get('action');
        const tableName = searchParams.get('tableName');
        const category = searchParams.get('category');
        const severity = searchParams.get('severity');
        const query = searchParams.get('q')?.trim().toLowerCase() || '';

        const where: any = {};
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lte = new Date(to);
        }
        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (tableName) where.tableName = tableName;

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
        });

        const enriched = logs.map((log) => {
            const normalizedLog = {
                ...log,
                before: (log.before ?? null) as Record<string, unknown> | null,
                after: (log.after ?? null) as Record<string, unknown> | null,
            };
            const auditCategory = classifyAuditCategory(normalizedLog);
            const auditSeverity = classifyAuditSeverity(normalizedLog);
            const summary = summarizeAudit(normalizedLog);

            return {
                ...normalizedLog,
                category: auditCategory,
                severity: auditSeverity,
                summary,
            };
        }).filter((log) => {
            if (category && log.category !== category) return false;
            if (severity && log.severity !== severity) return false;
            if (!query) return true;

            const haystack = [
                log.summary,
                log.action,
                log.tableName,
                log.ipAddress || '',
                log.user?.name || '',
                log.user?.username || '',
                typeof log.after?.attemptedUsername === 'string' ? log.after.attemptedUsername : '',
                typeof log.after?.username === 'string' ? log.after.username : '',
            ].join(' ').toLowerCase();

            return haystack.includes(query);
        });

        const pageLogs = enriched.slice(offset, offset + limit);
        const recordLabels = new Map<string, string | null>();
        await Promise.all(pageLogs.map(async (log) => {
            let recordLabel: string | null = null;
            try {
                if (log.tableName === 'customers') {
                    const cust = await prisma.customer.findUnique({ where: { id: log.recordId }, select: { customerNumber: true } });
                    recordLabel = cust?.customerNumber || null;
                } else if (log.tableName === 'quotes') {
                    const q = await prisma.quote.findUnique({ where: { id: log.recordId }, select: { quoteNumber: true } });
                    recordLabel = q?.quoteNumber || null;
                } else if (log.tableName === 'products') {
                    const p = await prisma.product.findUnique({ where: { id: log.recordId }, select: { name: true } });
                    recordLabel = p?.name || null;
                } else if (log.tableName === 'settings') {
                    const s = await prisma.setting.findUnique({ where: { id: log.recordId }, select: { key: true } });
                    recordLabel = s?.key || null;
                }
            } catch {
                recordLabel = null;
            }
            recordLabels.set(log.id, recordLabel);
        }));

        const logsWithLabels = pageLogs.map((log) => ({
            ...log,
            recordLabel: recordLabels.get(log.id) ?? null,
        }));

        return NextResponse.json({
            logs: logsWithLabels,
            total: enriched.length,
            limit,
            offset,
        });
    });
}
