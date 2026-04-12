import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/business-hours
 * Returns current business hours configuration + whether it's currently open.
 * No authentication required.
 */
export async function GET() {
    try {
        const start = await getSetting<string>('business_hours_start', '09:00');
        const end = await getSetting<string>('business_hours_end', '18:00');
        const daysRaw = await getSetting<string>('business_days', '[1,2,3,4,5]');

        let days: number[];
        try {
            days = JSON.parse(typeof daysRaw === 'string' ? daysRaw : JSON.stringify(daysRaw));
        } catch {
            days = [1, 2, 3, 4, 5]; // fallback: Mon-Fri
        }

        // Business hours check in Asia/Taipei timezone
        const now = new Date();
        const taipeiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
        const currentDay = taipeiTime.getDay(); // 0=Sun, 1=Mon ... 6=Sat
        // Convert JS getDay (0=Sun) to ISO (1=Mon, 7=Sun)
        const isoDay = currentDay === 0 ? 7 : currentDay;

        const currentTimeStr = taipeiTime.toTimeString().slice(0, 5); // "HH:MM"
        const isDayOpen = days.includes(isoDay);
        const isTimeOpen = currentTimeStr >= start && currentTimeStr < end;
        const isOpen = isDayOpen && isTimeOpen;

        // Build human-readable hours string
        const dayNames = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'];
        const sortedDays = [...days].sort();
        let hoursStr = '';
        if (sortedDays.length > 0) {
            // Group consecutive days
            const first = dayNames[sortedDays[0]] || '';
            const last = dayNames[sortedDays[sortedDays.length - 1]] || '';
            hoursStr = first === last
                ? `${first} ${start}-${end}`
                : `${first}至${last} ${start}-${end}`;
        }

        return NextResponse.json({
            isOpen,
            hours: hoursStr,
            start,
            end,
            days,
        });
    } catch (error) {
        console.error('Business hours error:', error);
        return NextResponse.json({
            isOpen: false,
            hours: '週一至週五 09:00-18:00',
            start: '09:00',
            end: '18:00',
            days: [1, 2, 3, 4, 5],
        });
    }
}
