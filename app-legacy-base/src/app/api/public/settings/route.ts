import { NextRequest, NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/settings?keys=key1,key2
 * Returns a subset of public-safe settings.
 * Only whitelisted keys are returned — no sensitive data.
 */

const PUBLIC_SAFE_KEYS = new Set([
    'company_name',
    'company_phone',
    'company_email',
    'company_description',
    'completed_case_count',
    'line_qrcode_url',
    'line_official_id',
    'chat_idle_prompt_seconds',
    'chat_session_resume_minutes',
    'turnstile_site_key',
    'ai_chat_enabled',
]);

export async function GET(request: NextRequest) {
    try {
        const keysParam = request.nextUrl.searchParams.get('keys') || '';
        const requestedKeys = keysParam.split(',').filter(Boolean);

        if (requestedKeys.length === 0) {
            return NextResponse.json({ error: 'keys parameter required' }, { status: 400 });
        }

        // Only return whitelisted keys
        const result: Record<string, any> = {};
        for (const key of requestedKeys) {
            if (PUBLIC_SAFE_KEYS.has(key)) {
                result[key] = await getSetting(key, '');
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Public settings error:', error);
        return NextResponse.json({}, { status: 500 });
    }
}
