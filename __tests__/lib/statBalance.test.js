import {
  extractBalanceStats,
  computeEquivStats,
  computeBalanceRatios,
  getRecommendations,
} from '../../lib/statBalance.js';

const makeStat = (name, value) => ({ stat_name: name, stat_value: String(value) });

const mockStatsData = {
  final_stat: [
    makeStat('STR', 1000),
    makeStat('DEX', 500),
    makeStat('INT', 200),
    makeStat('LUK', 300),
    makeStat('攻擊力', 3000),
    makeStat('魔法攻擊力', 100),
    makeStat('BOSS怪物傷害', 150),
    makeStat('爆擊傷害', 60),
    makeStat('無視防禦率', 80),
  ],
};

const mockEquipmentData = {
  preset_no: 1,
  item_equipment_preset_1: [],
  item_equipment_preset_2: [],
  item_equipment_preset_3: [],
  item_equipment: [],
};

describe('extractBalanceStats', () => {
  it('extracts mainStat as the highest of STR/DEX/INT/LUK', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.mainStat).toBe(1000);
  });

  it('extracts subStat as the second highest of STR/DEX/INT/LUK', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.subStat).toBe(500);
  });

  it('extracts atkValue as max of 攻擊力 and 魔法攻擊力', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.atkValue).toBe(3000);
  });

  it('extracts bossDmg from final_stat', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.bossDmg).toBe(150);
  });

  it('extracts critDmg from final_stat', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.critDmg).toBe(60);
  });

  it('extracts ignoreDef from final_stat', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.ignoreDef).toBe(80);
  });

  it('returns zeros for missing stats', () => {
    const result = extractBalanceStats({ final_stat: [] }, mockEquipmentData);
    expect(result.mainStat).toBe(0);
    expect(result.subStat).toBe(0);
    expect(result.atkValue).toBe(0);
  });

  it('handles null inputs gracefully', () => {
    const result = extractBalanceStats(null, null);
    expect(result.mainStat).toBe(0);
    expect(result.subStat).toBe(0);
    expect(result.atkValue).toBe(0);
  });
});

describe('computeEquivStats', () => {
  const baseRaw = {
    mainStat: 92434,
    subStat: 9453,
    atkPct: 40,
    statPct: 36,
    dmgPct: 28,
    bossDmg: 531,
    critDmg: 123.25,
    ignoreDef: 96.2,
  };

  it('mainEquiv = mainStat + subStat', () => {
    const equiv = computeEquivStats(baseRaw);
    expect(equiv.mainEquiv).toBe(92434 + 9453);
  });

  it('atkEquiv = statFactor/4 × (1 + atkPct/100)', () => {
    const equiv = computeEquivStats(baseRaw);
    const statFactor = 4 * 92434 + 9453;
    const expected = (statFactor / 4) * (1 + 40 / 100);
    expect(equiv.atkEquiv).toBeCloseTo(expected, 0);
  });

  it('atkPctEquiv = mainEquiv × (1 + statPct/100)', () => {
    const equiv = computeEquivStats(baseRaw);
    const expected = (92434 + 9453) * (1 + 36 / 100);
    expect(equiv.atkPctEquiv).toBeCloseTo(expected, 0);
  });

  it('bossEquiv uses bossDmg share of total damage bucket', () => {
    const equiv = computeEquivStats(baseRaw);
    const statFactor = 4 * 92434 + 9453;
    const atkEquiv = (statFactor / 4) * (1 + 40 / 100);
    const expected = atkEquiv * 531 / (100 + 531 + 28);
    expect(equiv.bossEquiv).toBeCloseTo(expected, 0);
  });

  it('critEquiv uses critDmg share of total crit bucket', () => {
    const equiv = computeEquivStats(baseRaw);
    const statFactor = 4 * 92434 + 9453;
    const atkEquiv = (statFactor / 4) * (1 + 40 / 100);
    const expected = atkEquiv * 123.25 / (37 + 123.25);
    expect(equiv.critEquiv).toBeCloseTo(expected, 0);
  });

  it('ignoreEquiv accounts for boss defense and crit factor', () => {
    const equiv = computeEquivStats(baseRaw);
    const statFactor = 4 * 92434 + 9453;
    const atkEquiv = (statFactor / 4) * (1 + 40 / 100);
    const defResidual = 1 - 96.2 / 100;
    const critFactor = 1 + 123.25 / 100;
    const expected = atkEquiv * (1 - 3.0 * defResidual * critFactor);
    expect(equiv.ignoreEquiv).toBeCloseTo(expected, 0);
  });

  it('returns 0 for ignoreEquiv when IED is 0', () => {
    const raw = { ...baseRaw, ignoreDef: 0, critDmg: 0 };
    const equiv = computeEquivStats(raw);
    // With 0 IED and 300% boss defense: 1 - 3.0 * 1.0 * 1.0 = -2.0 → clamped to 0
    expect(equiv.ignoreEquiv).toBe(0);
  });

  it('ignoreEquiv equals atkEquiv when IED is 100', () => {
    const raw = { ...baseRaw, ignoreDef: 100, critDmg: 0 };
    const equiv = computeEquivStats(raw);
    // With 100% IED: defResidual=0, so 1 - 3.0*0*1 = 1 → ignoreEquiv = atkEquiv
    expect(equiv.ignoreEquiv).toBeCloseTo(equiv.atkEquiv, 0);
  });

  it('handles zero stats gracefully', () => {
    const raw = {
      mainStat: 0, subStat: 0, atkPct: 0, statPct: 0,
      dmgPct: 0, bossDmg: 0, critDmg: 0, ignoreDef: 0,
    };
    const equiv = computeEquivStats(raw);
    expect(equiv.mainEquiv).toBe(0);
    expect(equiv.atkEquiv).toBe(0);
    expect(equiv.bossEquiv).toBe(0);
  });
});

