const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_ATTEMPTS = 5;

export class LoginRateLimiter {
  private readonly windowMs: number;
  private readonly maxAttempts: number;
  private attemptsByKey = new Map<string, number[]>();

  constructor(windowMs: number = DEFAULT_WINDOW_MS, maxAttempts: number = DEFAULT_MAX_ATTEMPTS) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
  }

  recordAttempt(key: string, now: number = Date.now()): boolean {
    const recentAttempts = (this.attemptsByKey.get(key) ?? []).filter(
      (timestamp) => now - timestamp < this.windowMs,
    );

    if (recentAttempts.length >= this.maxAttempts) {
      this.attemptsByKey.set(key, recentAttempts);
      return false;
    }

    recentAttempts.push(now);
    this.attemptsByKey.set(key, recentAttempts);
    return true;
  }
}
