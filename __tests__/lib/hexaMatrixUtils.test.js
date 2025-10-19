import {
  calculateCoreProgress,
  calculateOverallProgress,
  formatResourceAmount,
  formatProgress,
  filterHexaCoreSkills,
} from '../../lib/hexaMatrixUtils.js';

describe('HexaMatrixUtils', () => {
  describe('calculateCoreProgress', () => {
    test('calculates progress for skill core at level 30', () => {
      const core = {
        hexa_core_name: 'Test Skill Core',
        hexa_core_level: 30,
        hexa_core_type: '技能核心',
      };

      const result = calculateCoreProgress(core);

      expect(result.level).toBe(30);
      expect(result.progress).toBe(100);
      expect(result.spent).toEqual({
        soul_elder: 145,
        soul_elder_fragment: 4400,
      });
      expect(result.required).toEqual({
        soul_elder: 145,
        soul_elder_fragment: 4400,
      });
    });

    test('calculates progress for mastery core at level 15', () => {
      const core = {
        hexa_core_name: 'Test Mastery Core',
        hexa_core_level: 15,
        hexa_core_type: '精通核心',
      };

      const result = calculateCoreProgress(core);

      expect(result.level).toBe(15);
      expect(result.progress).toBeCloseTo(33.73, 1);
      expect(result.spent).toEqual({
        soul_elder: 28,
        soul_elder_fragment: 592,
      });
      expect(result.required).toEqual({
        soul_elder: 83,
        soul_elder_fragment: 2252,
      });
    });

    test('returns zero progress for unknown core type', () => {
      const core = {
        hexa_core_name: 'Unknown Core',
        hexa_core_level: 10,
        hexa_core_type: 'Unknown Type',
      };

      const result = calculateCoreProgress(core);

      expect(result.level).toBe(10);
      expect(result.progress).toBe(0);
      expect(result.spent).toEqual({ soul_elder: 0, soul_elder_fragment: 0 });
      expect(result.required).toEqual({
        soul_elder: 0,
        soul_elder_fragment: 0,
      });
    });
  });

  describe('calculateOverallProgress', () => {
    test('calculates overall progress for multiple cores', () => {
      const cores = [
        {
          hexa_core_name: 'Skill Core',
          hexa_core_level: 30,
          hexa_core_type: '技能核心',
        },
        {
          hexa_core_name: 'Mastery Core',
          hexa_core_level: 15,
          hexa_core_type: '精通核心',
        },
      ];

      const result = calculateOverallProgress(cores);

      expect(result.totalProgress).toBeGreaterThan(0);
      expect(result.totalProgress).toBeLessThanOrEqual(100);
      expect(result.totalSpent.soul_elder).toBeGreaterThan(0);
      expect(result.totalRequired.soul_elder).toBeGreaterThan(
        result.totalSpent.soul_elder
      );
      expect(result.coreProgress).toHaveLength(2);
    });

    test('returns zero progress for empty cores array', () => {
      const result = calculateOverallProgress([]);

      expect(result.totalProgress).toBe(0);
      expect(result.totalSpent).toEqual({
        soul_elder: 0,
        soul_elder_fragment: 0,
      });
      expect(result.totalRequired).toEqual({
        soul_elder: 0,
        soul_elder_fragment: 0,
      });
      expect(result.coreProgress).toEqual([]);
    });

    test('returns zero progress for null/undefined cores', () => {
      const result = calculateOverallProgress(null);

      expect(result.totalProgress).toBe(0);
      expect(result.coreProgress).toEqual([]);
    });
  });

  describe('formatResourceAmount', () => {
    test('formats small amounts', () => {
      expect(formatResourceAmount(500)).toBe('500');
      expect(formatResourceAmount(999)).toBe('999');
    });

    test('formats thousands', () => {
      expect(formatResourceAmount(1500)).toBe('1.5K');
      expect(formatResourceAmount(2500)).toBe('2.5K');
    });

    test('formats millions', () => {
      expect(formatResourceAmount(1500000)).toBe('1.5M');
      expect(formatResourceAmount(2500000)).toBe('2.5M');
    });
  });

  describe('formatProgress', () => {
    test('formats progress percentage', () => {
      expect(formatProgress(85.7)).toBe('85.7%');
      expect(formatProgress(100)).toBe('100.0%');
      expect(formatProgress(0)).toBe('0.0%');
    });
  });

  describe('filterHexaCoreSkills', () => {
    test('returns empty array for null input', () => {
      const result = filterHexaCoreSkills(null);
      expect(result).toEqual([]);
    });

    test('returns empty array for non-array input', () => {
      const result = filterHexaCoreSkills('not an array');
      expect(result).toEqual([]);
    });

    test('returns all cores when mastery count is 4 or less', () => {
      const cores = [
        { hexa_core_type: '精通核心', hexa_core_level: 5 },
        { hexa_core_type: '精通核心', hexa_core_level: 0 },
        { hexa_core_type: '強化核心', hexa_core_level: 10 },
        { hexa_core_type: '強化核心', hexa_core_level: 0 },
      ];
      const result = filterHexaCoreSkills(cores);
      expect(result).toEqual(cores);
    });

    test('filters level 0 cores when mastery count exceeds 4', () => {
      const cores = [
        { hexa_core_type: '精通核心', hexa_core_level: 5 },
        { hexa_core_type: '精通核心', hexa_core_level: 0 },
        { hexa_core_type: '精通核心', hexa_core_level: 0 },
        { hexa_core_type: '精通核心', hexa_core_level: 10 },
        { hexa_core_type: '精通核心', hexa_core_level: 0 }, // 5th mastery core
        { hexa_core_type: '強化核心', hexa_core_level: 5 },
      ];
      const result = filterHexaCoreSkills(cores);
      const expected = cores.filter(c => c.hexa_core_level > 0);
      expect(result).toEqual(expected);
    });

    test('filters level 0 cores when enhancement count exceeds 4', () => {
      const cores = [
        { hexa_core_type: '強化核心', hexa_core_level: 5 },
        { hexa_core_type: '強化核心', hexa_core_level: 0 },
        { hexa_core_type: '強化核心', hexa_core_level: 0 },
        { hexa_core_type: '強化核心', hexa_core_level: 10 },
        { hexa_core_type: '強化核心', hexa_core_level: 0 }, // 5th enhancement core
        { hexa_core_type: '精通核心', hexa_core_level: 5 },
      ];
      const result = filterHexaCoreSkills(cores);
      const expected = cores.filter(c => c.hexa_core_level > 0);
      expect(result).toEqual(expected);
    });

    test('does not filter when both counts are within limits', () => {
      const cores = [
        { hexa_core_type: '精通核心', hexa_core_level: 0 },
        { hexa_core_type: '強化核心', hexa_core_level: 0 },
        { hexa_core_type: '技能核心', hexa_core_level: 0 },
      ];
      const result = filterHexaCoreSkills(cores);
      expect(result).toEqual(cores);
    });
  });
});
