import {
  extractEquipmentStats,
  identifyIndependentItems,
} from './combatPowerCalculator.js';

const BOSS_DEF_RATE = 0.5;

const AXIS_KEYS = ['mainEquiv', 'atkEquiv', 'atkPctEquiv', 'bossEquiv', 'critEquiv', 'ignoreEquiv'];
const AXIS_LABELS = ['主屬性', '攻擊力', '攻擊力%', 'Boss傷害', '爆擊傷害', '無視防禦'];

export function extractBalanceStats(statsData, equipmentData) {
  const finalStats = statsData?.final_stat || [];

  const getStat = (...names) => {
    for (const name of names) {
      const entry = finalStats.find(s => s.stat_name === name);
      if (entry) return parseFloat(entry.stat_value || '0');
    }
    return 0;
  };

  const mainStat = Math.max(
    getStat('STR'),
    getStat('DEX'),
    getStat('INT'),
    getStat('LUK')
  );

  const atkValue = Math.max(
    getStat('공격력', '攻擊力', '物理攻擊力'),
    getStat('마력', '魔法攻擊力')
  );

  const bossDmg = getStat(
    '보스 몬스터 공격 시 데미지',
    'Boss 몬스터 공격 시 데미지',
    'Boss攻擊時傷害',
    'Boss 攻擊時傷害'
  );

  const critDmg = getStat('크리티컬 데미지', '爆擊傷害');

  const ignoreDef = getStat('무시 방어율', '방어율 무시', '無視防禦', '防禦無視');

  let atkPct = 0;
  if (equipmentData) {
    try {
      const presetNo = equipmentData.preset_no || 1;
      const presetItems = equipmentData[`item_equipment_preset_${presetNo}`] || [];
      const independentItems = identifyIndependentItems(equipmentData);
      const stats = extractEquipmentStats([...presetItems, ...independentItems]);
      atkPct = Math.max(stats.percent.attack_power, stats.percent.magic_power);
    } catch {
      atkPct = 0;
    }
  }

  return { mainStat, atkValue, atkPct, bossDmg, critDmg, ignoreDef };
}

export function computeEquivStats({ mainStat, atkValue, atkPct, bossDmg, critDmg, ignoreDef }) {
  const mainEquiv = mainStat;
  const atkEquiv = atkValue * 4;
  const atkPctEquiv = (atkPct / 100) * mainStat;
  const bossEquiv = bossDmg * 30;
  const critEquiv = critDmg * 120;
  const iefFactor = 1 - BOSS_DEF_RATE * (1 - ignoreDef / 100);
  const ignoreEquiv = ((iefFactor - BOSS_DEF_RATE) / (1 - BOSS_DEF_RATE)) * mainStat;
  return { mainEquiv, atkEquiv, atkPctEquiv, bossEquiv, critEquiv, ignoreEquiv };
}

export function computeBalanceRatios(equivStats) {
  const values = AXIS_KEYS.map(k => equivStats[k]);
  const total = values.reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;
  const balance = total / 6;
  return AXIS_KEYS.map((key, i) => ({
    axis: AXIS_LABELS[i],
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
