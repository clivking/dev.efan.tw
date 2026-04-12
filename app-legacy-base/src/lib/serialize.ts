import { Prisma } from '../generated/prisma-v7/client';

const { Decimal } = Prisma;

/**
 * Recursively converts Prisma-specific types (Date, Decimal) into plain JSON-serializable types.
 * This prevents "Plain Object" errors and hydration mismatches in Next.js.
 */
export function serializeData<T>(data: T): any {
    if (data === null || data === undefined) return data;

    if (data instanceof Date) {
        return data.toISOString();
    }

    if (data instanceof Decimal) {
        return data.toNumber();
    }

    if (Array.isArray(data)) {
        return data.map(item => serializeData(item));
    }

    if (typeof data === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = serializeData(value);
        }
        return result;
    }

    return data;
}
