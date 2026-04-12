import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();

const OBSOLETE_SETTING_KEYS = [
    'remind_unviewed_days',
    'remind_viewed_unsigned_days',
    'remind_warranty_before_days',
    'remind_unpaid_days',
    'transport_free_km',
    'transport_per_km_unit',
    'transport_per_unit_fee',
    'transport_base_address',
    'hide_empty_customer_fields',
    'show_internal_note_default',
    'default_warranty_months',
    'google_maps_api_key',
    'smtp_config',
    'audit_retention_days',
    'allow_edit_signed_quote',
    'allow_edit_paid_quote',
    'dashboard_recent_limit',
    'default_variant_names',
    'default_recommended',
    'signature_required_fields',
    'signature_canvas_width',
    'signature_canvas_height',
    'telegram_notify_events',
    'warranty_start_event',
    'ai_claude_api_key',
    'ai_claude_model',
] as const;

async function main() {
    const existing = await prisma.setting.findMany({
        where: { key: { in: [...OBSOLETE_SETTING_KEYS] } },
        orderBy: { key: 'asc' },
        select: { key: true },
    });

    if (existing.length === 0) {
        console.log('No obsolete settings found.');
        return;
    }

    const deleted = await prisma.setting.deleteMany({
        where: { key: { in: existing.map((item) => item.key) } },
    });

    console.log(`Deleted ${deleted.count} obsolete settings.`);
    for (const item of existing) {
        console.log(`- ${item.key}`);
    }
}

main()
    .catch((error) => {
        console.error('Failed to clean obsolete settings:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
