/**
 * Utility to identify if the current process is a Next.js build phase.
 * This helps prevent accidental database connections during static page generation.
 */

export function isBuildPhase(): boolean {
    return (
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.IS_BUILD_PHASE === 'true'
    );
}

/**
 * Executes a function and returns its result, OR returns a fallback if we are in the build phase.
 * This is the primary guard for Layouts and Metadata generators.
 */
export async function withBuildFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    if (isBuildPhase()) {
        console.log('[Build Guard] Static generation detected, returning fallback value.');
        return fallback;
    }

    try {
        return await fn();
    } catch (error) {
        console.error('[Build Guard] Execution failed, using fallback:', error);
        return fallback;
    }
}
