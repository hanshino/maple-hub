/**
 * Token-bucket rate limiter for Nexon API calls.
 * All API calls (character sync, guild sync, cron) must go through this.
 */
export class RateLimiter {
  constructor({ maxPerSecond = 5 } = {}) {
    this.maxTokens = maxPerSecond;
    this.tokens = maxPerSecond;
    this.interval = 1000 / maxPerSecond;
    this.lastRefill = Date.now();
  }

  async acquire() {
    while (this.tokens < 1) {
      const now = Date.now();
      const elapsed = now - this.lastRefill;
      const newTokens = elapsed / this.interval;

      if (newTokens >= 1) {
        this.tokens = Math.min(this.maxTokens, this.tokens + Math.floor(newTokens));
        this.lastRefill = now;
      }

      if (this.tokens < 1) {
        const waitTime = this.interval - (Date.now() - this.lastRefill);
        await new Promise(resolve => setTimeout(resolve, Math.max(waitTime, 10)));
      }
    }

    this.tokens -= 1;
  }

  async execute(fn) {
    await this.acquire();
    return fn();
  }
}

let globalLimiter;

export function getGlobalRateLimiter() {
  if (!globalLimiter) {
    globalLimiter = new RateLimiter({ maxPerSecond: 5 });
  }
  return globalLimiter;
}
