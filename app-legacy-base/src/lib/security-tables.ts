import { prisma } from '@/lib/prisma';

let ensureSecurityTablesPromise: Promise<void> | null = null;

export async function ensureSecurityTables(): Promise<void> {
    if (!ensureSecurityTablesPromise) {
        ensureSecurityTablesPromise = (async () => {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    id uuid PRIMARY KEY,
                    user_id uuid NOT NULL,
                    created_at timestamptz NOT NULL DEFAULT now(),
                    expires_at timestamptz NOT NULL,
                    last_seen_at timestamptz NOT NULL DEFAULT now(),
                    revoked_at timestamptz,
                    ip_address text,
                    user_agent text,
                    last_seen_ip text,
                    last_seen_user_agent text
                )
            `);
            await prisma.$executeRawUnsafe(`
                CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
                ON auth_sessions (user_id, revoked_at, expires_at DESC)
            `);
            await prisma.$executeRawUnsafe(`
                CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
                ON auth_sessions (expires_at)
            `);
        })().finally(() => {
            ensureSecurityTablesPromise = null;
        });
    }

    await ensureSecurityTablesPromise;
}
