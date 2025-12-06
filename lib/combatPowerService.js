/**
 * Combat Power Service
 *
 * Handles fetching combat power data from Nexon API and processing batches of OCIDs.
 * Designed for Vercel Hobby Plan with 10-second timeout constraint.
 */

import { getCharacterStats } from './nexonApi';

// Rate limiting delay (300ms between API calls)
const API_DELAY_MS = 300;

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
 * Process a batch of OCIDs
 *
 * @param {string[]} ocids - Array of OCIDs to process
 * @param {Map<string, {combat_power: string, updated_at: string, status: string}>} existingRecords - Existing records from Google Sheets
 * @returns {Promise<{records: Array, stats: {success: number, failed: number, notFound: number, skipped: number}, executionTimeMs: number}>}
 */
export const processBatch = async (ocids, existingRecords = new Map()) => {
  const startTime = Date.now();
  const records = [];
  const stats = {
    success: 0,
    failed: 0,
    notFound: 0,
    skipped: 0,
  };

  let apiCallCount = 0;
  for (let i = 0; i < ocids.length; i++) {
    const ocid = ocids[i];

    // Check if existing record is still fresh (within 24 hours)
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

    // Add delay between API calls (except for the first one)
    if (apiCallCount > 0) {
      await delay(API_DELAY_MS);
    }
    apiCallCount++;

    const record = await fetchWithRetry(ocid);
    records.push(record);

    // Update stats
    switch (record.status) {
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

  const executionTimeMs = Date.now() - startTime;

  console.log(
    `📊 Batch stats: ${stats.success} success, ${stats.failed} failed, ${stats.notFound} not found, ${stats.skipped} skipped`
  );

  return {
    records,
    stats,
    executionTimeMs,
  };
};
