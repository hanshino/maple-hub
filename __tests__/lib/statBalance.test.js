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
    makeStat('보스 몬스터 공격 시 데미지', 150),
    makeStat('爆擊傷害', 60),
    makeStat('무시 방어율', 80),
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
    expect(result.atkValue).toBe(0);
  });

  it('handles null inputs gracefully', () => {
    const result = extractBalanceStats(null, null);
    expect(result.mainStat).toBe(0);
    expect(result.atkValue).toBe(0);
  });
});

describe('computeEquivStats', () => {
  it('converts raw stats to equivalent main stat values', () => {
    const raw = {
      mainStat: 100000,
      atkValue: 10000,
      atkPct: 60,
      bossDmg: 200,
      critDmg: 80,
      ignoreDef: 90,
    };
    const equiv = computeEquivStats(raw);

    expect(equiv.mainEquiv).toBe(100000);
    expect(equiv.atkEquiv).toBe(40000);         // 10000 × 4
    expect(equiv.atkPctEquiv).toBe(60000);       // 0.60 × 100000
    expect(equiv.bossEquiv).toBe(6000);          // 200 × 30
    expect(equiv.critEquiv).toBe(9600);          // 80 × 120
    expect(equiv.ignoreEquiv).toBeCloseTo(90000, 0);
  });

  it('returns 0 for ignoreDef=0', () => {
    const raw = { mainStat: 100000, atkValue: 0, atkPct: 0, bossDmg: 0, critDmg: 0, ignoreDef: 0 };
    const equiv = computeEquivStats(raw);
    expect(equiv.ignoreEquiv).toBe(0);
  });

  it('returns mainStat for ignoreDef=100', () => {
    const raw = { mainStat: 100000, atkValue: 0, atkPct: 0, bossDmg: 0, critDmg: 0, ignoreDef: 100 };
    const equiv = computeEquivStats(raw);
    expect(equiv.ignoreEquiv).toBeCloseTo(100000, 0);
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

  it('returns empty array when all axes above balance', () => {
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
