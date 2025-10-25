import { calculateFilteredOverallProgress } from '../../lib/hexaMatrixUtils.js';

describe('Hexa Filtering Integration', () => {
  test('processes normal hexa data without filtering', () => {
    const cores = [
      {
        hexa_core_name: '技能核心',
        hexa_core_level: 30,
        hexa_core_type: '技能核心',
      },
      {
        hexa_core_name: '精通核心1',
        hexa_core_level: 15,
        hexa_core_type: '精通核心',
      },
      {
        hexa_core_name: '強化核心1',
        hexa_core_level: 10,
        hexa_core_type: '強化核心',
      },
    ];

    const result = calculateFilteredOverallProgress(cores);

    expect(result.totalProgress).toBeGreaterThan(0);
    expect(result.coreProgress).toHaveLength(3);
    expect(result.coreProgress.every(c => c.level >= 0)).toBe(true);
  });

  test('filters out irrelevant cores when cross-class data detected', () => {
    const cores = [
      {
        hexa_core_name: '精通核心1',
        hexa_core_level: 5,
        hexa_core_type: '精通核心',
      },
      {
        hexa_core_name: '精通核心2',
        hexa_core_level: 0,
        hexa_core_type: '精通核心',
      },
      {
        hexa_core_name: '精通核心3',
        hexa_core_level: 0,
        hexa_core_type: '精通核心',
      },
      {
        hexa_core_name: '精通核心4',
        hexa_core_level: 10,
        hexa_core_type: '精通核心',
      },
      {
        hexa_core_name: '精通核心5',
        hexa_core_level: 0,
        hexa_core_type: '精通核心', // 5th mastery core triggers filtering
      },
      {
        hexa_core_name: '強化核心1',
        hexa_core_level: 5,
        hexa_core_type: '強化核心',
      },
    ];

    const result = calculateFilteredOverallProgress(cores);

    // Should filter out level 0 cores
    expect(result.coreProgress).toHaveLength(3);
    expect(result.coreProgress.every(c => c.level > 0)).toBe(true);
    expect(result.totalProgress).toBeGreaterThan(0);
  });

  test('handles empty or invalid data gracefully', () => {
    const result = calculateFilteredOverallProgress([]);

    expect(result.totalProgress).toBe(0);
    expect(result.coreProgress).toEqual([]);
    expect(result.totalSpent).toEqual({
      soul_elder: 0,
      soul_elder_fragment: 0,
    });
  });

  test('maintains progress calculation accuracy after filtering', () => {
    const cores = [
      {
        hexa_core_name: '技能核心',
        hexa_core_level: 30,
        hexa_core_type: '技能核心',
      },
      {
        hexa_core_name: '精通核心1',
        hexa_core_level: 0,
        hexa_core_type: '精通核心',
      },
      {
        hexa_core_name: '精通核心2',
        hexa_core_level: 0,
        hexa_core_type: '精通核心',
      },
      {
        hexa_core_name: '精通核心3',
        hexa_core_level: 0,
        hexa_core_type: '精通核心',
      },
      {
        hexa_core_name: '精通核心4',
        hexa_core_level: 0,
        hexa_core_type: '精通核心',
      },
      {
        hexa_core_name: '精通核心5',
        hexa_core_level: 0,
        hexa_core_type: '精通核心', // triggers filtering
      },
    ];

    const result = calculateFilteredOverallProgress(cores);

    // Only the skill core should remain
    expect(result.coreProgress).toHaveLength(1);
    expect(result.coreProgress[0].name).toBe('技能核心');
    expect(result.coreProgress[0].level).toBe(30);
    expect(result.totalProgress).toBe(100); // Maxed skill core
  });
});
