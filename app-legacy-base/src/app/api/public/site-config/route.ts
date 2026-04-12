import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';
import { getCompanyInfo } from '@/lib/company';
import { getCategoryTree } from '@/lib/category-tree';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/site-config
 * Returns public configuration for the frontend (no secrets).
 */
export async function GET() {
    try {
        const skipTurnstile = process.env.EFAN_SKIP_TURNSTILE === 'true';
        const [turnstileEnabled, turnstileSiteKey, company, categories] = await Promise.all([
            getSetting('turnstile_enabled', true),
            getSetting('turnstile_site_key', ''),
            getCompanyInfo(),
            getCategoryTree(),
        ]);

        return NextResponse.json({
            turnstileEnabled: !skipTurnstile && turnstileEnabled && !!turnstileSiteKey,
            turnstileSiteKey: skipTurnstile ? null : (turnstileSiteKey || null),
            company,
            categories,
        });
    } catch (error) {
        console.error('[site-config] Error:', error);
        return NextResponse.json({
            turnstileEnabled: false,
            turnstileSiteKey: null,
            company: null,
            categories: [],
        });
    }
}
