# Cron 刷新優化設計

## 背景

現有 cron 架構有幾個效能瓶頸：
- 串行 API call + 300ms delay，15 筆要 5s
- Google Sheets 同一 request 內重複讀取（3 次）
- 角色資訊刷新不分頁，10s 必 timeout
- 戰鬥力和角色資訊分兩個 cron，重複讀取 OCID 列表

## 約束

- Vercel Hobby Plan：10 秒 serverless timeout
- Nexon OpenAPI 上線階段：500 次/秒、2000 萬次/天
- Google Sheets 作為資料庫（本次不更換）
- 排行榜數據新鮮度：24 小時

## 設計

### 1. 並行批次處理

- `processBatch` 改用 `Promise.all` 分組並行，每組 10 個同時發
- 組與組之間不加 delay（500/s 上限很夠）
- `batchSize` 從 15 提高到 50
- 保留 `fetchWithRetry` 的 retry 邏輯，失敗不影響同組其他請求

### 2. 減少 Google Sheets 重複讀取

- `upsertCombatPowerRecords` 新增 `existingData` 參數，把已讀取的資料傳入，省掉重複讀取
- 同樣邏輯套用到 `upsertCharacterInfoCache`

### 3. 自驅動分頁（Chain Call）

- 處理完當前批次後，如果 `hasMore=true`，自己用 `fetch()` 呼叫自身下一頁
- 每個 request 控制在 7 秒內完成（留 3 秒 buffer）
- 加 `maxChainDepth` 上限（100），防止無限遞迴
- 外部 cron 只需一次 trigger

### 4. 合併戰鬥力 + 角色資訊刷新

合併成單一端點 `GET /api/cron/refresh-all?offset=0&batchSize=50`

每個角色並行 fetch 兩個 endpoint：
- `/character/basic` → 角色資訊
- `/character/stat` → 戰鬥力

一次處理完，寫入 CombatPower + CharacterInfo 兩張 sheet。

## 改動清單

| 檔案 | 改動 |
|------|------|
| `lib/combatPowerService.js` | processBatch 改並行（10 並行），同時 fetch basic + stat |
| `lib/characterInfoService.js` | 合併進 combatPowerService，不再獨立 |
| `lib/googleSheets.js` | upsert 方法接收 existingData 參數避免重複讀取 |
| `app/api/cron/refresh-all/route.js` | 新增合併後的單一 cron 端點，支援自驅動 chain call |
| `app/api/cron/combat-power-refresh/route.js` | 保留標記 deprecated |
| `app/api/cron/update-character-info/route.js` | 同上，保留標記 deprecated |

## 不動的部分

- `lib/nexonApi.js`
- `lib/googleSheets.js` 的讀取邏輯
- `app/api/leaderboard/`
- 前端
- 去重 cron

## 效能預估（100 個角色）

| | 現況 | 優化後 |
|--|------|--------|
| API calls | 200（分開跑） | 200（並行合併處理） |
| Vercel requests | ~7 次 + 1 次 timeout | 2 次 chain call |
| 總耗時 | ~65s | ~6s |
| Google Sheets 讀取 | 每次 request 3 次 | 每次 request 2 次 |

---

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize cron refresh by parallelizing API calls, reducing Google Sheets reads, merging two cron jobs into one, and adding self-driving chain calls.

**Architecture:** Single `refresh-all` endpoint replaces two separate cron jobs. Each batch processes 50 OCIDs with concurrency of 10, fetching both `/character/basic` and `/character/stat` in parallel per OCID. Self-driving chain calls handle pagination across Vercel's 10s timeout boundary.

**Tech Stack:** Next.js API routes, Google Sheets API (googleapis), Nexon OpenAPI, Jest 30

---

## Implementation Plan

### Task 1: Add `getCharacterBasicInfo` to nexonApi.js

**Files:**
- Modify: `lib/nexonApi.js`
- Test: `__tests__/lib/nexonApi.test.js` (create)

**Step 1: Write the failing test**

Create `__tests__/lib/nexonApi.test.js`:

