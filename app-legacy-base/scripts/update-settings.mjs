import { createPrismaClient } from './prisma-client.mjs';

const prisma = createPrismaClient();

async function main() {
    const settings = [
        { key: 'smtp_host', value: '', type: 'string', category: 'api', description: 'SMTP \u4e3b\u6a5f\u4f4d\u5740' },
        { key: 'smtp_port', value: '587', type: 'number', category: 'api', description: 'SMTP \u9023\u63a5\u57e0' },
        { key: 'smtp_user', value: '', type: 'string', category: 'api', description: 'SMTP \u5e33\u865f' },
        { key: 'smtp_pass', value: '', type: 'encrypted', category: 'api', description: 'SMTP \u5bc6\u78bc' },
        { key: 'smtp_from', value: '', type: 'string', category: 'api', description: '\u5bc4\u4ef6\u8005\u4fe1\u7bb1' },
        { key: 'smtp_secure', value: 'false', type: 'boolean', category: 'api', description: '\u662f\u5426\u4f7f\u7528 SSL/TLS' },
        { key: 'gemini_api_key', value: '', type: 'encrypted', category: 'api', description: 'Google Gemini API \u91d1\u9470' },
        { key: 'ai_model', value: 'gemini-2.0-flash-exp', type: 'string', category: 'api', description: 'AI \u6a21\u578b\u540d\u7a31' },
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: {
                value: setting.value,
                type: setting.type,
                category: setting.category,
                description: setting.description,
            },
            create: setting,
        });
    }

    try {
        await prisma.setting.delete({ where: { key: 'smtp_config' } });
    } catch {
        // ignore missing setting
    }

    console.log('\u7cfb\u7d71\u8a2d\u5b9a\u66f4\u65b0\u5b8c\u6210');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
