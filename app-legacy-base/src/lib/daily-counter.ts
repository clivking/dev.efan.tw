import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';

export async function getNextNumber(type: 'customer' | 'quote'): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const startSequence =
        type === 'customer'
            ? await getSetting('customer_start_sequence', 1)
            : await getSetting('quote_start_sequence', 6);

    const counter = await prisma.dailyCounter.upsert({
        where: {
            date_type: {
                date: new Date(today.toISOString().slice(0, 10)),
                type,
            },
        },
        update: {
            currentValue: { increment: 1 },
        },
        create: {
            date: new Date(today.toISOString().slice(0, 10)),
            type,
            currentValue: startSequence,
        },
    });

    if (type === 'customer') {
        const seq = String(counter.currentValue).padStart(2, '0');
        return `${dateStr}-C${seq}`;
    } else {
        const seq = String(counter.currentValue).padStart(3, '0');
        return `${dateStr}-${seq}`;
    }
}
