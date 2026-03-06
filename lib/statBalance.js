import {
  extractEquipmentStats,
  identifyIndependentItems,
} from './combatPowerCalculator.js';

// Boss defense rate for end-game bosses (300%)
const BOSS_DEF_RATE = 3.0;
// Base critical damage before any equipment bonuses (class passive average)
const BASE_CRIT_DMG = 37;

const AXES = [
  { key: 'mainEquiv',   label: '主屬性' },
  { key: 'atkEquiv',    label: '攻擊力' },
  { key: 'atkPctEquiv', label: '攻擊力%' },
  { key: 'bossEquiv',   label: 'Boss傷害' },
  { key: 'critEquiv',   label: '爆擊傷害' },
  { key: 'ignoreEquiv', label: '無視防禦' },
];

export function extractBalanceStats(statsData, equipmentData) {
  const finalStats = statsData?.final_stat || [];

  const getStat = (...names) => {
    for (const name of names) {
      const entry = finalStats.find(s => s.stat_name === name);
      if (entry) return parseFloat(entry.stat_value || '0');
    }
    return 0;
  };

  // Determine main and sub stats
  const statValues = [
    getStat('STR'),
    getStat('DEX'),
    getStat('INT'),
    getStat('LUK'),
  ];
  statValues.sort((a, b) => b - a);
  const mainStat = statValues[0];
  const subStat = statValues[1];

  const atkValue = Math.max(
    getStat('공격력', '攻擊力', '物理攻擊力'),
    getStat('마력', '魔法攻擊力')
  );

  const bossDmg = getStat(
    'BOSS怪物傷害',
    'Boss攻擊時傷害',
    'Boss 攻擊時傷害',
    '보스 몬스터 공격 시 데미지',
    'Boss 몬스터 공격 시 데미지'
  );

  const critDmg = getStat('爆擊傷害', '크리티컬 데미지');

  const ignoreDef = getStat('無視防禦率', '無視防禦', '防禦無視', '무시 방어율', '방어율 무시');

  let atkPct = 0;
  let statPct = 0;
  let dmgPct = 0;
  if (equipmentData) {
    try {
      const presetNo = equipmentData.preset_no || 1;
      const presetItems = equipmentData[`item_equipment_preset_${presetNo}`] || [];
      const independentItems = identifyIndependentItems(equipmentData);
      const stats = extractEquipmentStats([...presetItems, ...independentItems]);
      atkPct = Math.max(stats.percent.attack_power, stats.percent.magic_power);
      statPct = Math.max(stats.percent.STR, stats.percent.DEX, stats.percent.INT, stats.percent.LUK);
      dmgPct = stats.percent.damage + stats.percent.boss_damage;
    } catch {
      // Equipment parsing is non-critical; fall back to 0%
    }
  }

  return { mainStat, subStat, atkValue, atkPct, statPct, dmgPct, bossDmg, critDmg, ignoreDef };
}

export function computeEquivStats({ mainStat, subStat, atkPct, statPct, dmgPct, bossDmg, critDmg, ignoreDef }) {
  const statFactor = 4 * mainStat + subStat;

  // Main stat: total stat investment (raw stat points)
  const mainEquiv = mainStat + subStat;

  // ATK: stat factor amplified by ATK% from equipment
  const atkEquiv = (statFactor / 4) * (1 + atkPct / 100);

  // ATK%: represents stat% amplification from equipment
  const atkPctEquiv = mainEquiv * (1 + statPct / 100);

  // Boss: boss% share of total damage% bucket
  const totalDmgBucket = 100 + bossDmg + dmgPct;
  const bossEquiv = atkEquiv * bossDmg / totalDmgBucket;

  // Crit: crit% share of total crit bucket (including base crit damage)
  const totalCritBucket = BASE_CRIT_DMG + critDmg;
  const critEquiv = atkEquiv * critDmg / totalCritBucket;

  // IED: defense penetration contribution against end-game bosses
  const defResidual = 1 - ignoreDef / 100;
  const critFactor = 1 + critDmg / 100;
  const ignoreEquiv = Math.max(0, atkEquiv * (1 - BOSS_DEF_RATE * defResidual * critFactor));

  return { mainEquiv, atkEquiv, atkPctEquiv, bossEquiv, critEquiv, ignoreEquiv };
}

export function computeBalanceRatios(equivStats) {
  const values = AXES.map(a => equivStats[a.key]);
  const total = values.reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;
  const balance = total / AXES.length;
  return AXES.map(({ key, label }) => ({
    axis: label,
    ratio: equivStats[key] / balance,
    equiv: equivStats[key],
  }));
}

export function getRecommendations(ratios) {
  if (!ratios) return [];
  return [...ratios]
    .filter(r => r.ratio < 1.0)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 2)
    .map(r => ({ axis: r.axis, pct: Math.round(r.ratio * 100) }));
}
