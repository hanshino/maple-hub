/**
 * Unified Refresh-All Cron API
 *
 * GET /api/cron/refresh-all
 *
 * Replaces both `combat-power-refresh` and `update-character-info` into a single
 * endpoint. Fetches combat power and basic info for batches of OCIDs in parallel,
 * then upserts both datasets to Google Sheets.
 *
 * Uses an internal while loop instead of chain calls to avoid re-reading sheets
 * on every batch. Reads all data once at the start, processes batches in a loop,
 * and stops when time budget is exceeded.
 *
 * Query Parameters:
 * - offset (number, default: 0): Starting index for OCID pagination
 * - batchSize (number, default: 50, max: 50): Number of OCIDs to process per batch
 *
 * Headers:
 * - Authorization: Bearer <CRON_SECRET> (required)
 *
 * Response:
 * {
 *   success: boolean,
 *   processed: number,
 *   offset: number,
 *   batchSize: number,
 *   nextOffset: number | null,
 *   totalCount: number,
 *   hasMore: boolean,
 *   stats: { success, failed, notFound, skipped },
 *   stoppedReason: string | undefined,
 *   executionTimeMs: number,
 *   timestamp: string
 * }
 */

import GoogleSheetsClient from '../../../../lib/googleSheets';
import { processBatch } from '../../../../lib/combatPowerService';

const MAX_BATCH_SIZE = 50;
const DEFAULT_BATCH_SIZE = 50;
const TIMEOUT_BUDGET_MS = 7000; // 7s budget, 3s buffer for Vercel 10s

/**
 * Validate authorization header
 * @param {Request} request
 * @returns {boolean}
 */
const validateAuth = (request) => {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
};

/**
 * Parse query parameters
 * @param {Request} request
 * @returns {{ offset: number, batchSize: number }}
 */
const parseParams = (request) => {
  const url = new URL(request.url);

  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  let batchSize = parseInt(
    url.searchParams.get('batchSize') || String(DEFAULT_BATCH_SIZE),
    10
  );

  // Cap batch size to prevent timeout
  batchSize = Math.min(batchSize, MAX_BATCH_SIZE);

  return { offset, batchSize };
};