```js
/**
 * @jest-environment node
 */

import axios from 'axios';
import { getCharacterBasicInfo, getCharacterStats } from '../../lib/nexonApi';

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

describe('nexonApi', () => {
  let mockGet;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn();
    axios.create.mockReturnValue({ get: mockGet });
  });

  describe('getCharacterBasicInfo', () => {
    it('should fetch character basic info by ocid', async () => {
      mockGet.mockResolvedValue({
        data: {
          character_name: 'TestChar',
          character_level: 275,
          character_image: 'https://img.url/char.png',
          world_name: '殺人鯨',
          character_class: '乘風破浪',
        },
      });

      // Re-import to get fresh module with mocked axios
      jest.resetModules();
      const { getCharacterBasicInfo: fn } = await import('../../lib/nexonApi');
      const result = await fn('test-ocid');

      expect(result).toEqual({
        character_name: 'TestChar',
        character_level: 275,
        character_image: 'https://img.url/char.png',
        world_name: '殺人鯨',
        character_class: '乘風破浪',
      });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/lib/nexonApi"`
Expected: FAIL — `getCharacterBasicInfo` is not exported

**Step 3: Write minimal implementation**

Add to `lib/nexonApi.js`:

```js
export const getCharacterBasicInfo = async (ocid) => {
  try {
    const response = await apiClient.get(`/character/basic?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch character basic info: ${error.message}`);
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/lib/nexonApi"`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/nexonApi.js __tests__/lib/nexonApi.test.js
git commit -m "feat: add getCharacterBasicInfo to nexonApi"
```

---

### Task 2: Refactor `processBatch` to parallel execution with combined fetch

**Files:**
- Modify: `lib/combatPowerService.js`
- Modify: `__tests__/lib/combatPowerService.test.js`

**Step 1: Write/update failing tests**

Add new tests to `__tests__/lib/combatPowerService.test.js`:

```js
// Add mock for getCharacterBasicInfo
jest.mock('../../lib/nexonApi', () => ({
  getCharacterStats: jest.fn(),
  getCharacterBasicInfo: jest.fn(),
}));

import { getCharacterBasicInfo } from '../../lib/nexonApi';

// Inside describe('processBatch')
it('should process OCIDs in parallel groups of CONCURRENCY(10)', async () => {
  const callOrder = [];
  getCharacterStats.mockImplementation(async (ocid) => {
    callOrder.push({ type: 'stat', ocid, time: Date.now() });
    return { final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }] };
  });
  getCharacterBasicInfo.mockImplementation(async (ocid) => {
    callOrder.push({ type: 'basic', ocid, time: Date.now() });
    return {
      character_name: 'Test',
      character_level: 275,
      character_image: 'img',
      world_name: '殺人鯨',
      character_class: '冒險家',
    };
  });

  const ocids = Array.from({ length: 20 }, (_, i) => `ocid${i}`);
  const result = await processBatch(ocids);

  expect(result.records).toHaveLength(20);
  expect(result.stats.success).toBe(20);
  // Verify both APIs were called for each OCID
  expect(getCharacterStats).toHaveBeenCalledTimes(20);
  expect(getCharacterBasicInfo).toHaveBeenCalledTimes(20);
});

it('should return characterInfo alongside combatPower in records', async () => {
  getCharacterStats.mockResolvedValue({
    final_stat: [{ stat_name: '戰鬥力', stat_value: '500000' }],
  });
  getCharacterBasicInfo.mockResolvedValue({
    character_name: 'Hero',
    character_level: 280,
    character_image: 'https://img.url/hero.png',
    world_name: '殺人鯨',
    character_class: '劍豪',
  });

  const result = await processBatch(['ocid1']);

  expect(result.records[0].combat_power).toBe('500000');
  expect(result.characterInfoRecords[0]).toEqual({
    ocid: 'ocid1',
    character_name: 'Hero',
    character_level: 280,
    character_image: 'https://img.url/hero.png',
    world_name: '殺人鯨',
    character_class: '劍豪',
    cached_at: expect.any(String),
  });
});

