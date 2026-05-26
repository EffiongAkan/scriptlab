/**
 * A client-side rate limiter using localStorage.
 * It tracks timestamps of specific actions to prevent spamming.
 */

interface RateLimitConfig {
  maxRequests: number;
  timeWindowMs: number; // e.g. 60000 for 1 minute
}

export class ClientRateLimiter {
  private keyPrefix: string;
  private config: RateLimitConfig;

  constructor(keyPrefix: string, config: RateLimitConfig) {
    this.keyPrefix = `rate_limit_${keyPrefix}`;
    this.config = config;
  }

  /**
   * Checks if an action is allowed. If so, records it.
   * @returns true if allowed, false if rate limited.
   */
  public checkAndRecord(): boolean {
    const now = Date.now();
    const history = this.getHistory();

    // Filter out old requests
    const validHistory = history.filter(
      (timestamp) => now - timestamp < this.config.timeWindowMs
    );

    if (validHistory.length >= this.config.maxRequests) {
      // Save cleaned up history even if rejected
      this.saveHistory(validHistory);
      return false; // Rate limited
    }

    // Allowed, add new timestamp
    validHistory.push(now);
    this.saveHistory(validHistory);
    return true;
  }

  private getHistory(): number[] {
    try {
      const data = localStorage.getItem(this.keyPrefix);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map(Number).filter((n) => !isNaN(n));
      }
    } catch (e) {
      // Ignore parse errors
    }
    return [];
  }

  private saveHistory(history: number[]) {
    try {
      localStorage.setItem(this.keyPrefix, JSON.stringify(history));
    } catch (e) {
      // In case of quota exceeded, we can't save history, so we might fail open or closed.
      // Usually failing open is better for UX, but it defeats the rate limiter if they spam until storage is full.
    }
  }
}
