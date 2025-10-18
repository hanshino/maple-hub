import {
  calculateRuneProgress,
  filterRunesByType,
  getRuneType,
  getMaxLevel,
} from '../../lib/runeUtils';

describe('Rune Utils', () => {
  describe('calculateRuneProgress', () => {
    it('calculates progress for a rune at 0%', () => {
      const rune = {
        symbol_name: '祕法符文：測試',
        symbol_level: 1,
        symbol_growth_count: 0,
        symbol_require_growth_count: 29,
      };
      expect(calculateRuneProgress(rune)).toBe(0);
    });

    it('calculates progress for a rune at 50%', () => {
      const rune = {
        symbol_name: '祕法符文：測試',
        symbol_level: 1,
        symbol_growth_count: 14,
        symbol_require_growth_count: 29,
      };
      // Level 1/20: (0 + 14/29) / 19 ≈ 2.54%
      expect(calculateRuneProgress(rune)).toBeCloseTo(2.54, 2);
    });

    it('returns 100% for max level runes', () => {
      const rune = {
        symbol_name: '祕法符文：測試',
        symbol_level: 20,
        symbol_growth_count: 100,
        symbol_require_growth_count: 411,
      };
      expect(calculateRuneProgress(rune)).toBe(100);
    });
  });

  describe('filterRunesByType', () => {
    const runes = [
      { symbol_name: '祕法符文：消逝的旅途' },
      { symbol_name: '真實符文：賽爾尼溫' },
      { symbol_name: '豪華真實符文：塔拉哈特' },
    ];

    it('filters secret runes', () => {
      const result = filterRunesByType(runes, 'secret');
      expect(result).toHaveLength(1);
      expect(result[0].symbol_name).toContain('祕法符文');
    });

    it('filters true runes', () => {
      const result = filterRunesByType(runes, 'true');
      expect(result).toHaveLength(1);
      expect(result[0].symbol_name).toContain('真實符文');
    });

    it('filters luxury runes', () => {
      const result = filterRunesByType(runes, 'luxury');
      expect(result).toHaveLength(1);
      expect(result[0].symbol_name).toContain('豪華真實符文');
    });
  });

  describe('getRuneType', () => {
    it('identifies secret runes', () => {
      const rune = { symbol_name: '祕法符文：測試' };
      expect(getRuneType(rune)).toBe('secret');
    });

    it('identifies true runes', () => {
      const rune = { symbol_name: '真實符文：測試' };
      expect(getRuneType(rune)).toBe('true');
    });

    it('identifies luxury runes', () => {
      const rune = { symbol_name: '豪華真實符文：測試' };
      expect(getRuneType(rune)).toBe('luxury');
    });
  });

  describe('getMaxLevel', () => {
    it('returns 20 for secret runes', () => {
      const rune = { symbol_name: '祕法符文：測試' };
      expect(getMaxLevel(rune)).toBe(20);
    });

    it('returns 11 for true runes', () => {
      const rune = { symbol_name: '真實符文：測試' };
      expect(getMaxLevel(rune)).toBe(11);
    });

    it('returns 11 for luxury runes', () => {
      const rune = { symbol_name: '豪華真實符文：測試' };
      expect(getMaxLevel(rune)).toBe(11);
    });
  });
});
