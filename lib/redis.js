import Redis from 'ioredis';

let redis;

export function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.connect().catch(err => {
      console.error('Redis connection error:', err.message);
    });
  }
  return redis;
}

const KEY_PREFIX = 'maple:';

// Generic cache operations
export async function getCached(key) {
  const r = getRedis();
  const val = await r.get(KEY_PREFIX + key);
  return val ? JSON.parse(val) : null;
}

export async function setCache(key, data, ttlSeconds) {
  const r = getRedis();
  await r.set(KEY_PREFIX + key, JSON.stringify(data), 'EX', ttlSeconds);
}

export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
