import { prisma } from '@/lib/prisma';

export async function writeAudit(params: {
    userId: string;
    action: 'create' | 'update' | 'delete' | 'status_change' | 'import' | 'duplicate' | 'new_version' | 'save_as_template' | 'import_template';
    tableName: string;
    recordId: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    ipAddress?: string | null;
}): Promise<void> {
    await prisma.auditLog.create({
        data: {
            userId: params.userId,
            action: params.action,
            tableName: params.tableName,
            recordId: params.recordId,
            before: params.before as any,
            after: params.after as any,
            ipAddress: params.ipAddress ?? null,
        },
    });
}
