/**
 * @jest-environment node
 */

// Mock dependencies before importing
jest.mock('../../../lib/googleSheets');
jest.mock('../../../lib/combatPowerService');

import { GET } from '../../../app/api/cron/combat-power-refresh/route';
import GoogleSheetsClient from '../../../lib/googleSheets';
import { processBatch } from '../../../lib/combatPowerService';

describe('Combat Power Refresh API Route', () => {
  let mockGetAllOcids;
  let mockUpsertCombatPowerRecords;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up CRON_SECRET
    process.env.CRON_SECRET = 'test-secret';

    // Setup mocks
    mockGetAllOcids = jest.fn();
    mockUpsertCombatPowerRecords = jest.fn();

    GoogleSheetsClient.mockImplementation(() => ({
      getAllOcids: mockGetAllOcids,
      upsertCombatPowerRecords: mockUpsertCombatPowerRecords,
      getCombatPowerSheet: jest.fn(),
    }));
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  describe('Authentication', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const request = new Request(
        'http://localhost/api/cron/combat-power-refresh',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when CRON_SECRET does not match', async () => {
      const request = new Request(
        'http://localhost/api/cron/combat-power-refresh',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer wrong-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should process request when CRON_SECRET matches', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: [],
        totalCount: 0,
        hasMore: false,
      });

      const request = new Request(
        'http://localhost/api/cron/combat-power-refresh',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer test-secret',
          },
        }
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Query Parameters', () => {
    it('should use default offset=0 and batchSize=15', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: [],
        totalCount: 0,
        hasMore: false,
      });

      const request = new Request(
        'http://localhost/api/cron/combat-power-refresh',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer test-secret',
          },
        }
      );

      await GET(request);

      expect(mockGetAllOcids).toHaveBeenCalledWith(0, 15);
    });

    it('should parse custom offset and batchSize from query params', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: [],
        totalCount: 100,
        hasMore: true,
      });

      const request = new Request(
        'http://localhost/api/cron/combat-power-refresh?offset=10&batchSize=5',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer test-secret',
          },
        }
      );

      await GET(request);

      expect(mockGetAllOcids).toHaveBeenCalledWith(10, 5);
    });

    it('should cap batchSize at 20', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: [],
        totalCount: 0,
        hasMore: false,
      });

      const request = new Request(
        'http://localhost/api/cron/combat-power-refresh?batchSize=50',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer test-secret',
          },
        }
      );

      await GET(request);

      expect(mockGetAllOcids).toHaveBeenCalledWith(0, 20);
    });
  });

  describe('Response Format', () => {
    it('should return correct response format when no OCIDs', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: [],
        totalCount: 0,
        hasMore: false,
      });

      const request = new Request(
        'http://localhost/api/cron/combat-power-refresh',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer test-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(0);
      expect(data.offset).toBe(0);
      expect(data.batchSize).toBe(15);
      expect(data.totalCount).toBe(0);
      expect(data.hasMore).toBe(false);
      expect(data.stats).toEqual({ success: 0, failed: 0, notFound: 0 });
      expect(data.timestamp).toBeDefined();
    });

    it('should include processing stats in response', async () => {
      mockGetAllOcids.mockResolvedValue({
        ocids: ['ocid1', 'ocid2'],
        totalCount: 100,
        hasMore: true,
      });

      processBatch.mockResolvedValue({
        records: [
          {
            ocid: 'ocid1',
            combat_power: '1000000',
            updated_at: '2025-12-06T00:00:00.000Z',
            status: 'success',
          },
          {
            ocid: 'ocid2',
            combat_power: '0',
            updated_at: '2025-12-06T00:00:00.000Z',
            status: 'not_found',
          },
        ],
        stats: { success: 1, failed: 0, notFound: 1 },
        executionTimeMs: 500,
      });

      mockUpsertCombatPowerRecords.mockResolvedValue({
        updated: 1,
        inserted: 1,
      });

      const request = new Request(
        'http://localhost/api/cron/combat-power-refresh',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer test-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(2);
      expect(data.stats.success).toBe(1);
      expect(data.stats.notFound).toBe(1);
      expect(data.hasMore).toBe(true);
      expect(data.nextOffset).toBe(15);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when Google Sheets API fails', async () => {
      mockGetAllOcids.mockRejectedValue(new Error('Google Sheets API error'));

      const request = new Request(
        'http://localhost/api/cron/combat-power-refresh',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer test-secret',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});
