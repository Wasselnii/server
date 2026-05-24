
interface RateLimiterOptions {
    maxRequests: number;
    windowMs: number;
}

interface WindowState {
    count: number;
    resetAt: number;
}

export function createSocketRateLimiter(opts: RateLimiterOptions) {
    const windows = new Map<string, WindowState>();

    const gc = setInterval(() => {
        const now = Date.now();
        for (const [id, state] of windows) {
            if (state.resetAt < now) windows.delete(id);
        }
    }, 60_000);
    gc.unref();

    return {

        check(socketId: string): boolean {
            const now = Date.now();
            let state = windows.get(socketId);

            if (!state || state.resetAt < now) {
                state = { count: 1, resetAt: now + opts.windowMs };
                windows.set(socketId, state);
                return true;
            }

            if (state.count >= opts.maxRequests) return false;

            state.count++;
            return true;
        },

        remove(socketId: string): void {
            windows.delete(socketId);
        },
    };
}