export async function GET(request) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[RefreshAll] Starting at ${timestamp}`);

  // Validate authorization
  if (!validateAuth(request)) {
    console.warn('[RefreshAll] Unauthorized request');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { offset, batchSize } = parseParams(request);
    console.log(
      `[RefreshAll] Params: offset=${offset}, batchSize=${batchSize}`
    );

    // Initialize Google Sheets client
    const sheetsClient = new GoogleSheetsClient();

    // === Single read phase: fetch all data once ===
    const [
      { ocids: allOcids, totalCount },
      existingRecords,
      existingCharacterInfoData,
    ] = await Promise.all([
      sheetsClient.getAllOcids(0, Infinity),
      sheetsClient.getExistingCombatPowerRecords(),
      sheetsClient.getAllCharacterInfoData(),
    ]);

    console.log(
      `[RefreshAll] Loaded ${allOcids.length} OCIDs, ${existingRecords.size} combat power records, ${existingCharacterInfoData.length} character info rows`
    );

    // Slice from offset
    const ocidsToProcess = allOcids.slice(offset);

    // If no OCIDs to process
    if (ocidsToProcess.length === 0) {
      console.log('[RefreshAll] No OCIDs to process');
      return Response.json({
        success: true,
        processed: 0,
        offset,
        batchSize,
        nextOffset: null,
        totalCount,
        hasMore: false,
        stats: { success: 0, failed: 0, notFound: 0, skipped: 0 },
        executionTimeMs: Date.now() - startTime,
        timestamp,
      });
    }

    // === Internal loop: process batches until time budget exhausted ===
    const mergedStats = { success: 0, failed: 0, notFound: 0, skipped: 0 };
    const allRecords = [];
    const allCharacterInfoRecords = [];
    let currentOffset = 0; // relative to ocidsToProcess
    let stoppedReason;

    // Build a mutable copy of existingCharacterInfoData for accumulating inserts
    const charInfoData = existingCharacterInfoData.length > 0
      ? existingCharacterInfoData.map(row => [...row])
      : [
          [
            'ocid',
            'character_name',
            'character_level',
            'character_image',
            'world_name',
            'character_class',
            'cached_at',
          ],
        ];

    // Build a mutable existingRecords map (for accumulating updates across batches)
    // The original existingRecords map is already mutable, we'll update it in-place

    while (currentOffset < ocidsToProcess.length) {
      // Time budget check before starting a new batch
      if (Date.now() - startTime >= TIMEOUT_BUDGET_MS) {
        stoppedReason = 'timeout';
        console.log('[RefreshAll] Time budget exceeded, stopping loop');
        break;
      }

      const batchOcids = ocidsToProcess.slice(
        currentOffset,
        currentOffset + batchSize
      );

      console.log(
        `[RefreshAll] Processing batch: offset=${offset + currentOffset}, size=${batchOcids.length}`
      );

      const { records, characterInfoRecords, stats } = await processBatch(
        batchOcids,
        existingRecords
      );

      // Accumulate results
      allRecords.push(...records);
      allCharacterInfoRecords.push(...characterInfoRecords);
      mergedStats.success += stats.success;
      mergedStats.failed += stats.failed;
      mergedStats.notFound += stats.notFound;
      mergedStats.skipped += stats.skipped;

      // Build combatPowerExistingData from current existingRecords for upsert
      const combatPowerExistingData = [
        ['ocid', 'combat_power', 'updated_at', 'status', 'not_found_count'],
        ...Array.from(existingRecords.entries()).map(([ocid, r]) => [
          ocid,
          r.combat_power,
          r.updated_at,
          r.status,
          String(r.not_found_count || 0),
        ]),
      ];

      // Upsert combat power records for this batch
      await sheetsClient.upsertCombatPowerRecords(
        records,
        combatPowerExistingData
      );

      // Update in-memory existingRecords with newly processed records
      for (const record of records) {
        existingRecords.set(record.ocid, {
          combat_power: record.combat_power,
          updated_at: record.updated_at,
          status: record.status,
          not_found_count: record.not_found_count || 0,
        });
      }

      // Upsert character info records for this batch
      if (characterInfoRecords.length > 0) {
        await sheetsClient.upsertCharacterInfoCache(
          characterInfoRecords,
          charInfoData
        );

        // Update in-memory charInfoData with newly processed records
        const charInfoOcidIndex = new Map();
        for (let i = 1; i < charInfoData.length; i++) {
          if (charInfoData[i][0]) {
            charInfoOcidIndex.set(charInfoData[i][0], i);
          }
        }

        for (const rec of characterInfoRecords) {
          const rowData = [
            rec.ocid,
            rec.character_name || '',
            rec.character_level?.toString() || '',
            rec.character_image || '',
            rec.world_name || '',
            rec.character_class || '',
            rec.cached_at || new Date().toISOString(),
          ];
          const existingIdx = charInfoOcidIndex.get(rec.ocid);
          if (existingIdx !== undefined) {
            charInfoData[existingIdx] = rowData;
          } else {
            charInfoData.push(rowData);
            charInfoOcidIndex.set(rec.ocid, charInfoData.length - 1);
          }
        }
      }

      currentOffset += batchSize;
    }

    console.log(
      `[RefreshAll] Loop finished - processed ${allRecords.length} records total`
    );

    // Auto-remove OCIDs that have been not_found 3+ consecutive times
    let removedCount = 0;
    const ocidsToRemove = allRecords
      .filter((r) => (r.not_found_count || 0) >= 3)
      .map((r) => r.ocid);

    if (ocidsToRemove.length > 0) {
      console.log(
        `[RefreshAll] Removing ${ocidsToRemove.length} invalid OCIDs (not_found_count >= 3)...`
      );
      await sheetsClient.removeOcids(ocidsToRemove);
      removedCount = ocidsToRemove.length;
    }

    // Calculate nextOffset (absolute, relative to allOcids)
    const absoluteProcessedEnd = offset + currentOffset;
    const hasMore = absoluteProcessedEnd < totalCount;
    const nextOffset = hasMore ? absoluteProcessedEnd : null;

    const totalExecutionTime = Date.now() - startTime;
    console.log(
      `[RefreshAll] Completed in ${totalExecutionTime}ms. Processed: ${allRecords.length}`
    );

    const response = {
      success: true,
      processed: allRecords.length,
      removed: removedCount,
      offset,
      batchSize,
      nextOffset,
      totalCount,
      hasMore,
      stats: mergedStats,
      executionTimeMs: totalExecutionTime,
      timestamp,
    };

    if (stoppedReason) {
      response.stoppedReason = stoppedReason;
    }

    return Response.json(response);
  } catch (error) {
    console.error('[RefreshAll] Error:', error);

    return Response.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        timestamp,
      },
      { status: 500 }
    );
  }
}
