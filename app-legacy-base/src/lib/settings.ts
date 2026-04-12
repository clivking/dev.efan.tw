import { prisma } from '@/lib/prisma';
import { decrypt, encrypt } from '@/lib/encryption';

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
    try {
        const setting = await prisma.setting.findUnique({ where: { key } });
        return parseSettingValue(setting, fallback);
    } catch (error) {
        console.error(`Failed to read setting "${key}", using fallback:`, error);
        return fallback;
    }
}

export async function getSettings(keys: string[]): Promise<Record<string, any>> {
    try {
        const settings = await prisma.setting.findMany({
            where: { key: { in: keys } }
        });
        
        const result: Record<string, any> = {};
        settings.forEach(s => {
            result[s.key] = parseSettingValue(s, null);
        });
        return result;
    } catch (error) {
        console.error(`Failed to batch read settings:`, error);
        return {};
    }
}

function parseSettingValue<T>(setting: any, fallback: T): T {
    if (!setting) return fallback;

    switch (setting.type) {
        case 'number':
            return Number(setting.value) as T;
        case 'boolean':
            return (setting.value === 'true') as T;
        case 'json':
            try {
                return JSON.parse(setting.value) as T;
            } catch {
                return setting.value as unknown as T;
            }
        case 'encrypted':
            if (!setting.value || !setting.value.includes(':')) return setting.value as T;
            return decrypt(setting.value) as T;
        case 'string':
        default:
            return setting.value as T;
    }
}

export async function setSetting(
    key: string,
    value: unknown,
    type: 'string' | 'number' | 'boolean' | 'json' | 'encrypted'
): Promise<void> {
    let storedValue: string;

    switch (type) {
        case 'number':
        case 'boolean':
            storedValue = String(value);
            break;
        case 'json':
            storedValue = JSON.stringify(value);
            break;
        case 'encrypted':
            storedValue = encrypt(String(value));
            break;
        default:
            storedValue = String(value);
    }

    await prisma.setting.upsert({
        where: { key },
        update: { value: storedValue, updatedAt: new Date() },
        create: { key, value: storedValue, type, category: 'unknown' },
    });
}
