import { RateLimiter } from '../../lib/rateLimiter.js';

describe('RateLimiter', () => {
  it('should allow requests within rate limit', async () => {
    const limiter = new RateLimiter({ maxPerSecond: 5 });
    const start = Date.now();
    for (let i = 0; i < 5; i++) {
      await limiter.acquire();
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('should throttle requests exceeding rate limit', async () => {
    const limiter = new RateLimiter({ maxPerSecond: 5 });
    const start = Date.now();
    for (let i = 0; i < 6; i++) {
      await limiter.acquire();
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(150);
  });

  it('should execute function through the limiter', async () => {
    const limiter = new RateLimiter({ maxPerSecond: 5 });
    const fn = jest.fn().mockResolvedValue('result');
    const result = await limiter.execute(fn);
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
