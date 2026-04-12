import { prisma } from '@/lib/prisma';

/**
 * Resolve a quote identifier (UUID or quoteNumber) to the actual UUID.
 * This enables admin URLs to use human-readable quoteNumber (e.g. 20260320-012)
 * while maintaining backward compatibility with existing UUID-based URLs.
 *
 * @param idOrNumber - Either a UUID (e.g. "affa2394-ddb9-4554-a281-9d40202adf6f")
 *                     or a quoteNumber (e.g. "20260320-012")
 * @returns The UUID string, or null if not found
 */
export async function resolveQuoteId(idOrNumber: string): Promise<string | null> {
    // UUID v4 pattern: 8-4-4-4-12 hex chars
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);

    if (isUUID) {
        return idOrNumber;
    }

    // It's a quoteNumber — look up the UUID
    const quote = await prisma.quote.findUnique({
        where: { quoteNumber: idOrNumber },
        select: { id: true },
    });

    return quote?.id ?? null;
}
