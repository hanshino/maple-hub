/**
 * @jest-environment node
 */

import {
  fetchCombatPower,
  processBatch,
  delay,
} from '../../lib/combatPowerService';
import { getCharacterStats } from '../../lib/nexonApi';

// Mock nexonApi
jest.mock('../../lib/nexonApi', () => ({
  getCharacterStats: jest.fn(),
}));

describe('CombatPowerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('delay', () => {
    it('should resolve after specified milliseconds', async () => {
      const delayPromise = delay(300);
      jest.advanceTimersByTime(300);
      await expect(delayPromise).resolves.toBeUndefined();
    });
  });

  describe('fetchCombatPower', () => {
    beforeEach(() => {
      jest.useRealTimers(); // Use real timers for API tests
    });

    it('should extract combat power from final_stat', async () => {
      getCharacterStats.mockResolvedValue({
        final_stat: [
          { stat_name: '戰鬥力', stat_value: '1000000' },
          { stat_name: '攻擊力', stat_value: '5000' },
        ],
      });

      const result = await fetchCombatPower('test-ocid');

      expect(result.combat_power).toBe('1000000');
      expect(result.status).toBe('success');
      expect(result.ocid).toBe('test-ocid');
      expect(result.updated_at).toBeDefined();
    });

    it('should handle missing combat power stat', async () => {
      getCharacterStats.mockResolvedValue({
        final_stat: [{ stat_name: '攻擊力', stat_value: '5000' }],
      });

      const result = await fetchCombatPower('test-ocid');

      expect(result.combat_power).toBe('0');
      expect(result.status).toBe('not_found');
    });

    it('should handle 404 character not found', async () => {
      const error = new Error('Character not found');
      error.response = { status: 404 };
      getCharacterStats.mockRejectedValue(error);

      const result = await fetchCombatPower('test-ocid');

      expect(result.status).toBe('not_found');
    });

    it('should handle API errors', async () => {
      getCharacterStats.mockRejectedValue(new Error('API Error'));

      const result = await fetchCombatPower('test-ocid');

      expect(result.status).toBe('error');
    });
  });

  describe('processBatch', () => {
    beforeEach(() => {
      jest.useRealTimers(); // Use real timers for batch processing
    });

    it('should process all OCIDs and return stats', async () => {
      getCharacterStats.mockResolvedValue({
        final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
      });

      const ocids = ['ocid1', 'ocid2'];
      const result = await processBatch(ocids);

      expect(result.records).toHaveLength(2);
      expect(result.stats.success).toBe(2);
      expect(result.stats.failed).toBe(0);
      expect(result.stats.notFound).toBe(0);
    });

    it('should continue processing when one OCID fails', async () => {
      // For the second OCID, we need to fail all retry attempts (MAX_RETRIES + 1 = 3 calls)
      getCharacterStats
        .mockResolvedValueOnce({
          final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
        })
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          final_stat: [{ stat_name: '戰鬥力', stat_value: '2000000' }],
        });

      const ocids = ['ocid1', 'ocid2', 'ocid3'];
      const result = await processBatch(ocids);

      expect(result.records).toHaveLength(3);
      expect(result.stats.success).toBe(2);
      expect(result.stats.failed).toBe(1);
    });

    it('should track not_found status separately', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.response = { status: 404 };

      getCharacterStats
        .mockResolvedValueOnce({
          final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
        })
        .mockRejectedValueOnce(notFoundError);

      const ocids = ['ocid1', 'ocid2'];
      const result = await processBatch(ocids);

      expect(result.stats.success).toBe(1);
      expect(result.stats.notFound).toBe(1);
      expect(result.stats.failed).toBe(0);
    });

    it('should return empty results for empty input', async () => {
      const result = await processBatch([]);

      expect(result.records).toHaveLength(0);
      expect(result.stats.success).toBe(0);
      expect(result.stats.failed).toBe(0);
      expect(result.stats.notFound).toBe(0);
    });

    it('should include execution time in result', async () => {
      getCharacterStats.mockResolvedValue({
        final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
      });

      const result = await processBatch(['ocid1']);

      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
