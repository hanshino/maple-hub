import { getCharacterBasicInfo } from './nexonApi.js';
import {
  getMembersWithoutSnapshot,
  batchUpsertExpSnapshots,
} from './db/guildQueries.js';
import { getRedis, KEY_PREFIX } from './redis.js';
import { getGlobalRateLimiter } from './rateLimiter.js';

const BACKFILL_STATUS_TTL = 600; // 10 minutes

function backfillStatusKey(oguildId) {
  return `${KEY_PREFIX}guild:exp-backfill:${oguildId}`;
}

export async function getBackfillStatus(oguildId) {
  const redis = getRedis();
  const status = await redis.hgetall(backfillStatusKey(oguildId));
  if (!status || !status.total) return null;
  return {
    total: parseInt(status.total, 10),
    done: parseInt(status.done || '0', 10),
    failed: parseInt(status.failed || '0', 10),
    inProgress: status.inProgress === 'true',
  };
}

async function setBackfillStatus(oguildId, data) {
  const redis = getRedis();
  const key = backfillStatusKey(oguildId);
  await redis.hmset(key, {
    total: String(data.total),
    done: String(data.done),
    failed: String(data.failed),
    inProgress: String(data.inProgress),
  });
  await redis.expire(key, BACKFILL_STATUS_TTL);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Start background backfill for missing historical snapshots.
 * Fetches data for dates 7 and 30 days ago.
 */
export async function startExpBackfill(oguildId) {
  const existing = await getBackfillStatus(oguildId);
  if (existing?.inProgress) return existing;

  const now = new Date();
  const date7 = formatDate(new Date(now - 7 * 86400000));
  const date30 = formatDate(new Date(now - 30 * 86400000));

  // Find members missing snapshots for each date
  const [missing7, missing30] = await Promise.all([
    getMembersWithoutSnapshot(oguildId, date7),
    getMembersWithoutSnapshot(oguildId, date30),
  ]);

  // Deduplicate: build a map of { ocid: [dates to fetch] }
  const tasks = new Map();
  for (const m of missing7) {
    if (!tasks.has(m.ocid)) tasks.set(m.ocid, { ocid: m.ocid, dates: [] });
    tasks.get(m.ocid).dates.push(date7);
  }
  for (const m of missing30) {
    if (!tasks.has(m.ocid)) tasks.set(m.ocid, { ocid: m.ocid, dates: [] });
    tasks.get(m.ocid).dates.push(date30);
  }

  const totalCalls = [...tasks.values()].reduce(
    (sum, t) => sum + t.dates.length,
    0
  );

  if (totalCalls === 0) {
    return { total: 0, done: 0, failed: 0, inProgress: false };
  }

  const status = { total: totalCalls, done: 0, failed: 0, inProgress: true };
  await setBackfillStatus(oguildId, status);

  backfillInBackground(oguildId, tasks).catch(err =>
    console.error(`Exp backfill error for ${oguildId}:`, err)
  );

  return status;
}

async function backfillInBackground(oguildId, tasks) {
  const limiter = getGlobalRateLimiter();
  let done = 0;
  let failed = 0;
  const batch = [];
  const totalCalls = [...tasks.values()].reduce(
    (sum, t) => sum + t.dates.length,
    0
  );

  for (const { ocid, dates } of tasks.values()) {
    for (const date of dates) {
      try {
        const info = await limiter.execute(() =>
          getCharacterBasicInfo(ocid, date)
        );
        batch.push({
          oguildId,
          ocid,
          snapshotDate: date,
          characterLevel: info.character_level,
          characterExpRate: info.character_exp_rate,
        });
        done++;
      } catch {
        failed++;
      }

      // Batch write every 20 snapshots
      if (batch.length >= 20) {
        await batchUpsertExpSnapshots(batch.splice(0));
      }

      // Update status every 10 calls
      if ((done + failed) % 10 === 0) {
        await setBackfillStatus(oguildId, {
          total: totalCalls,
          done,
          failed,
          inProgress: true,
        });
      }
    }
  }

  // Flush remaining batch
  if (batch.length > 0) {
    await batchUpsertExpSnapshots(batch);
  }

  await setBackfillStatus(oguildId, {
    total: totalCalls,
    done,
    failed,
    inProgress: false,
  });

  console.log(
    `Exp backfill complete for ${oguildId}: ${done} done, ${failed} failed`
  );
}
