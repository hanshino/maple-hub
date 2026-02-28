/**
 * @deprecated Use /api/cron/refresh-all instead.
 *
 * Combat Power Refresh Cron API
 *
 * GET /api/cron/combat-power-refresh
 *
 * Fetches combat power data from Nexon API for a batch of OCIDs and stores to Google Sheets.
 * Designed for Vercel Hobby Plan with 10-second timeout constraint.
 *
 * Query Parameters:
 * - offset (number, default: 0): Starting index for OCID pagination
 * - batchSize (number, default: 15, max: 20): Number of OCIDs to process per request
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
 *   stats: { success: number, failed: number, notFound: number },
 *   executionTimeMs: number,
 *   timestamp: string
 * }
 */

import GoogleSheetsClient from '../../../../lib/googleSheets';
import { processBatch } from '../../../../lib/combatPowerService';

// Maximum batch size to prevent timeout (Vercel Hobby: 10s, Pro: 60s)
// For local development, this can be higher
const MAX_BATCH_SIZE = process.env.NODE_ENV === 'development' ? 100 : 20;
const DEFAULT_BATCH_SIZE = 15;

/**
 * Validate authorization header
 * @param {Request} request
 * @returns {boolean}
 */
const validateAuth = request => {
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
const parseParams = request => {
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

  console.log(`[CombatPowerRefresh] Starting at ${timestamp}`);

  // Validate authorization
  if (!validateAuth(request)) {
    console.warn('[CombatPowerRefresh] Unauthorized request');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { offset, batchSize } = parseParams(request);
    console.log(
      `[CombatPowerRefresh] Params: offset=${offset}, batchSize=${batchSize}`
    );

    // Initialize Google Sheets client
    const sheetsClient = new GoogleSheetsClient();

    // Fetch OCIDs from Sheet1
    const { ocids, totalCount, hasMore } = await sheetsClient.getAllOcids(
      offset,
      batchSize
    );
    console.log(
      `[CombatPowerRefresh] Fetched ${ocids.length} OCIDs (total: ${totalCount}, hasMore: ${hasMore})`
    );

    // If no OCIDs to process
    if (ocids.length === 0) {
      console.log('[CombatPowerRefresh] No OCIDs to process');
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

    // Get existing records to check for fresh data
    const existingRecords = await sheetsClient.getExistingCombatPowerRecords();

    // Process batch of OCIDs
    console.log(`[CombatPowerRefresh] Processing ${ocids.length} OCIDs...`);
    const {
      records,
      stats,
      executionTimeMs: processingTimeMs,
    } = await processBatch(ocids, existingRecords);
    console.log(
      `[CombatPowerRefresh] Processing completed in ${processingTimeMs}ms - Success: ${stats.success}, Failed: ${stats.failed}, NotFound: ${stats.notFound}, Skipped: ${stats.skipped}`
    );

    // Upsert records to CombatPower sheet
    console.log('[CombatPowerRefresh] Upserting records to Google Sheets...');
    await sheetsClient.upsertCombatPowerRecords(records);

    // Calculate next offset
    const nextOffset = hasMore ? offset + batchSize : null;
    const totalExecutionTime = Date.now() - startTime;

    console.log(
      `[CombatPowerRefresh] Completed in ${totalExecutionTime}ms. Processed: ${records.length}, NextOffset: ${nextOffset}`
    );

    return Response.json({
      success: true,
      processed: records.length,
      offset,
      batchSize,
      nextOffset,
      totalCount,
      hasMore,
      stats,
      executionTimeMs: totalExecutionTime,
      timestamp,
    });
  } catch (error) {
    console.error('Combat power refresh error:', error);

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
