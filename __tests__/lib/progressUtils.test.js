import { calculateStatCoreProgress } from '../../lib/progressUtils.js';

describe('calculateStatCoreProgress', () => {
  test('returns default values for empty or invalid input', () => {
    expect(calculateStatCoreProgress(null)).toEqual({
      activatedCount: 0,
      totalAvailable: 0,
      materialUsed: { soulElda: 0, soulEldaFragments: 0 },
      averageGrade: 0,
    });

    expect(calculateStatCoreProgress([])).toEqual({
      activatedCount: 0,
      totalAvailable: 0,
      materialUsed: { soulElda: 0, soulEldaFragments: 0 },
      averageGrade: 0,
    });

    expect(calculateStatCoreProgress('invalid')).toEqual({
      activatedCount: 0,
      totalAvailable: 0,
      materialUsed: { soulElda: 0, soulEldaFragments: 0 },
      averageGrade: 0,
    });
  });

  test('calculates progress for unactivated cores', () => {
    const statCores = [
      {
        slot_id: '0',
        stat_grade: 0,
        main_stat_name: null,
        sub_stat_name_1: null,
        sub_stat_name_2: null,
        main_stat_level: 0,
        sub_stat_level_1: 0,
        sub_stat_level_2: 0,
      },
      {
        slot_id: '1',
        stat_grade: 0,
        main_stat_name: null,
        sub_stat_name_1: null,
        sub_stat_name_2: null,
        main_stat_level: 0,
        sub_stat_level_1: 0,
        sub_stat_level_2: 0,
      },
    ];

    const result = calculateStatCoreProgress(statCores);

    expect(result.activatedCount).toBe(0);
    expect(result.totalAvailable).toBe(2);
    expect(result.averageGrade).toBe(0);
    // Core I (5 elda, 10 fragments) + Core II (10 elda, 200 fragments)
    expect(result.materialUsed).toEqual({
      soulElda: 15,
      soulEldaFragments: 210,
    });
  });

  test('calculates progress for activated cores', () => {
    const statCores = [
      {
        slot_id: '0',
        stat_grade: 20,
        main_stat_name: 'boss傷害增加',
        sub_stat_name_1: '爆擊傷害增加',
        sub_stat_name_2: '主要屬性增加',
        main_stat_level: 3,
        sub_stat_level_1: 7,
        sub_stat_level_2: 10,
      },
      {
        slot_id: '1',
        stat_grade: 15,
        main_stat_name: '最終傷害增加',
        sub_stat_name_1: '無視防禦力',
        sub_stat_name_2: null,
        main_stat_level: 5,
        sub_stat_level_1: 10,
        sub_stat_level_2: 0,
      },
      {
        slot_id: '2',
        stat_grade: 0, // Unactivated Core III
        main_stat_name: null,
        sub_stat_name_1: null,
        sub_stat_name_2: null,
        main_stat_level: 0,
        sub_stat_level_1: 0,
        sub_stat_level_2: 0,
      },
    ];

    const result = calculateStatCoreProgress(statCores);

    expect(result.activatedCount).toBe(2);
    expect(result.totalAvailable).toBe(3);
    expect(result.averageGrade).toBe(17.5); // (20 + 15) / 2
    // Core III unactivated (15 elda, 350 fragments) + upgrade costs for maxed cores
    expect(result.materialUsed).toEqual({
      soulElda: 15,
      soulEldaFragments: 350 + 220, // Core III + 1 upgrade cost (only Core 0 is maxed)
    });
  });

  test('handles mixed activated and unactivated cores', () => {
    const statCores = [
      {
        slot_id: '0',
        stat_grade: 20, // Fully maxed
        main_stat_name: 'boss傷害增加',
        main_stat_level: 3,
        sub_stat_level_1: 7,
        sub_stat_level_2: 10,
      },
      {
        slot_id: '1',
        stat_grade: 0, // Unactivated
        main_stat_name: null,
        main_stat_level: 0,
        sub_stat_level_1: 0,
        sub_stat_level_2: 0,
      },
      {
        slot_id: '2',
        stat_grade: 10, // Partial (deferred calculation)
        main_stat_name: '最終傷害增加',
        main_stat_level: 2,
        sub_stat_level_1: 5,
        sub_stat_level_2: 3,
      },
    ];

    const result = calculateStatCoreProgress(statCores);

    expect(result.activatedCount).toBe(2); // Only fully maxed and partial count as activated
    expect(result.totalAvailable).toBe(3);
    expect(result.averageGrade).toBe(15); // (20 + 10) / 2
    // Core II unactivated (10 elda, 200 fragments) + upgrade cost for maxed core
    expect(result.materialUsed).toEqual({
      soulElda: 10,
      soulEldaFragments: 200 + 220, // Core II + 1 upgrade cost
    });
  });

  test('calculates material costs correctly for all three cores', () => {
    const statCores = [
      { slot_id: '0', stat_grade: 0 }, // Core I: 5 elda, 10 fragments
      { slot_id: '1', stat_grade: 0 }, // Core II: 10 elda, 200 fragments
      { slot_id: '2', stat_grade: 0 }, // Core III: 15 elda, 350 fragments
    ];

    const result = calculateStatCoreProgress(statCores);

    expect(result.materialUsed).toEqual({
      soulElda: 30, // 5 + 10 + 15
      soulEldaFragments: 560, // 10 + 200 + 350
    });
  });

  test('ignores partial activations in material calculation', () => {
    const statCores = [
      { slot_id: '0', stat_grade: 5 }, // Partial - no material cost added
      { slot_id: '1', stat_grade: 0 }, // Unactivated - material cost added
      { slot_id: '2', stat_grade: 18 }, // Partial - no material cost added
    ];

    const result = calculateStatCoreProgress(statCores);

    // Only Core II unactivated cost: 10 elda, 200 fragments
    expect(result.materialUsed).toEqual({
      soulElda: 10,
      soulEldaFragments: 200,
    });
  });
});
