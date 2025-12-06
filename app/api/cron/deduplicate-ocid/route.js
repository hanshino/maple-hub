/**
 * Deduplicate OCID Cron API
 *
 * GET /api/cron/deduplicate-ocid
 *
 * Detects and removes duplicate OCID records from Google Sheets:
 * - OCID Sheet (Sheet1): Keeps the first occurrence of each OCID
 * - CombatPower Sheet: Keeps the record with the latest updated_at timestamp
 *
 * Query Parameters:
 * - dryRun (boolean, default: false): If true, returns statistics without making changes
 *
 * Headers:
 * - Authorization: Bearer <CRON_SECRET> (required)
 *
 * Response:
 * {
 *   success: boolean,
 *   dryRun: boolean,
 *   ocidSheet: { totalRecords, duplicatesFound, removed, duplicateDetails? },
 *   combatPowerSheet: { totalRecords, duplicatesFound, removed, duplicateDetails? },
 *   executionTimeMs: number,
 *   timestamp: string
 * }
 */

import { NextResponse } from 'next/server';
import GoogleSheetsClient from '../../../../lib/googleSheets';

/**
 * Validate authorization header against CRON_SECRET
 * @param {Request} request
 * @returns {boolean} True if authorized
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
 * Parse query parameters from request
 * @param {Request} request
 * @returns {{ dryRun: boolean }}
 */
const parseParams = request => {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';
  return { dryRun };
};

/**
 * GET /api/cron/deduplicate-ocid
 *
 * Deduplicates OCID records from Google Sheets
 */
export async function GET(request) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[DeduplicateOcid] Starting at ${timestamp}`);

  // Validate authorization
  if (!validateAuth(request)) {
    console.warn('[DeduplicateOcid] Unauthorized request');
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        timestamp,
      },
      { status: 401 }
    );
  }

  try {
    const { dryRun } = parseParams(request);
    console.log(`[DeduplicateOcid] Params: dryRun=${dryRun}`);

    // Initialize Google Sheets client
    const sheetsClient = new GoogleSheetsClient();

    // Process both sheets independently to isolate errors
    let ocidSheetResult = null;
    let combatPowerSheetResult = null;
    let ocidSheetError = null;
    let combatPowerSheetError = null;

    // Process OCID sheet
    try {
      ocidSheetResult = await sheetsClient.deduplicateOcidSheet(dryRun);
      console.log(
        `[DeduplicateOcid] OCID sheet: ${ocidSheetResult.duplicatesFound} duplicates found, ${ocidSheetResult.removed} removed`
      );
    } catch (error) {
      console.error('[DeduplicateOcid] OCID sheet error:', error);
      ocidSheetError = error.message || 'Unknown error';
      ocidSheetResult = {
        totalRecords: 0,
        duplicatesFound: 0,
        removed: 0,
        error: ocidSheetError,
      };
    }

    // Process CombatPower sheet
    try {
      combatPowerSheetResult =
        await sheetsClient.deduplicateCombatPowerSheet(dryRun);
      console.log(
        `[DeduplicateOcid] CombatPower sheet: ${combatPowerSheetResult.duplicatesFound} duplicates found, ${combatPowerSheetResult.removed} removed`
      );
    } catch (error) {
      console.error('[DeduplicateOcid] CombatPower sheet error:', error);
      combatPowerSheetError = error.message || 'Unknown error';
      combatPowerSheetResult = {
        totalRecords: 0,
        duplicatesFound: 0,
        removed: 0,
        error: combatPowerSheetError,
      };
    }

    const executionTimeMs = Date.now() - startTime;

    // Determine overall success (both sheets processed without errors)
    const success = !ocidSheetError && !combatPowerSheetError;

    console.log(
      `[DeduplicateOcid] Completed in ${executionTimeMs}ms (success=${success}, dryRun=${dryRun})`
    );

    const response = {
      success,
      dryRun,
      ocidSheet: ocidSheetResult,
      combatPowerSheet: combatPowerSheetResult,
      executionTimeMs,
      timestamp,
    };

    // Add error details if partial failure
    if (ocidSheetError || combatPowerSheetError) {
      response.details = {
        ocidSheetError,
        combatPowerSheetError,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[DeduplicateOcid] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        timestamp,
      },
      { status: 500 }
    );
  }
}
