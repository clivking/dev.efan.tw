import { getSetting } from '@/lib/settings';

/**
 * Verify Cloudflare Turnstile token.
 * Returns true if verification passes or if Turnstile is not configured.
 */
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
    if (process.env.EFAN_SKIP_TURNSTILE === 'true') {
        console.log('[Turnstile] Skipping verification in old local environment');
        return true;
    }

    const secret = await getSetting('turnstile_secret_key', '');
    
    // Not configured → skip verification
    if (!secret) {
        console.log('[Turnstile] No secret key configured, skipping');
        return true;
    }
    
    // No token provided → log and fail
    if (!token) {
        console.warn('[Turnstile] No token provided by client');
        return false;
    }

    console.log('[Turnstile] Verifying token:', token.substring(0, 20) + '...');

    try {
        const response = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret, response: token }),
            }
        );
        const data = await response.json();
        console.log('[Turnstile] Result:', JSON.stringify(data));
        return data.success === true;
    } catch (err) {
        console.error('[Turnstile] Network error:', err);
        // Fail closed — do not allow through on network error
        return false;
    }
}
