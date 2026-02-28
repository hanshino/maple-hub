/**
 * @jest-environment node
 */

import {
  fetchCombatPower,
  processBatch,
  delay,
} from '../../lib/combatPowerService';
import {
  getCharacterStats,
  getCharacterBasicInfo,
} from '../../lib/nexonApi';

// Mock nexonApi
jest.mock('../../lib/nexonApi', () => ({
  getCharacterStats: jest.fn(),
  getCharacterBasicInfo: jest.fn(),
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
      getCharacterBasicInfo.mockResolvedValue({
        character_name: 'TestChar',
        character_level: 275,
        character_image: 'https://img.url/char.png',
        world_name: '殺人鯨',
        character_class: '冒險家',
      });
    });

    it('should process all OCIDs and return stats', async () => {
      getCharacterStats.mockResolvedValue({
        final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
      });

      const ocids = ['ocid1', 'ocid2'];
      const result = await processBatch(ocids);

      expect(result.records).toHaveLength(2);
      expect(result.characterInfoRecords).toHaveLength(2);
      expect(result.stats.success).toBe(2);
      expect(result.stats.failed).toBe(0);
      expect(result.stats.notFound).toBe(0);
    });

    it('should continue processing when one OCID fails', async () => {
      // Use implementation-based mock so parallel calls route correctly
      getCharacterStats.mockImplementation(ocid => {
        if (ocid === 'ocid2') {
          return Promise.reject(new Error('API Error'));
        }
        return Promise.resolve({
          final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
        });
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
      expect(result.characterInfoRecords).toHaveLength(0);
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

    it('should skip fresh records within 24 hours', async () => {
      getCharacterStats.mockResolvedValue({
        final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
      });

      const existingRecords = new Map();
      existingRecords.set('ocid1', {
        combat_power: '500000',
        updated_at: new Date().toISOString(),
        status: 'success',
      });

      const ocids = ['ocid1', 'ocid2'];
      const result = await processBatch(ocids, existingRecords);

      expect(result.records).toHaveLength(1);
      expect(result.stats.skipped).toBe(1);
      expect(result.stats.success).toBe(1);
      expect(getCharacterStats).toHaveBeenCalledTimes(1);
    });

    it('should return characterInfo alongside combatPower in records', async () => {
      getCharacterStats.mockResolvedValue({
        final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
      });

      const result = await processBatch(['ocid1']);

      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        ocid: 'ocid1',
        combat_power: '1000000',
        status: 'success',
      });

      expect(result.characterInfoRecords).toHaveLength(1);
      expect(result.characterInfoRecords[0]).toMatchObject({
        ocid: 'ocid1',
        character_name: 'TestChar',
        character_level: 275,
        character_image: 'https://img.url/char.png',
        world_name: '殺人鯨',
        character_class: '冒險家',
      });
      expect(result.characterInfoRecords[0].cached_at).toBeDefined();
    });

    it('should still return combatPower record when basicInfo fetch fails', async () => {
      getCharacterStats.mockResolvedValue({
        final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
      });
      getCharacterBasicInfo.mockRejectedValue(
        new Error('Basic info fetch failed')
      );

      const result = await processBatch(['ocid1']);

      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        ocid: 'ocid1',
        combat_power: '1000000',
        status: 'success',
      });
      expect(result.characterInfoRecords).toHaveLength(0);
    });

    it('should accumulate not_found_count for not_found records', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.response = { status: 404 };
      getCharacterStats.mockRejectedValue(notFoundError);

      const existingRecords = new Map();
      existingRecords.set('ocid1', {
        combat_power: '0',
        updated_at: '2025-01-01T00:00:00.000Z',
        status: 'not_found',
        not_found_count: 2,
      });

      const result = await processBatch(['ocid1'], existingRecords);

      expect(result.records[0].not_found_count).toBe(3);
    });

    it('should reset not_found_count to 0 on success', async () => {
      getCharacterStats.mockResolvedValue({
        final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
      });

      const existingRecords = new Map();
      existingRecords.set('ocid1', {
        combat_power: '0',
        updated_at: '2025-01-01T00:00:00.000Z',
        status: 'not_found',
        not_found_count: 2,
      });

      const result = await processBatch(['ocid1'], existingRecords);

      expect(result.records[0].not_found_count).toBe(0);
    });

    it('should start not_found_count at 1 for new not_found records', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.response = { status: 404 };
      getCharacterStats.mockRejectedValue(notFoundError);

      const result = await processBatch(['ocid1']);

      expect(result.records[0].not_found_count).toBe(1);
    });

    it('should process OCIDs in parallel', async () => {
      getCharacterStats.mockResolvedValue({
        final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
      });

      const ocids = Array.from({ length: 20 }, (_, i) => `ocid${i + 1}`);
      const result = await processBatch(ocids);

      expect(result.records).toHaveLength(20);
      expect(getCharacterStats).toHaveBeenCalledTimes(20);
      expect(getCharacterBasicInfo).toHaveBeenCalledTimes(20);

      // Verify all OCIDs were called
      for (const ocid of ocids) {
        expect(getCharacterStats).toHaveBeenCalledWith(ocid);
        expect(getCharacterBasicInfo).toHaveBeenCalledWith(ocid);
      }
    });
  });
});