it('should still return combatPower record when basicInfo fetch fails', async () => {
  getCharacterStats.mockResolvedValue({
    final_stat: [{ stat_name: '戰鬥力', stat_value: '500000' }],
  });
  getCharacterBasicInfo.mockRejectedValue(new Error('API Error'));

  const result = await processBatch(['ocid1']);

  expect(result.records).toHaveLength(1);
  expect(result.records[0].status).toBe('success');
  expect(result.characterInfoRecords).toHaveLength(0);
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="__tests__/lib/combatPowerService"`
Expected: FAIL — `characterInfoRecords` not in result, `getCharacterBasicInfo` not called

**Step 3: Rewrite `lib/combatPowerService.js`**

```js
import { getCharacterStats, getCharacterBasicInfo } from './nexonApi';

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 500;
const CONCURRENCY = 10;

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 24 hours in milliseconds
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

const isRecordFresh = (updatedAt) => {
  if (!updatedAt) return false;
  const updatedTime = new Date(updatedAt).getTime();
  return Date.now() - updatedTime < CACHE_DURATION_MS;
};

export const fetchCombatPower = async (ocid) => {
  const timestamp = new Date().toISOString();
  try {
    const stats = await getCharacterStats(ocid);
    const combatPowerStat = stats?.final_stat?.find(
      (stat) => stat.stat_name === '戰鬥力'
    );
    if (!combatPowerStat) {
      return { ocid, combat_power: '0', updated_at: timestamp, status: 'not_found' };
    }
    return { ocid, combat_power: combatPowerStat.stat_value, updated_at: timestamp, status: 'success' };
  } catch (error) {
    if (error.message?.includes('404') || error.response?.status === 404) {
      return { ocid, combat_power: '0', updated_at: timestamp, status: 'not_found' };
    }
    return { ocid, combat_power: '0', updated_at: timestamp, status: 'error' };
  }
};

const fetchWithRetry = async (ocid) => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fetchCombatPower(ocid);
      if (result.status !== 'error' || attempt === MAX_RETRIES) return result;
      await delay(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
    } catch (_error) {
      if (attempt < MAX_RETRIES) {
        await delay(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }
  return { ocid, combat_power: '0', updated_at: new Date().toISOString(), status: 'error' };
};

const fetchCharacterInfoSafe = async (ocid) => {
  try {
    const info = await getCharacterBasicInfo(ocid);
    return {
      ocid,
      character_name: info.character_name || '',
      character_level: info.character_level || 0,
      character_image: info.character_image || '',
      world_name: info.world_name || '',
      character_class: info.character_class || '',
      cached_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch basic info for ${ocid}:`, error.message);
    return null;
  }
};

/**
 * Process a single OCID: fetch both combat power and character info in parallel
 */
const processOneOcid = async (ocid) => {
  const [combatResult, charInfo] = await Promise.all([
    fetchWithRetry(ocid),
    fetchCharacterInfoSafe(ocid),
  ]);
  return { combatResult, charInfo };
};

/**
 * Process a batch of OCIDs with parallel execution (CONCURRENCY at a time)
 */
export const processBatch = async (ocids, existingRecords = new Map()) => {
  const startTime = Date.now();
  const records = [];
  const characterInfoRecords = [];
  const stats = { success: 0, failed: 0, notFound: 0, skipped: 0 };

  // Filter out fresh records
  const toProcess = [];
  for (const ocid of ocids) {
    const existing = existingRecords.get(ocid);
    if (existing && existing.status === 'success' && isRecordFresh(existing.updated_at)) {
      stats.skipped++;
      continue;
    }
    toProcess.push(ocid);
  }

  // Process in parallel groups of CONCURRENCY
  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const chunk = toProcess.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(processOneOcid));

    for (const { combatResult, charInfo } of results) {
      records.push(combatResult);
      if (charInfo) characterInfoRecords.push(charInfo);
      switch (combatResult.status) {
        case 'success': stats.success++; break;
        case 'not_found': stats.notFound++; break;
        case 'error': stats.failed++; break;
      }
    }
  }

  return { records, characterInfoRecords, stats, executionTimeMs: Date.now() - startTime };
};
```

**Step 4: Update existing tests for new mock and return shape**

Update existing `processBatch` tests to:
- Add `getCharacterBasicInfo` mock (default returns valid data)
- Check `result.characterInfoRecords` exists

**Step 5: Run all tests**

Run: `npm test -- --testPathPattern="__tests__/lib/combatPowerService"`
Expected: PASS

**Step 6: Commit**

```bash
git add lib/combatPowerService.js __tests__/lib/combatPowerService.test.js
git commit -m "feat: parallel batch processing with combined basic+stat fetch"
```

---

### Task 3: Add `existingData` parameter to Google Sheets upsert methods

**Files:**
- Modify: `lib/googleSheets.js` (lines 322-420 `upsertCombatPowerRecords`, lines 569-675 `upsertCharacterInfoCache`)
- Modify: `__tests__/lib/googleSheets.combatPower.test.js`

**Step 1: Write failing test**

Add to `__tests__/lib/googleSheets.combatPower.test.js`:

```js
it('should use provided existingData instead of reading from sheet', async () => {
  const existingData = [
    ['ocid', 'combat_power', 'updated_at', 'status'],
    ['ocid1', '1000000', '2025-12-05T00:00:00.000Z', 'success'],
  ];

  mockSheets.spreadsheets.values.batchUpdate.mockResolvedValue({});

  const records = [
    {
      ocid: 'ocid1',
      combat_power: '2000000',
      updated_at: '2025-12-06T00:00:00.000Z',
      status: 'success',
    },
  ];

  const result = await client.upsertCombatPowerRecords(records, existingData);

  expect(result.updated).toBe(1);
  // Should NOT have called values.get since we passed existingData
  expect(mockSheets.spreadsheets.values.get).not.toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/lib/googleSheets.combatPower"`
Expected: FAIL — `values.get` is still called

**Step 3: Modify `upsertCombatPowerRecords`**

In `lib/googleSheets.js`, change signature and logic:

```js
async upsertCombatPowerRecords(records, existingData = null) {
  if (records.length === 0) {
    return { updated: 0, inserted: 0 };
  }

  const sheetName = 'CombatPower';

  try {
    // Use provided existingData or fetch from sheet
    let data = existingData;
    if (!data) {
      try {
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:D`,
        });
        data = response.data.values || [];
      } catch (_error) {
        await this.getCombatPowerSheet();
        data = [['ocid', 'combat_power', 'updated_at', 'status']];
      }
    }

    // ... rest unchanged, using `data` instead of `existingData`
```

Apply same pattern to `upsertCharacterInfoCache(records, existingData = null)`.

**Step 4: Run tests**

Run: `npm test -- --testPathPattern="__tests__/lib/googleSheets.combatPower"`
Expected: PASS (existing tests still pass since param is optional)

**Step 5: Commit**

```bash
git add lib/googleSheets.js __tests__/lib/googleSheets.combatPower.test.js
git commit -m "feat: add existingData param to upsert methods to avoid redundant reads"
```

---

### Task 4: Create `refresh-all` API route with self-driving chain call

**Files:**
- Create: `app/api/cron/refresh-all/route.js`
- Create: `__tests__/api/cron/refreshAll.test.js`

**Step 1: Write failing tests**

Create `__tests__/api/cron/refreshAll.test.js`:

```js
/**
 * @jest-environment node
 */

jest.mock('../../../../lib/googleSheets');
jest.mock('../../../../lib/combatPowerService');

import { GET } from '../../../../app/api/cron/refresh-all/route';
import GoogleSheetsClient from '../../../../lib/googleSheets';
import { processBatch } from '../../../../lib/combatPowerService';

describe('Refresh All API Route', () => {
  let mockGetAllOcids;
  let mockGetExistingCombatPowerRecords;
  let mockUpsertCombatPowerRecords;
  let mockUpsertCharacterInfoCache;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';

    mockGetAllOcids = jest.fn();
    mockGetExistingCombatPowerRecords = jest.fn().mockResolvedValue(new Map());
    mockUpsertCombatPowerRecords = jest.fn().mockResolvedValue({ updated: 0, inserted: 0 });
    mockUpsertCharacterInfoCache = jest.fn().mockResolvedValue({ updated: 0, inserted: 0 });

    GoogleSheetsClient.mockImplementation(() => ({
      getAllOcids: mockGetAllOcids,
      getExistingCombatPowerRecords: mockGetExistingCombatPowerRecords,
      upsertCombatPowerRecords: mockUpsertCombatPowerRecords,
      upsertCharacterInfoCache: mockUpsertCharacterInfoCache,
      getCharacterInfoCache: jest.fn().mockResolvedValue(new Map()),
    }));

    // Mock global fetch for chain calls (don't actually chain in tests)
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('should return 401 without auth', async () => {
    const request = new Request('http://localhost/api/cron/refresh-all');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('should use default batchSize=50', async () => {
    mockGetAllOcids.mockResolvedValue({ ocids: [], totalCount: 0, hasMore: false });

    const request = new Request('http://localhost/api/cron/refresh-all', {
      headers: { Authorization: 'Bearer test-secret' },
    });

    await GET(request);
    expect(mockGetAllOcids).toHaveBeenCalledWith(0, 50);
  });

  it('should process batch and upsert both combat power and character info', async () => {
    mockGetAllOcids.mockResolvedValue({
      ocids: ['ocid1'],
      totalCount: 1,
      hasMore: false,
    });

    processBatch.mockResolvedValue({
      records: [{ ocid: 'ocid1', combat_power: '1000000', updated_at: '2026-03-01', status: 'success' }],
      characterInfoRecords: [{ ocid: 'ocid1', character_name: 'Hero', character_level: 280, character_image: 'img', world_name: '殺人鯨', character_class: '劍豪', cached_at: '2026-03-01' }],
      stats: { success: 1, failed: 0, notFound: 0, skipped: 0 },
      executionTimeMs: 200,
    });

    const request = new Request('http://localhost/api/cron/refresh-all', {
      headers: { Authorization: 'Bearer test-secret' },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.processed).toBe(1);
    expect(mockUpsertCombatPowerRecords).toHaveBeenCalled();
    expect(mockUpsertCharacterInfoCache).toHaveBeenCalled();
  });

  it('should chain call when hasMore is true', async () => {
    mockGetAllOcids.mockResolvedValue({
      ocids: ['ocid1'],
      totalCount: 100,
      hasMore: true,
    });

    processBatch.mockResolvedValue({
      records: [{ ocid: 'ocid1', combat_power: '1000000', updated_at: '2026-03-01', status: 'success' }],
      characterInfoRecords: [{ ocid: 'ocid1', character_name: 'Hero', character_level: 280, character_image: 'img', world_name: '殺人鯨', character_class: '劍豪', cached_at: '2026-03-01' }],
      stats: { success: 1, failed: 0, notFound: 0, skipped: 0 },
      executionTimeMs: 200,
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, totalProcessed: 50 }),
    });

    const request = new Request('http://localhost/api/cron/refresh-all', {
      headers: { Authorization: 'Bearer test-secret' },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('offset=50'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-secret',
        }),
      })
    );
  });

  it('should respect maxChainDepth and stop chaining', async () => {
    mockGetAllOcids.mockResolvedValue({
      ocids: ['ocid1'],
      totalCount: 10000,
      hasMore: true,
    });

    processBatch.mockResolvedValue({
      records: [{ ocid: 'ocid1', combat_power: '1000000', updated_at: '2026-03-01', status: 'success' }],
      characterInfoRecords: [],
      stats: { success: 1, failed: 0, notFound: 0, skipped: 0 },
      executionTimeMs: 200,
    });

    const request = new Request(
      'http://localhost/api/cron/refresh-all?offset=0&chainDepth=100',
      { headers: { Authorization: 'Bearer test-secret' } }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.stoppedReason).toBe('maxChainDepth');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="__tests__/api/cron/refreshAll"`
Expected: FAIL — route file doesn't exist

**Step 3: Create `app/api/cron/refresh-all/route.js`**

```js
import GoogleSheetsClient from '../../../../lib/googleSheets';
import { processBatch } from '../../../../lib/combatPowerService';

const MAX_BATCH_SIZE = 50;
const DEFAULT_BATCH_SIZE = 50;
const MAX_CHAIN_DEPTH = 100;
const TIMEOUT_BUDGET_MS = 7000; // 7s budget, 3s buffer for Vercel 10s

const validateAuth = (request) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  return authHeader.replace('Bearer ', '') === process.env.CRON_SECRET;
};

const parseParams = (request) => {
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  let batchSize = parseInt(
    url.searchParams.get('batchSize') || String(DEFAULT_BATCH_SIZE),
    10
  );
  batchSize = Math.min(batchSize, MAX_BATCH_SIZE);
  const chainDepth = parseInt(url.searchParams.get('chainDepth') || '0', 10);
  return { offset, batchSize, chainDepth };
};

export async function GET(request) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  if (!validateAuth(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { offset, batchSize, chainDepth } = parseParams(request);

    // Check chain depth limit
    if (chainDepth >= MAX_CHAIN_DEPTH) {
      return Response.json({
        success: true,
        processed: 0,
        offset,
        stoppedReason: 'maxChainDepth',
        timestamp,
      });
    }

    const sheetsClient = new GoogleSheetsClient();

    const { ocids, totalCount, hasMore } = await sheetsClient.getAllOcids(
      offset,
      batchSize
    );

    if (ocids.length === 0) {
      return Response.json({
        success: true,
        processed: 0,
        offset,
        batchSize,
        totalCount,
        hasMore: false,
        stats: { success: 0, failed: 0, notFound: 0, skipped: 0 },
        executionTimeMs: Date.now() - startTime,
        timestamp,
      });
    }

    // Read existing records once
    const existingRecords = await sheetsClient.getExistingCombatPowerRecords();

    // Process batch (parallel fetch of basic + stat)
    const {
      records,
      characterInfoRecords,
      stats,
    } = await processBatch(ocids, existingRecords);

    // Read existing sheet data for upsert (pass to avoid re-reading)
    // Build existingData from existingRecords map for combat power
    const combatPowerExistingData = [
      ['ocid', 'combat_power', 'updated_at', 'status'],
      ...Array.from(existingRecords.entries()).map(([ocid, r]) => [
        ocid,
        r.combat_power,
        r.updated_at,
        r.status,
      ]),
    ];

    // Upsert both sheets
    if (records.length > 0) {
      await sheetsClient.upsertCombatPowerRecords(
        records,
        combatPowerExistingData
      );
    }
    if (characterInfoRecords.length > 0) {
      await sheetsClient.upsertCharacterInfoCache(characterInfoRecords);
    }

    const executionTimeMs = Date.now() - startTime;

    // Self-driving chain call if there's more data and we have time budget
    if (hasMore && executionTimeMs < TIMEOUT_BUDGET_MS) {
      const nextOffset = offset + batchSize;
      const baseUrl = new URL(request.url);
      baseUrl.searchParams.set('offset', String(nextOffset));
      baseUrl.searchParams.set('chainDepth', String(chainDepth + 1));

      try {
        const chainResponse = await fetch(baseUrl.toString(), {
          method: 'GET',
          headers: {
            Authorization: request.headers.get('Authorization'),
          },
        });

        if (chainResponse.ok) {
          const chainData = await chainResponse.json();
          // Merge stats from chain
          return Response.json({
            success: true,
            processed: records.length + (chainData.processed || 0),
            offset,
            batchSize,
            totalCount,
            hasMore: chainData.hasMore ?? false,
            stats: {
              success: stats.success + (chainData.stats?.success || 0),
              failed: stats.failed + (chainData.stats?.failed || 0),
              notFound: stats.notFound + (chainData.stats?.notFound || 0),
              skipped: stats.skipped + (chainData.stats?.skipped || 0),
            },
            executionTimeMs: Date.now() - startTime,
            timestamp,
          });
        }
      } catch (chainError) {
        console.error('Chain call failed:', chainError.message);
      }
    }

    // Return current batch results (no chain or chain failed)
    return Response.json({
      success: true,
      processed: records.length,
      offset,
      batchSize,
      nextOffset: hasMore ? offset + batchSize : null,
      totalCount,
      hasMore,
      stats,
      executionTimeMs: Date.now() - startTime,
      timestamp,
    });
  } catch (error) {
    console.error('Refresh all error:', error);
    return Response.json(
      { success: false, error: error.message, timestamp },
      { status: 500 }
    );
  }
}
```

**Step 4: Run tests**

Run: `npm test -- --testPathPattern="__tests__/api/cron/refreshAll"`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/cron/refresh-all/route.js __tests__/api/cron/refreshAll.test.js
git commit -m "feat: add unified refresh-all cron endpoint with chain call"
```

---

### Task 5: Mark old cron endpoints as deprecated

**Files:**
- Modify: `app/api/cron/combat-power-refresh/route.js`
- Modify: `app/api/cron/update-character-info/route.js`

**Step 1: Add deprecation notice to both files**

At the top of `combat-power-refresh/route.js`:
```js
/**
 * @deprecated Use /api/cron/refresh-all instead.
 * This endpoint is kept for backwards compatibility.
 */
```

Same for `update-character-info/route.js`.

**Step 2: Run existing tests to ensure nothing broke**

Run: `npm test`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add app/api/cron/combat-power-refresh/route.js app/api/cron/update-character-info/route.js
git commit -m "chore: mark old cron endpoints as deprecated"
```

---

### Task 6: Full integration test run and cleanup

**Step 1: Run all tests**

Run: `npm test`
Expected: ALL PASS

**Step 2: Run lint**

Run: `npm run lint`
Expected: PASS (fix any issues)

**Step 3: Run build**

Run: `npm run build`
Expected: PASS

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: fix lint and build issues from cron optimization"
```
