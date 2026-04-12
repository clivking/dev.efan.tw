import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json({
            success: true,
            data: {
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString(),
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Database connection failed',
        }, { status: 500 });
    }
}
