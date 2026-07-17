// Presentation-only labels and number formatting for the /compare feature.
//
// These helpers translate and format values already produced by
// lib/characterComparison.js (category/metric names, evidence levels,
// deltas). They never recompute a delta, evidence level, direction, or
// coverage — that classification lives exclusively in the pure
// comparison layer.

// Stable inspection/tab order shared by CompareTabs and UpgradeChecklist,
// matching lib/characterComparison.js's CATEGORY_ORDER labels.
export const CATEGORY_LABELS = {
  Equipment: '裝備',
  Symbols: '符文',
  Union: '聯盟',
  HEXA: 'HEXA',
  'Hyper Stat': '極限屬性',
  'Link Skill': '連結技能',
  'Set Effects': '套裝效果',
  Familiar: '萌獸',
};

export const EVIDENCE_LABELS = {
  'api-fact': 'API',
  derived: '推導',
  'model-estimate': '估計',
  unknown: '未知',
};

// Maps evidence levels to MUI Chip `color` values, mirroring the mockup's
// badge palette (good/accent/warn/unknown).
export const EVIDENCE_COLORS = {
  'api-fact': 'success',
  derived: 'primary',
  'model-estimate': 'warning',
  unknown: 'default',
};

// Normalized-category keys (as produced by normalizeCharacterForComparison)
// paired with their display label, in the spec's stable tab/inspection
// order. Shared by DataQualityNotice (missing-category list) and
// CompareTabs (tab disabling) so both read the same structural-coverage
// flags and never drift apart.
export const CATEGORY_COVERAGE = [
  { key: 'equipment', label: '裝備' },
  { key: 'symbols', label: '符文' },
  { key: 'hexa', label: 'HEXA' },
  { key: 'union', label: '聯盟' },
  { key: 'hyperStat', label: '極限屬性' },
  { key: 'linkSkill', label: '連結技能' },
  { key: 'setEffects', label: '套裝效果' },
  { key: 'familiar', label: '萌獸' },
];

const STAT_METRIC_LABELS = {
  attack: '攻擊力',
  damage: '傷害',
  bossDamage: 'Boss 傷害',
  ied: '無視防禦',
  critRate: '爆擊率',
  critDamage: '爆擊傷害',
};

// Category headline-row metric names (from `comparison.categories`), used
// by the upgrade checklist and progression summary cards.
const CATEGORY_METRIC_LABELS = {
  currentEquipmentStarSum: '現有裝備星力總和',
  finalStatStarForce: '面板星力',
  baseAttackSum: '白值攻擊力總和',
  baseMagicSum: '白值魔力總和',
  starforceAttackSum: '星力攻擊力總和',
  starforceMagicSum: '星力魔力總和',
  scrollAttackSum: '卷軸攻擊力總和',
  scrollMagicSum: '卷軸魔力總和',
  flameAttackSum: '星火攻擊力總和',
  flameMagicSum: '星火魔力總和',
  totalAttackSum: '裝備攻擊力合計',
  totalMagicSum: '裝備魔力合計',
  petAttackSum: '寵物裝備攻擊力總和',
  petMagicSum: '寵物裝備魔力總和',
  cashAttackSum: '現金道具攻擊力總和',
  cashMagicSum: '現金道具魔力總和',
  totalSymbolLevel: '符文等級總和',
  unionLevel: '聯盟等級',
  raiderStatCount: '聯盟戰地屬性項目數',
  authenticForce: '真實之力',
  totalHexaCoreLevel: 'HEXA 核心等級總和',
  totalHexaStatLevel: 'HEXA 屬性等級總和',
  totalHyperStatLevel: '極限屬性等級總和',
  totalLinkSkillLevel: '連結技能等級總和',
  totalSetEffectCount: '套裝件數總和',
  summonedFamiliarFinalDamage: '裝備中萌獸最終傷害',
  registeredFamiliarCount: '已登錄萌獸數',
  linkedFamiliarCount: '羈絆連結數',
};

/**
 * Human label for a `category: 'stats'` row metric, including the dynamic
 * `mainStat:LUK` form produced by compareCharacters.
 */
export function statMetricLabel(metric) {
  if (!metric) return '';
  if (metric.startsWith('mainStat')) {
    const key = metric.split(':')[1];
    return key ? `${key}（主屬性）` : '主屬性';
  }
  return STAT_METRIC_LABELS[metric] || metric;
}

export function categoryMetricLabel(metric) {
  return CATEGORY_METRIC_LABELS[metric] || metric;
}

/**
 * Formats a raw (non-delta) row value for display. `pp`-unit values are
 * API percentages (e.g. boss damage, crit rate) — shown with a `%` suffix,
 * never as relative growth (see spec's Units section).
 */
export function formatRawValue(value, unit) {
  if (value === null || value === undefined) return '未知';
  if (unit === 'pp') return `${value}%`;
  if (typeof value === 'number') return value.toLocaleString('en-US');
  return String(value);
}

/**
 * Formats a signed delta for display. `pp`-unit deltas are percentage
 * points, per the spec's Units section — never relative growth.
 */
export function formatDelta(value, unit) {
  if (value === null || value === undefined) return '未知';
  if (value === 0) return unit === 'pp' ? '±0pp' : '±0';
  const sign = value > 0 ? '+' : '-';
  const magnitude = Math.abs(value).toLocaleString('en-US');
  return unit === 'pp' ? `${sign}${magnitude}pp` : `${sign}${magnitude}`;
}

/** Formats an integer count/level for plain display (no sign, no unit). */
export function formatPlain(value) {
  if (value === null || value === undefined) return '未知';
  return typeof value === 'number' ? value.toLocaleString('en-US') : String(value);
}
