# Quickstart: 修復 Google Sheet 重複 OCID 問題

**Feature**: 015-fix-duplicate-ocid  
**Date**: 2025-12-07

## Overview

本功能新增一個 cron API 端點，用於偵測並移除 Google Sheet 中的重複 OCID 記錄。

## Prerequisites

- Node.js 18.17+
- 已設定 Google Sheets API 憑證
- 環境變數：`CRON_SECRET`, `SPREADSHEET_ID`, Google Sheets 憑證

## Quick Implementation Guide

### 1. 新增 GoogleSheetsClient 去重方法 (`lib/googleSheets.js`)

在 `GoogleSheetsClient` class 中新增以下方法：

```javascript
/**
 * Find and optionally remove duplicate OCIDs from OCID sheet
 * @param {boolean} dryRun - If true, only report duplicates without removing
 * @returns {Promise<{totalRecords: number, duplicatesFound: number, removed: number, duplicateDetails?: Array}>}
 */
async deduplicateOcidSheet(dryRun = false) {
  try {
    console.log(`🔍 Scanning OCID sheet for duplicates (dryRun=${dryRun})...`);

    // Read all OCIDs
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'A:A',
    });

    const values = response.data.values || [];
    const ocidMap = new Map(); // ocid -> [rowIndices]

    // Skip header if exists
    const startRow = values[0]?.[0]?.toLowerCase() === 'ocid' ? 1 : 0;

    for (let i = startRow; i < values.length; i++) {
      const ocid = values[i][0];
      if (ocid && ocid.trim() !== '') {
        if (!ocidMap.has(ocid)) {
          ocidMap.set(ocid, []);
        }
        ocidMap.get(ocid).push(i + 1); // 1-based row index
      }
    }

    // Find duplicates
    const duplicateDetails = [];
    const rowsToDelete = [];

    for (const [ocid, rowIndices] of ocidMap) {
      if (rowIndices.length > 1) {
        duplicateDetails.push({ ocid, count: rowIndices.length });
        // Keep first occurrence, delete rest
        for (let i = 1; i < rowIndices.length; i++) {
          rowsToDelete.push(rowIndices[i] - 1); // Convert to 0-based for delete
        }
      }
    }

    const result = {
      totalRecords: values.length - startRow,
      duplicatesFound: duplicateDetails.length,
      removed: 0,
      duplicateDetails: dryRun ? duplicateDetails : undefined,
    };

    if (!dryRun && rowsToDelete.length > 0) {
      // Get sheet ID for Sheet1
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheetId = spreadsheet.data.sheets[0].properties.sheetId;

      // Sort descending to avoid index shift issues
      rowsToDelete.sort((a, b) => b - a);

      // Delete rows in batches
      const requests = rowsToDelete.map(rowIndex => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }));

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: { requests },
      });

      result.removed = rowsToDelete.length;
      console.log(`✅ Removed ${result.removed} duplicate OCID rows`);
    }

    return result;
  } catch (error) {
    console.error('Error deduplicating OCID sheet:', error);
    throw error;
  }
}

/**
 * Find and optionally remove duplicate OCIDs from CombatPower sheet
 * Keeps the record with the latest updated_at timestamp
 * @param {boolean} dryRun - If true, only report duplicates without removing
 * @returns {Promise<{totalRecords: number, duplicatesFound: number, removed: number, duplicateDetails?: Array}>}
 */
async deduplicateCombatPowerSheet(dryRun = false) {
  const sheetName = 'CombatPower';

  try {
    console.log(`🔍 Scanning ${sheetName} sheet for duplicates (dryRun=${dryRun})...`);

    // Get sheet metadata
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });
    const sheet = spreadsheet.data.sheets?.find(
      s => s.properties?.title === sheetName
    );

    if (!sheet) {
      console.log(`⚠️ ${sheetName} sheet not found, skipping...`);
      return { totalRecords: 0, duplicatesFound: 0, removed: 0 };
    }

    const sheetId = sheet.properties.sheetId;

    // Read all records
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:D`,
    });

    const values = response.data.values || [];
    const ocidMap = new Map(); // ocid -> [{rowIndex, updated_at, combat_power}]

    // Skip header row
    for (let i = 1; i < values.length; i++) {
      const [ocid, combat_power, updated_at, status] = values[i];
      if (ocid && ocid.trim() !== '') {
        if (!ocidMap.has(ocid)) {
          ocidMap.set(ocid, []);
        }
        ocidMap.get(ocid).push({
          rowIndex: i, // 0-based (header is row 0)
          updated_at: updated_at || '',
          combat_power: combat_power || '',
          status: status || '',
        });
      }
    }

    // Find duplicates and determine which to keep
    const duplicateDetails = [];
    const rowsToDelete = [];

    for (const [ocid, records] of ocidMap) {
      if (records.length > 1) {
        // Sort by updated_at descending (keep newest)
        records.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        const kept = records[0];

        duplicateDetails.push({
          ocid,
          count: records.length,
          kept: { updated_at: kept.updated_at, combat_power: kept.combat_power },
        });

        // Mark all except the first (newest) for deletion
        for (let i = 1; i < records.length; i++) {
          rowsToDelete.push(records[i].rowIndex);
        }
      }
    }

    const result = {
      totalRecords: values.length - 1, // Exclude header
      duplicatesFound: duplicateDetails.length,
      removed: 0,
      duplicateDetails: dryRun ? duplicateDetails : undefined,
    };

    if (!dryRun && rowsToDelete.length > 0) {
      // Sort descending to avoid index shift issues
      rowsToDelete.sort((a, b) => b - a);

      const requests = rowsToDelete.map(rowIndex => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }));

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: { requests },
      });

      result.removed = rowsToDelete.length;
      console.log(`✅ Removed ${result.removed} duplicate CombatPower rows`);
    }

    return result;
  } catch (error) {
    console.error(`Error deduplicating ${sheetName} sheet:`, error);
    throw error;
  }
}
```

### 2. 建立 API 端點 (`app/api/cron/deduplicate-ocid/route.js`)

```javascript
import { NextResponse } from 'next/server';
import GoogleSheetsClient from '../../../../lib/googleSheets';