describe('computeBalanceRatios', () => {
  it('returns ratios relative to the average (balance point)', () => {
    const equivStats = {
      mainEquiv: 1000,
      atkEquiv: 1000,
      atkPctEquiv: 1000,
      bossEquiv: 1000,
      critEquiv: 1000,
      ignoreEquiv: 1000,
    };
    const ratios = computeBalanceRatios(equivStats);
    ratios.forEach(r => expect(r.ratio).toBeCloseTo(1.0, 5));
  });

  it('axis with double the equiv has ratio 2.0', () => {
    const equivStats = {
      mainEquiv: 2000,
      atkEquiv: 1000,
      atkPctEquiv: 1000,
      bossEquiv: 1000,
      critEquiv: 1000,
      ignoreEquiv: 1000,
    };
    const ratios = computeBalanceRatios(equivStats);
    const mainRatio = ratios.find(r => r.axis === '主屬性');
    expect(mainRatio.ratio).toBeGreaterThan(1.0);
  });

  it('returns null when total is 0', () => {
    const equivStats = {
      mainEquiv: 0, atkEquiv: 0, atkPctEquiv: 0,
      bossEquiv: 0, critEquiv: 0, ignoreEquiv: 0,
    };
    expect(computeBalanceRatios(equivStats)).toBeNull();
  });

  it('returns array of 6 items with axis labels', () => {
    const equivStats = {
      mainEquiv: 1000, atkEquiv: 1000, atkPctEquiv: 1000,
      bossEquiv: 1000, critEquiv: 1000, ignoreEquiv: 1000,
    };
    const ratios = computeBalanceRatios(equivStats);
    expect(ratios).toHaveLength(6);
    expect(ratios.map(r => r.axis)).toEqual(
      ['主屬性', '攻擊力', '攻擊力%', 'Boss傷害', '爆擊傷害', '無視防禦']
    );
  });
});

describe('getRecommendations', () => {
  it('returns axes below balance, sorted by ratio ascending', () => {
    const ratios = [
      { axis: '主屬性', ratio: 1.2 },
      { axis: '攻擊力', ratio: 0.5 },
      { axis: '攻擊力%', ratio: 1.1 },
      { axis: 'Boss傷害', ratio: 0.8 },
      { axis: '爆擊傷害', ratio: 0.9 },
      { axis: '無視防禦', ratio: 1.3 },
    ];
    const recs = getRecommendations(ratios);
    expect(recs).toHaveLength(2);
    expect(recs[0].axis).toBe('攻擊力');
    expect(recs[1].axis).toBe('Boss傷害');
  });

  it('returns one recommendation when one axis is below balance', () => {
    const ratios = [1.0, 1.1, 1.2, 0.95, 1.3, 1.4].map((ratio, i) => ({
      axis: String(i), ratio,
    }));
    const recs = getRecommendations(ratios);
    expect(recs).toHaveLength(1);
  });

  it('returns empty array for null input', () => {
    expect(getRecommendations(null)).toEqual([]);
  });
});
