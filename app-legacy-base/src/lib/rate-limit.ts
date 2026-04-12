/**
 * Shared in-memory rate-limiter with lazy cleanup.
 * Use `createRateLimiter()` to get a per-route limiter instance.
 *
 * Note: In-memory rate limiting is per-process. If running multiple
 * container instances, each has its own rate-limit state. For this
 * application (small admin team, low traffic), this is acceptable.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

/**
 * Creates a rate limiter function.
 * @param maxRequests Maximum requests allowed within the time window.
 * @param windowMs Time window in milliseconds (default: 60_000 = 1 minute).
 * @returns A function that takes an IP string and returns true if allowed, false if rate-limited.
 */
export function createRateLimiter(maxRequests: number, windowMs: number = 60_000) {
    const map = new Map<string, RateLimitEntry>();

    return function checkRateLimit(ip: string): boolean {
        const now = Date.now();

        // Lazy cleanup: remove expired entries on every call
        // This avoids the need for setInterval timers which can stack
        // during hot-reload or in serverless environments.
        for (const [key, entry] of map) {
            if (now > entry.resetAt) {
                map.delete(key);
            }
        }

        const entry = map.get(ip);
        if (!entry || now > entry.resetAt) {
            map.set(ip, { count: 1, resetAt: now + windowMs });
            return true;
        }

        if (entry.count >= maxRequests) return false;
        entry.count++;
        return true;
    };
}