/**
 * Validate authorization header
 */
const validateAuth = request => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
};

/**
 * GET /api/cron/deduplicate-ocid
 *
 * Query Parameters:
 * - dryRun (boolean): If true, returns statistics without making changes
 */
export async function GET(request) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Validate authorization
  if (!validateAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', timestamp },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';

    console.log(
      `[DeduplicateOcid] Starting (dryRun=${dryRun}) at ${timestamp}`
    );

    const sheetsClient = new GoogleSheetsClient();

    // Process both sheets
    const [ocidResult, combatPowerResult] = await Promise.all([
      sheetsClient.deduplicateOcidSheet(dryRun),
      sheetsClient.deduplicateCombatPowerSheet(dryRun),
    ]);

    const executionTimeMs = Date.now() - startTime;

    console.log(`[DeduplicateOcid] Completed in ${executionTimeMs}ms`);

    return NextResponse.json({
      success: true,
      dryRun,
      ocidSheet: ocidResult,
      combatPowerSheet: combatPowerResult,
      executionTimeMs,
      timestamp,
    });
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
```

### 3. 測試範例 (`__tests__/api/cron/deduplicateOcid.test.js`)

```javascript
import { GET } from '../../../app/api/cron/deduplicate-ocid/route';
import { NextRequest } from 'next/server';

// Mock GoogleSheetsClient
jest.mock('../../../lib/googleSheets', () => {
  return jest.fn().mockImplementation(() => ({
    deduplicateOcidSheet: jest.fn().mockResolvedValue({
      totalRecords: 100,
      duplicatesFound: 5,
      removed: 5,
    }),
    deduplicateCombatPowerSheet: jest.fn().mockResolvedValue({
      totalRecords: 90,
      duplicatesFound: 3,
      removed: 3,
    }),
  }));
});

describe('Deduplicate OCID API', () => {
  const CRON_SECRET = 'test-secret';

  beforeEach(() => {
    process.env.CRON_SECRET = CRON_SECRET;
  });

  test('should return 401 without authorization', async () => {
    const request = new NextRequest(
      'http://localhost/api/cron/deduplicate-ocid'
    );
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  test('should deduplicate successfully with valid auth', async () => {
    const request = new NextRequest(
      'http://localhost/api/cron/deduplicate-ocid',
      {
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      }
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.ocidSheet.removed).toBe(5);
    expect(data.combatPowerSheet.removed).toBe(3);
  });

  test('should support dryRun mode', async () => {
    const request = new NextRequest(
      'http://localhost/api/cron/deduplicate-ocid?dryRun=true',
      {
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      }
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.dryRun).toBe(true);
  });
});
```

## Usage

### Preview (Dry Run)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://your-domain.vercel.app/api/cron/deduplicate-ocid?dryRun=true"
```

### Execute Deduplication

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://your-domain.vercel.app/api/cron/deduplicate-ocid"
```

## External Cron Setup

使用 cron-job.org 或類似服務設定定期呼叫：

- **URL**: `https://your-domain.vercel.app/api/cron/deduplicate-ocid`
- **Method**: GET
- **Headers**: `Authorization: Bearer <CRON_SECRET>`
- **Schedule**: 建議每日或每週執行一次
