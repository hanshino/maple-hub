// Shared Nexon final-stat alias table, used by lib/characterComparison.js
// and lib/statBalance.js to look up `stats.final_stat` entries by metric.
// Traditional Chinese names are the primary form used by this app; Korean
// fallbacks are kept for parity across server locales. `bossDamage`
// includes an extra Korean alias ('Boss 몬스터 공격 시 데미지') that only
// existed in lib/statBalance.js's original list before this hoist.
export const STAT_ALIASES = {
  STR: ['STR'],
  DEX: ['DEX'],
  INT: ['INT'],
  LUK: ['LUK'],
  attack: ['攻擊力', '공격력', '物理攻擊力'],
  magicPower: ['魔法攻擊力', '마력'],
  damage: ['傷害'],
  bossDamage: [
    'BOSS怪物傷害',
    'Boss攻擊時傷害',
    'Boss 攻擊時傷害',
    '보스 몬스터 공격 시 데미지',
    'Boss 몬스터 공격 시 데미지',
  ],
  ied: ['無視防禦率', '無視防禦', '防禦無視', '무시 방어율', '방어율 무시'],
  critRate: ['暴擊率', '爆擊率', '크리티컬 확률'],
  critDamage: ['爆擊傷害', '크리티컬 데미지'],
  starForceFinal: ['星力'],
  authenticForce: ['真實之力'],
};

/**
 * First-match lookup across `stats.final_stat` entries for a list of
 * alias names, in priority order. Returns the raw `stat_value` string
 * (never parsed to a number) — callers apply their own numeric
 * conversion, since lib/characterComparison.js and lib/statBalance.js
 * parsed differently (null-safe float vs `parseFloat(value || '0')`
 * defaulting to 0) before this hoist.
 *
 * @param {Array<{stat_name: string, stat_value: string}>} finalStatList
 * @param {string[]} names - alias names to try, in priority order
 * @returns {string|null} raw stat_value of the first match, or null
 */
export function getFinalStat(finalStatList, names) {
  if (!Array.isArray(finalStatList) || finalStatList.length === 0) {
    return null;
  }
  for (const name of names) {
    const entry = finalStatList.find(s => s.stat_name === name);
    if (entry) return entry.stat_value ?? null;
  }
  return null;
}
