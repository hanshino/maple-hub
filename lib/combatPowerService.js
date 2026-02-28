/**
 * Combat Power Service
 *
 * Handles fetching combat power data from Nexon API and processing batches of OCIDs.
 * Designed for Vercel Hobby Plan with 10-second timeout constraint.
 */

import { getCharacterStats, getCharacterBasicInfo } from './nexonApi';

// Parallel concurrency limit
const CONCURRENCY = 10;

// Exponential backoff settings for retries
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 500;

/**
 * Delay helper function
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch combat power for a single OCID
 *
 * @param {string} ocid - The OCID to fetch combat power for
 * @returns {Promise<{ocid: string, combat_power: string, updated_at: string, status: string}>}
 */
export const fetchCombatPower = async ocid => {
  const timestamp = new Date().toISOString();

  try {
    const stats = await getCharacterStats(ocid);

    // Find combat power stat (戰鬥力)
    const combatPowerStat = stats?.final_stat?.find(
      stat => stat.stat_name === '戰鬥力'
    );

    if (!combatPowerStat) {
      return {
        ocid,
        combat_power: '0',
        updated_at: timestamp,
        status: 'not_found',
      };
    }

    return {
      ocid,
      combat_power: combatPowerStat.stat_value,
      updated_at: timestamp,
      status: 'success',
    };
  } catch (error) {
    // Check if it's a 404 (character not found)
    if (error.message?.includes('404') || error.response?.status === 404) {
      return {
        ocid,
        combat_power: '0',
        updated_at: timestamp,
        status: 'not_found',
      };
    }

    // For other errors, return error status
    return {
      ocid,
      combat_power: '0',
      updated_at: timestamp,
      status: 'error',
    };
  }
};

/**
 * Fetch combat power with retry logic using exponential backoff
 *
 * @param {string} ocid - The OCID to fetch combat power for
 * @returns {Promise<{ocid: string, combat_power: string, updated_at: string, status: string}>}
 */
const fetchWithRetry = async ocid => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fetchCombatPower(ocid);

      // Only retry on error status, not on not_found or success
      if (result.status !== 'error' || attempt === MAX_RETRIES) {
        return result;
      }

      // Wait with exponential backoff before retry
      const backoffDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
      await delay(backoffDelay);
    } catch (_error) {
      // Error is logged implicitly via retry mechanism
      if (attempt < MAX_RETRIES) {
        const backoffDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await delay(backoffDelay);
      }
    }
  }

  // If all retries failed, return error status
  return {
    ocid,
    combat_power: '0',
    updated_at: new Date().toISOString(),
    status: 'error',
  };
};

// 24 hours in milliseconds
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Check if a record is still fresh (updated within 24 hours)
 * @param {string} updatedAt - ISO timestamp string
 * @returns {boolean}
 */
const isRecordFresh = updatedAt => {
  if (!updatedAt) return false;
  const updatedTime = new Date(updatedAt).getTime();
  const now = Date.now();
  return now - updatedTime < CACHE_DURATION_MS;
};

/**
 * Fetch character basic info safely (returns null on error)
 *
 * @param {string} ocid - The OCID to fetch basic info for
 * @returns {Promise<{ocid: string, character_name: string, character_level: number, character_image: string, world_name: string, character_class: string, cached_at: string}|null>}
 */
const fetchCharacterInfoSafe = async ocid => {
  try {
    const info = await getCharacterBasicInfo(ocid);
    return {
      ocid,
      character_name: info.character_name,
      character_level: info.character_level,
      character_image: info.character_image,
      world_name: info.world_name,
      character_class: info.character_class,
      cached_at: new Date().toISOString(),
    };
  } catch (_error) {
    return null;
  }
};

/**
 * Process a single OCID — fetch combat power and basic info in parallel
 *
 * @param {string} ocid - The OCID to process
 * @returns {Promise<{combatRecord: object, infoRecord: object|null}>}
 */
const processOneOcid = async ocid => {
  const [combatRecord, infoRecord] = await Promise.all([
    fetchWithRetry(ocid),
    fetchCharacterInfoSafe(ocid),
  ]);
  return { combatRecord, infoRecord };
};

/**
 * Process a batch of OCIDs in parallel groups
 *
 * @param {string[]} ocids - Array of OCIDs to process
 * @param {Map<string, {combat_power: string, updated_at: string, status: string}>} existingRecords - Existing records from Google Sheets
 * @returns {Promise<{records: Array, characterInfoRecords: Array, stats: {success: number, failed: number, notFound: number, skipped: number}, executionTimeMs: number}>}
 */
export const processBatch = async (ocids, existingRecords = new Map()) => {
  const startTime = Date.now();
  const records = [];
  const characterInfoRecords = [];
  const stats = {
    success: 0,
    failed: 0,
    notFound: 0,
    skipped: 0,
  };

  // Filter out fresh records
  const toProcess = [];
  for (const ocid of ocids) {
    const existing = existingRecords.get(ocid);
    if (
      existing &&
      existing.status === 'success' &&
      isRecordFresh(existing.updated_at)
    ) {
      console.log(`⏭️ Skipping ${ocid} - updated within 24 hours`);
      stats.skipped++;
      continue;
    }
    toProcess.push(ocid);
  }

  // Process in parallel groups of CONCURRENCY
  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const chunk = toProcess.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(processOneOcid));

    for (const { combatRecord, infoRecord } of results) {
      // Compute not_found_count based on existing records
      if (combatRecord.status === 'not_found') {
        const existing = existingRecords.get(combatRecord.ocid);
        const prevCount = existing?.not_found_count || 0;
        combatRecord.not_found_count = prevCount + 1;
      } else if (combatRecord.status === 'success') {
        combatRecord.not_found_count = 0;
      }

      records.push(combatRecord);

      if (infoRecord) {
        characterInfoRecords.push(infoRecord);
      }

      // Update stats
      switch (combatRecord.status) {
        case 'success':
          stats.success++;
          break;
        case 'not_found':
          stats.notFound++;
          break;
        case 'error':
          stats.failed++;
          break;
      }
    }
  }

  const executionTimeMs = Date.now() - startTime;

  console.log(
    `📊 Batch stats: ${stats.success} success, ${stats.failed} failed, ${stats.notFound} not found, ${stats.skipped} skipped`
  );

  return {
    records,
    characterInfoRecords,
    stats,
    executionTimeMs,
  };
};
