import {
  processStatsData,
  getBattlePower,
  formatStatValue,
} from '../../lib/statsUtils';

describe('statsUtils', () => {
  describe('processStatsData', () => {
    it('should process final_stat array correctly', () => {
      const data = {
        final_stat: [
          { stat_name: '戰鬥力', stat_value: '1000000' },
          { stat_name: '攻擊力', stat_value: '5000' },
        ],
      };

      const result = processStatsData(data);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: '戰鬥力', value: '1000000' });
    });

    it('should merge min/max stat pairs into ranges', () => {
      const data = {
        final_stat: [
          { stat_name: '最低屬性攻擊力', stat_value: '1000' },
          { stat_name: '最高屬性攻擊力', stat_value: '2000' },
          { stat_name: '防禦力', stat_value: '500' },
        ],
      };

      const result = processStatsData(data);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: '屬性攻擊力',
        value: '1000-2000',
        isRange: true,
      });
      expect(result[1]).toEqual({ name: '防禦力', value: '500' });
    });

    it('should filter out stats that start with "AP配點"', () => {
      const data = {
        final_stat: [
          { stat_name: '戰鬥力', stat_value: '1000000' },
          { stat_name: 'AP配點力量', stat_value: '100' },
          { stat_name: 'AP配點智力', stat_value: '200' },
          { stat_name: '攻擊力', stat_value: '5000' },
        ],
      };

      const result = processStatsData(data);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: '戰鬥力', value: '1000000' });
      expect(result[1]).toEqual({ name: '攻擊力', value: '5000' });
      // AP配點 stats should be filtered out
      expect(result.some(stat => stat.name.startsWith('AP配點'))).toBe(false);
    });
  });

  describe('getBattlePower', () => {
    it('should return battle power value', () => {
      const stats = [
        { name: '戰鬥力', value: '1000000' },
        { name: '攻擊力', value: '5000' },
      ];

      const result = getBattlePower(stats);
      expect(result).toBe('1000000');
    });

    it('should return null if battle power not found', () => {
      const stats = [{ name: '攻擊力', value: '5000' }];
      const result = getBattlePower(stats);
      expect(result).toBeNull();
    });
  });

  describe('formatStatValue', () => {
    it('should format large numbers with Chinese units', () => {
      expect(formatStatValue('100000000')).toBe('1.00億');
      expect(formatStatValue(100000000)).toBe('1.00億');
      expect(formatStatValue('1000000')).toBe('100.00萬');
      expect(formatStatValue('10000')).toBe('10000');
      expect(formatStatValue('5000')).toBe('5000');
    });

    it('should format range values with Chinese units', () => {
      expect(formatStatValue('268850795-298723102')).toBe('2.69億-2.99億');
      expect(formatStatValue('1000000-2000000')).toBe('100.00萬-200.00萬');
      expect(formatStatValue('10000-20000')).toBe('10000-20000');
      expect(formatStatValue('1000-5000')).toBe('1000-5000');
    });

    it('should return string values as is for non-numeric content', () => {
      expect(formatStatValue('82.75')).toBe('82.75');
      expect(formatStatValue('some text')).toBe('some text');
    });
  });
});
