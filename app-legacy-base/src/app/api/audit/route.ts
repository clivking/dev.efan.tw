export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

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
            take: limit,
            skip: offset,
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

        // Resolve labels for display
        const logsWithLabels = await Promise.all(logs.map(async (log) => {
            let recordLabel = null;
            try {
                if (log.tableName === 'customers') {
                    const cust = await prisma.customer.findUnique({ where: { id: log.recordId }, select: { customerNumber: true } });
                    recordLabel = cust?.customerNumber;
                } else if (log.tableName === 'quotes') {
                    const q = await prisma.quote.findUnique({ where: { id: log.recordId }, select: { quoteNumber: true } });
                    recordLabel = q?.quoteNumber;
                } else if (log.tableName === 'products') {
                    const p = await prisma.product.findUnique({ where: { id: log.recordId }, select: { name: true } });
                    recordLabel = p?.name;
                } else if (log.tableName === 'settings') {
                    const s = await prisma.setting.findUnique({ where: { id: log.recordId }, select: { key: true } });
                    recordLabel = s?.key;
                }
            } catch (e) {
                // Ignore errors
            }
            return { ...log, recordLabel };
        }));

        const total = await prisma.auditLog.count({ where });

        return NextResponse.json({
            logs: logsWithLabels,
            total,
            limit,
            offset,
        });
    });
}
