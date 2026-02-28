/**
 * @jest-environment node
 */

// Mock dependencies before importing
jest.mock('../../../lib/googleSheets');
jest.mock('../../../lib/combatPowerService');

import { GET } from '../../../app/api/cron/refresh-all/route';
import GoogleSheetsClient from '../../../lib/googleSheets';
import { processBatch } from '../../../lib/combatPowerService';

describe('Refresh-All Cron API Route', () => {
  let mockGetAllOcids;
  let mockGetExistingCombatPowerRecords;
  let mockGetAllCharacterInfoData;
  let mockUpsertCombatPowerRecords;
  let mockUpsertCharacterInfoCache;
  let mockRemoveOcids;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up CRON_SECRET
    process.env.CRON_SECRET = 'test-secret';

    // Setup mocks
    mockGetAllOcids = jest.fn();
    mockGetExistingCombatPowerRecords = jest.fn().mockResolvedValue(new Map());
    mockGetAllCharacterInfoData = jest.fn().mockResolvedValue([]);
    mockUpsertCombatPowerRecords = jest.fn().mockResolvedValue({
      updated: 0,
      inserted: 0,
    });
    mockUpsertCharacterInfoCache = jest.fn().mockResolvedValue({
      updated: 0,
      inserted: 0,
    });

    mockRemoveOcids = jest.fn().mockResolvedValue({
      sheet1: 0,
      combatPower: 0,
      characterInfo: 0,
    });

    GoogleSheetsClient.mockImplementation(() => ({
      getAllOcids: mockGetAllOcids,
      getExistingCombatPowerRecords: mockGetExistingCombatPowerRecords,
      getAllCharacterInfoData: mockGetAllCharacterInfoData,
      upsertCombatPowerRecords: mockUpsertCombatPowerRecords,
      upsertCharacterInfoCache: mockUpsertCharacterInfoCache,
      removeOcids: mockRemoveOcids,
    }));
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  describe('Authentication', () => {
    it('should return 401 without auth header', async () => {
      const request = new Request(
        'http://localhost/api/cron/refresh-all',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 with wrong token', async () => {
      const request = new Request(
        'http://localhost/api/cron/refresh-all',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer wrong-secret' },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Initial Data Loading', () => {
    it('should read all OCIDs, combat power records, and character info in parallel', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: [],
        totalCount: 0,
        hasMore: false,
      });

      const request = new Request(
        'http://localhost/api/cron/refresh-all',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      await GET(request);

      // Should fetch ALL OCIDs at once (offset=0, limit=Infinity)
      expect(mockGetAllOcids).toHaveBeenCalledWith(0, Infinity);
      expect(mockGetExistingCombatPowerRecords).toHaveBeenCalledTimes(1);
      expect(mockGetAllCharacterInfoData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Processing', () => {
    it('should process batch and upsert both combat power and character info', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: ['ocid1'],
        totalCount: 1,
        hasMore: false,
      });

      mockGetExistingCombatPowerRecords.mockResolvedValue(new Map());
      mockGetAllCharacterInfoData.mockResolvedValue([]);

      processBatch.mockResolvedValue({
        records: [
          {
            ocid: 'ocid1',
            combat_power: '1000000',
            updated_at: '2026-03-01T00:00:00.000Z',
            status: 'success',
          },
        ],
        characterInfoRecords: [
          {
            ocid: 'ocid1',
            character_name: 'TestChar',
            character_level: 250,
            character_image: 'http://img.png',
            world_name: 'Reboot',
            character_class: 'Adele',
            cached_at: '2026-03-01T00:00:00.000Z',
          },
        ],
        stats: { success: 1, failed: 0, notFound: 0, skipped: 0 },
        executionTimeMs: 200,
      });

      const request = new Request(
        'http://localhost/api/cron/refresh-all',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(1);
      expect(data.stats.success).toBe(1);

      // Verify both upsert methods called
      expect(mockUpsertCombatPowerRecords).toHaveBeenCalledTimes(1);
      expect(mockUpsertCharacterInfoCache).toHaveBeenCalledTimes(1);

      // Verify combat power upsert received existingData array
      const combatPowerArgs = mockUpsertCombatPowerRecords.mock.calls[0];
      expect(combatPowerArgs[0]).toHaveLength(1); // records
      expect(Array.isArray(combatPowerArgs[1])).toBe(true); // existingData array
      expect(combatPowerArgs[1][0]).toEqual([
        'ocid',
        'combat_power',
        'updated_at',
        'status',
        'not_found_count',
      ]); // header row

      // Verify character info upsert received existingData
      const charInfoArgs = mockUpsertCharacterInfoCache.mock.calls[0];
      expect(charInfoArgs[0]).toHaveLength(1); // records
    });
  });

  describe('Multi-batch Loop', () => {
    it('should process multiple batches in a single invocation', async () => {
      // 3 OCIDs with batchSize=1 => 3 loop iterations
      mockGetAllOcids.mockResolvedValue({
        ocids: ['ocid1', 'ocid2', 'ocid3'],
        totalCount: 3,
        hasMore: false,
      });

      processBatch.mockImplementation((ocids) => {
        const ocid = ocids[0];
        return Promise.resolve({
          records: [
            {
              ocid,
              combat_power: '500000',
              updated_at: '2026-03-01T00:00:00.000Z',
              status: 'success',
            },
          ],
          characterInfoRecords: [],
          stats: { success: 1, failed: 0, notFound: 0, skipped: 0 },
          executionTimeMs: 100,
        });
      });

      const request = new Request(
        'http://localhost/api/cron/refresh-all?batchSize=1',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.processed).toBe(3);
      expect(data.stats.success).toBe(3);
      expect(data.nextOffset).toBeNull();
      expect(data.hasMore).toBe(false);

      // processBatch called 3 times (once per batch)
      expect(processBatch).toHaveBeenCalledTimes(3);
      // upsert called 3 times (once per batch)
      expect(mockUpsertCombatPowerRecords).toHaveBeenCalledTimes(3);
    });

    it('should update in-memory existingRecords between batches', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: ['ocid1', 'ocid2'],
        totalCount: 2,
        hasMore: false,
      });

      // Track what existingRecords are passed to processBatch
      const existingRecordsSnapshots = [];
      processBatch.mockImplementation((ocids, existingRecords) => {
        existingRecordsSnapshots.push(new Map(existingRecords));
        const ocid = ocids[0];
        return Promise.resolve({
          records: [
            {
              ocid,
              combat_power: '500000',
              updated_at: '2026-03-01T00:00:00.000Z',
              status: 'success',
              not_found_count: 0,
            },
          ],
          characterInfoRecords: [],
          stats: { success: 1, failed: 0, notFound: 0, skipped: 0 },
          executionTimeMs: 100,
        });
      });

      const request = new Request(
        'http://localhost/api/cron/refresh-all?batchSize=1',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      await GET(request);

      // First batch: existingRecords is empty (initial load)
      expect(existingRecordsSnapshots[0].size).toBe(0);
      // Second batch: existingRecords should contain ocid1 from first batch
      expect(existingRecordsSnapshots[1].has('ocid1')).toBe(true);
      expect(existingRecordsSnapshots[1].get('ocid1').combat_power).toBe(
        '500000'
      );
    });
  });

  describe('Time Budget', () => {
    it('should stop with timeout when time budget exceeded', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: ['ocid1', 'ocid2', 'ocid3'],
        totalCount: 3,
        hasMore: false,
      });

      let callCount = 0;
      // First batch succeeds, then Date.now will indicate timeout
      const originalDateNow = Date.now;
      let startTime;

      processBatch.mockImplementation((ocids) => {
        callCount++;
        if (callCount === 1) {
          // After first batch, simulate elapsed time > 7s
          Date.now = () => startTime + 8000;
        }
        return Promise.resolve({
          records: [
            {
              ocid: ocids[0],
              combat_power: '500000',
              updated_at: '2026-03-01T00:00:00.000Z',
              status: 'success',
            },
          ],
          characterInfoRecords: [],
          stats: { success: 1, failed: 0, notFound: 0, skipped: 0 },
          executionTimeMs: 100,
        });
      });

      startTime = originalDateNow();
      Date.now = () => startTime;

      const request = new Request(
        'http://localhost/api/cron/refresh-all?batchSize=1',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      // Restore Date.now
      Date.now = originalDateNow;

      expect(data.success).toBe(true);
      expect(data.processed).toBe(1); // Only first batch processed
      expect(data.stoppedReason).toBe('timeout');
      expect(data.nextOffset).toBe(1); // offset=0 + 1 batch processed
      expect(data.hasMore).toBe(true);
    });
  });

  describe('Offset Parameter', () => {
    it('should start processing from the given offset', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: ['ocid1', 'ocid2', 'ocid3'],
        totalCount: 3,
        hasMore: false,
      });

      processBatch.mockResolvedValue({
        records: [
          {
            ocid: 'ocid3',
            combat_power: '500000',
            updated_at: '2026-03-01T00:00:00.000Z',
            status: 'success',
          },
        ],
        characterInfoRecords: [],
        stats: { success: 1, failed: 0, notFound: 0, skipped: 0 },
        executionTimeMs: 100,
      });

      const request = new Request(
        'http://localhost/api/cron/refresh-all?offset=2',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.processed).toBe(1);
      // processBatch should receive only ocid3 (offset=2 means skip first 2)
      expect(processBatch.mock.calls[0][0]).toEqual(['ocid3']);
    });
  });

  describe('Empty OCIDs', () => {
    it('should return empty response when no OCIDs', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: [],
        totalCount: 0,
        hasMore: false,
      });

      const request = new Request(
        'http://localhost/api/cron/refresh-all',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(0);
      expect(data.hasMore).toBe(false);
      expect(data.nextOffset).toBeNull();
      expect(data.stats).toEqual({
        success: 0,
        failed: 0,
        notFound: 0,
        skipped: 0,
      });
    });
  });

  describe('Auto-removal of invalid OCIDs', () => {
    it('should remove OCIDs with not_found_count >= 3', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: ['ocid1', 'ocid2'],
        totalCount: 2,
        hasMore: false,
      });

      processBatch.mockResolvedValue({
        records: [
          {
            ocid: 'ocid1',
            combat_power: '0',
            updated_at: '2026-03-01T00:00:00.000Z',
            status: 'not_found',
            not_found_count: 3,
          },
          {
            ocid: 'ocid2',
            combat_power: '1000000',
            updated_at: '2026-03-01T00:00:00.000Z',
            status: 'success',
            not_found_count: 0,
          },
        ],
        characterInfoRecords: [],
        stats: { success: 1, failed: 0, notFound: 1, skipped: 0 },
        executionTimeMs: 200,
      });

      const request = new Request(
        'http://localhost/api/cron/refresh-all',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.removed).toBe(1);
      expect(mockRemoveOcids).toHaveBeenCalledWith(['ocid1']);
    });

    it('should not call removeOcids when no OCIDs exceed threshold', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: ['ocid1'],
        totalCount: 1,
        hasMore: false,
      });

      processBatch.mockResolvedValue({
        records: [
          {
            ocid: 'ocid1',
            combat_power: '0',
            updated_at: '2026-03-01T00:00:00.000Z',
            status: 'not_found',
            not_found_count: 2,
          },
        ],
        characterInfoRecords: [],
        stats: { success: 0, failed: 0, notFound: 1, skipped: 0 },
        executionTimeMs: 100,
      });

      const request = new Request(
        'http://localhost/api/cron/refresh-all',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.removed).toBe(0);
      expect(mockRemoveOcids).not.toHaveBeenCalled();
    });

    it('should collect removable OCIDs across multiple batches', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: ['ocid1', 'ocid2'],
        totalCount: 2,
        hasMore: false,
      });

      let callCount = 0;
      processBatch.mockImplementation((ocids) => {
        callCount++;
        const ocid = ocids[0];
        return Promise.resolve({
          records: [
            {
              ocid,
              combat_power: '0',
              updated_at: '2026-03-01T00:00:00.000Z',
              status: 'not_found',
              not_found_count: 3,
            },
          ],
          characterInfoRecords: [],
          stats: { success: 0, failed: 0, notFound: 1, skipped: 0 },
          executionTimeMs: 100,
        });
      });

      const request = new Request(
        'http://localhost/api/cron/refresh-all?batchSize=1',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      // Both OCIDs should be removed (collected across 2 batches)
      expect(data.removed).toBe(2);
      expect(mockRemoveOcids).toHaveBeenCalledWith(['ocid1', 'ocid2']);
    });
  });

  describe('No Chain Calls', () => {
    it('should not make any fetch calls (no chain)', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn();

      mockGetAllOcids.mockResolvedValue({
        ocids: ['ocid1'],
        totalCount: 100,
        hasMore: false,
      });

      processBatch.mockResolvedValue({
        records: [
          {
            ocid: 'ocid1',
            combat_power: '500000',
            updated_at: '2026-03-01T00:00:00.000Z',
            status: 'success',
          },
        ],
        characterInfoRecords: [],
        stats: { success: 1, failed: 0, notFound: 0, skipped: 0 },
        executionTimeMs: 100,
      });

      const request = new Request(
        'http://localhost/api/cron/refresh-all',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      await GET(request);

      expect(global.fetch).not.toHaveBeenCalled();
      global.fetch = originalFetch;
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on error', async () => {
      mockGetAllOcids.mockRejectedValue(
        new Error('Google Sheets API error')
      );

      const request = new Request(
        'http://localhost/api/cron/refresh-all',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-secret' },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Google Sheets API error');
    });
  });
});
