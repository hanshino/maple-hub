import Redis from 'ioredis';

let redis;

export function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.connect().catch(err => {
      console.error('Redis connection error:', err.message);
    });
  }
  return redis;
}

// OCID buffer operations
export async function bufferOcid(ocid) {
  const r = getRedis();
  await r.sadd('ocid:buffer', ocid);
}

export async function flushOcidBuffer() {
  const r = getRedis();
  const tempKey = `ocid:buffer:flush:${Date.now()}`;
  try {
    await r.rename('ocid:buffer', tempKey);
  } catch {
    return [];
  }
  const ocids = await r.smembers(tempKey);
  await r.del(tempKey);
  return ocids;
}

export async function isOcidKnown(ocid) {
  const r = getRedis();
  const exists = await r.exists(`ocid:exists:${ocid}`);
  return exists === 1;
}

export async function markOcidKnown(ocid) {
  const r = getRedis();
  await r.set(`ocid:exists:${ocid}`, '1', 'EX', 3600);
}

// Generic cache operations
export async function getCached(key) {
  const r = getRedis();
  const val = await r.get(key);
  return val ? JSON.parse(val) : null;
}

export async function setCache(key, data, ttlSeconds) {
  const r = getRedis();
  await r.set(key, JSON.stringify(data), 'EX', ttlSeconds);
}

export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
