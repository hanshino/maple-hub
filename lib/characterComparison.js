/**
 * Pure comparison layer for the /compare character power comparison feature.
 *
 * Three focused, side-effect-free functions:
 *   - normalizeCharacterForComparison(data)
 *   - compareCharacters(left, right)
 *   - rankUpgradeDirections(comparison)
 *
 * `data` is the response shape produced by `getFullCharacterData`
 * (lib/db/queries.js:449-481). See
 * docs/superpowers/specs/2026-07-17-character-power-comparison-design.md
 * for the full semantics implemented here (delta direction, units,
 * evidence levels, cross-class behavior, error/partial-data handling).
 *
 * This module never fetches, dedupes, or caches anything — deciding
 * whether two character names refer to the same character (and skipping
 * a redundant fetch) is a page-level concern, not this layer's.
 */

// Stat-name lookup tables for `stats.final_stat` entries. Traditional
// Chinese names are the primary form used by this app; Korean fallbacks
// are kept for parity with lib/statBalance.js and
// lib/characterSyncService.js. There is no confirmed sample for
// critical-rate's exact API stat name, so it follows the naming
// convention already used for critical damage in this codebase.
const STAT_NAMES = {
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
  ],
  ied: ['無視防禦率', '無視防禦', '防禦無視', '무시 방어율', '방어율 무시'],
  critRate: ['暴擊率', '爆擊率', '크리티컬 확률'],
  critDamage: ['爆擊傷害', '크리티컬 데미지'],
  starForceFinal: ['星力'],
  authenticForce: ['真實之力'],
};

// Stable inspection order for rankUpgradeDirections — a V1 product rule
// and testable tie-break, not a claim that an earlier category produces
// more combat power.
const CATEGORY_ORDER = [
  'Equipment',
  'Symbols',
  'Union',
  'HEXA',
  'Hyper Stat',
  'Link Skill',
  'Set Effects',
  'Familiar',
];

function numOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const num =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).replace(/[%,]/g, ''));
  return Number.isNaN(num) ? null : num;
}

function pickHigher(...values) {
  const present = values.filter(v => v !== null && v !== undefined);
  if (present.length === 0) return null;
  return Math.max(...present);
}

function roundTo(value, decimals) {
  if (value === null || value === undefined) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sumField(list, field) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.reduce((sum, row) => sum + (numOrNull(row?.[field]) ?? 0), 0);
}

// Sums a numeric field nested inside an option object (e.g. the
// scroll-granted attack in item_etc_option.attack_power).
function sumOptionField(list, optionKey, field) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.reduce(
    (sum, row) => sum + (numOrNull(row?.[optionKey]?.[field]) ?? 0),
    0
  );
}

// A preset number is treated as unknown (never defaulted) when the
// source field is absent, matching the spec's rule for
// `linkSkills.use_preset_no`.
function presetNoOrNull(rawPresetNo) {
  if (rawPresetNo === null || rawPresetNo === undefined || rawPresetNo === '') {
    return null;
  }
  return String(rawPresetNo);
}

/**
 * Extracts identity, snapshot metadata, and category data from a
 * `getFullCharacterData`-shaped response into a UI-neutral normalized
 * form. Missing or empty categories are represented as `null`/`coverage:
 * false`, never as zero.
 *
 * @param {object} data - full character response (see lib/db/queries.js)
 * @returns {object} normalized character
 */
export function normalizeCharacterForComparison(data) {
  const basic = data?.basicInfo || {};
  const finalStatList = data?.stats?.final_stat;
  const hasFinalStats =
    Array.isArray(finalStatList) && finalStatList.length > 0;

  const getStat = (...names) => {
    if (!hasFinalStats) return null;
    for (const name of names) {
      const entry = finalStatList.find(s => s.stat_name === name);
      if (entry) {
        const parsed = numOrNull(entry.stat_value);
        if (parsed !== null) return parsed;
      }
    }
    return null;
  };

  const str = getStat(...STAT_NAMES.STR);
  const dex = getStat(...STAT_NAMES.DEX);
  const intStat = getStat(...STAT_NAMES.INT);
  const luk = getStat(...STAT_NAMES.LUK);

  const mainStatCandidates = { STR: str, DEX: dex, INT: intStat, LUK: luk };
  let mainStatKey = null;
  let mainStatBest = null;
  for (const [key, value] of Object.entries(mainStatCandidates)) {
    if (value === null) continue;
    if (mainStatBest === null || value > mainStatBest) {
      mainStatKey = key;
      mainStatBest = value;
    }
  }

  const finalStats = {
    coverage: hasFinalStats,
    mainStatKey,
    values: {
      STR: str,
      DEX: dex,
      INT: intStat,
      LUK: luk,
      attack: pickHigher(
        getStat(...STAT_NAMES.attack),
        getStat(...STAT_NAMES.magicPower)
      ),
      damage: getStat(...STAT_NAMES.damage),
      bossDamage: getStat(...STAT_NAMES.bossDamage),
      ied: getStat(...STAT_NAMES.ied),
      critRate: getStat(...STAT_NAMES.critRate),
      critDamage: getStat(...STAT_NAMES.critDamage),
      starForceFinal: getStat(...STAT_NAMES.starForceFinal),
      authenticForce: getStat(...STAT_NAMES.authenticForce),
    },
  };

  const activeEquipmentItems = data?.equipment?.item_equipment;
  const hasEquipment =
    Array.isArray(activeEquipmentItems) && activeEquipmentItems.length > 0;
  const equipment = {
    coverage: hasEquipment,
    activePresetNo: numOrNull(
      data?.equipment_presets?.active ?? data?.equipment?.preset_no
    ),
    starSum: hasEquipment ? sumField(activeEquipmentItems, 'starforce') : null,
    // Scroll-granted (item_etc_option) attack/magic across the active
    // items — the quantitative scroll progress next to the star sum.
    scrollAttackSum: hasEquipment
      ? sumOptionField(activeEquipmentItems, 'item_etc_option', 'attack_power')
      : null,
    scrollMagicSum: hasEquipment
      ? sumOptionField(activeEquipmentItems, 'item_etc_option', 'magic_power')
      : null,
    itemCount: hasEquipment ? activeEquipmentItems.length : null,
  };

  const hyperActivePresetNo = presetNoOrNull(data?.hyperStats?.use_preset_no);
  const hyperActiveList = hyperActivePresetNo
    ? data?.hyperStats?.[`hyper_stat_preset_${hyperActivePresetNo}`]
    : null;
  const hasHyperStat =
    Array.isArray(hyperActiveList) && hyperActiveList.length > 0;
  const hyperStat = {
    coverage: hasHyperStat,
    activePresetNo: hyperActivePresetNo,
    totalLevel: hasHyperStat ? sumField(hyperActiveList, 'stat_level') : null,
  };

  const linkActivePresetNo = presetNoOrNull(data?.linkSkills?.use_preset_no);
  const linkActiveList = linkActivePresetNo
    ? data?.linkSkills?.[`character_link_skill_preset_${linkActivePresetNo}`]
    : null;
  const hasLinkSkill =
    Array.isArray(linkActiveList) && linkActiveList.length > 0;
  const linkSkill = {
    coverage: hasLinkSkill,
    // Absent `use_preset_no` stays unknown; never inferred from a
    // heuristic preset-classification guess.
    activePresetNo: linkActivePresetNo,
    ownedSkillName: data?.linkSkills?.character_owned_link_skill ?? null,
    totalLevel: hasLinkSkill ? sumField(linkActiveList, 'skill_level') : null,
  };

  const unionObj = data?.union;
  const hasUnion = !!unionObj;
  const union = {
    coverage: hasUnion,
    level: hasUnion ? numOrNull(unionObj.union_level) : null,
    grade: hasUnion ? (unionObj.union_grade ?? null) : null,
    artifactLevel: hasUnion ? numOrNull(unionObj.union_artifact_level) : null,
  };

  // Union Raider stats are compared, but the current full-character
  // response never persists which Raider preset was active — no
  // `activePresetNo` field is invented here (see spec's Error and
  // Partial-data Handling: "Union Raider preset number").
  const raiderStatList = data?.unionRaider?.union_raider_stat;
  const hasRaiderStats =
    Array.isArray(raiderStatList) && raiderStatList.length > 0;
  const unionRaider = {
    coverage: hasRaiderStats,
    statCount: hasRaiderStats ? raiderStatList.length : null,
  };

  // HEXA measures 6th-job skill progression (hexamatrix core levels) —
  // NOT Authentic Force, which comes from authentic symbols and belongs
  // to the Symbols category below.
  const hexaCoreList = data?.hexaCores?.character_hexa_core_equipment;
  const hasHexaCores = Array.isArray(hexaCoreList) && hexaCoreList.length > 0;
  // HEXA stat cores arrive as up to 3 active arrays
  // (character_hexa_stat_core{,_2,_3}); presets are never stored, so a
  // flat sum of main+sub levels counts each core exactly once.
  const hexaStatCores = data?.hexaStats
    ? Object.values(data.hexaStats).flat()
    : [];
  const hasHexaStats = hexaStatCores.length > 0;
  const hexa = {
    coverage: hasHexaCores,
    coreCount: hasHexaCores ? hexaCoreList.length : null,
    totalCoreLevel: hasHexaCores
      ? sumField(hexaCoreList, 'hexa_core_level')
      : null,
    totalStatLevel: hasHexaStats
      ? hexaStatCores.reduce(
          (sum, core) =>
            sum +
            (numOrNull(core?.main_stat_level) ?? 0) +
            (numOrNull(core?.sub_stat_level_1) ?? 0) +
            (numOrNull(core?.sub_stat_level_2) ?? 0),
          0
        )
      : null,
  };

  const symbolList = data?.symbols?.symbol;
  const hasSymbols = Array.isArray(symbolList) && symbolList.length > 0;
  const symbols = {
    coverage: hasSymbols,
    count: hasSymbols ? symbolList.length : null,
    totalLevel: hasSymbols ? sumField(symbolList, 'symbol_level') : null,
    // Authentic Force is an API-fact final-stat figure fed by authentic
    // symbols, so it lives here rather than under HEXA.
    authenticForce: finalStats.values.authenticForce,
  };

  const setEffectList = data?.setEffects?.set_effect;
  const hasSetEffects =
    Array.isArray(setEffectList) && setEffectList.length > 0;
  const setEffects = {
    coverage: hasSetEffects,
    count: hasSetEffects ? setEffectList.length : null,
    totalSetCount: hasSetEffects
      ? sumField(setEffectList, 'total_set_count')
      : null,
  };

  // Familiars: what applies in combat is the equipped (summoned_flag)
  // familiar's options — especially 最終傷害. familiar_state='linked'
  // is the separate 羈絆 (bond link) system, kept only as a count.
  // Characters synced before familiar support have no payload at all →
  // coverage false, never zero.
  const familiarList = data?.familiar?.familiar_info;
  const hasFamiliars = Array.isArray(familiarList) && familiarList.length > 0;
  const summonedFamiliars = hasFamiliars
    ? familiarList.filter(f => f?.summoned_flag === 'true')
    : [];
  const linkedFamiliars = hasFamiliars
    ? familiarList.filter(f => f?.familiar_state === 'linked')
    : [];
  const sumFinalDamage = list =>
    list.reduce(
      (sum, f) =>
        sum +
        (Array.isArray(f?.option) ? f.option : []).reduce(
          (optSum, o) =>
            o?.option_name === '最終傷害 (%)'
              ? optSum + (numOrNull(o.option_value) ?? 0)
              : optSum,
          0
        ),
      0
    );
  const familiar = {
    coverage: hasFamiliars,
    registeredCount: hasFamiliars ? familiarList.length : null,
    linkedCount: hasFamiliars ? linkedFamiliars.length : null,
    // A character with familiar data but nothing equipped has a real
    // zero here, not an unknown.
    summonedFinalDamage: hasFamiliars
      ? sumFinalDamage(summonedFamiliars)
      : null,
  };

  return {
    ocid: basic.ocid ?? null,
    name: basic.character_name ?? null,
    class: basic.character_class ?? null,
    level: numOrNull(basic.character_level),
    world: basic.world_name ?? null,
    combatPower: numOrNull(basic.combat_power),
    syncedAt: data?.syncedAt ?? null,
    finalStats,
    equipment,
    hyperStat,
    linkSkill,
    union,
    unionRaider,
    hexa,
    symbols,
    setEffects,
    familiar,
  };
}

function directionOf(delta) {
  if (delta === null || delta === undefined) return 'unknown';
  if (delta > 0) return 'ahead';
  if (delta < 0) return 'behind';
  return 'even';
}

// Builds a UI-neutral comparison row. Delta is always `mine - reference`.
// Boss damage / IED / crit rate / crit damage (unit 'pp') are percentage
// points, never relative growth. A row is only ever "known" when both
// sides have a value; otherwise it is unknown, never a zero delta.
function makeRow({ category, metric, left, right, unit, evidence }) {
  const hasBoth =
    left !== null &&
    left !== undefined &&
    right !== null &&
    right !== undefined;
  const hasEither =
    (left !== null && left !== undefined) ||
    (right !== null && right !== undefined);
  const decimals = unit === 'pp' ? 2 : null;
  const rawDelta = hasBoth ? left - right : null;
  const delta = hasBoth
    ? decimals !== null
      ? roundTo(rawDelta, decimals)
      : rawDelta
    : null;

  return {
    category,
    metric,
    left: left ?? null,
    right: right ?? null,
    delta,
    unit: unit ?? null,
    direction: directionOf(delta),
    evidence: hasBoth ? evidence : 'unknown',
    coverage: hasBoth ? 'complete' : hasEither ? 'partial' : 'unavailable',
  };
}

function worldRow(leftWorld, rightWorld) {
  const known = leftWorld != null && rightWorld != null;
  const hasEither = leftWorld != null || rightWorld != null;
  return {
    category: 'summary',
    metric: 'world',
    left: leftWorld ?? null,
    right: rightWorld ?? null,
    delta: null,
    unit: 'text',
    direction: known
      ? leftWorld === rightWorld
        ? 'same'
        : 'different'
      : 'unknown',
    evidence: known ? 'api-fact' : 'unknown',
    coverage: known ? 'complete' : hasEither ? 'partial' : 'unavailable',
  };
}

function snapshotQualityRow(snapshot) {
  return {
    category: 'summary',
    metric: 'snapshotQuality',
    left: snapshot.leftSyncedAt,
    right: snapshot.rightSyncedAt,
    delta: snapshot.diffMs,
    unit: 'ms',
    direction: 'n/a',
    evidence: snapshot.undated ? 'unknown' : 'derived',
    coverage: snapshot.undated ? 'partial' : 'complete',
    note: snapshot.undated
      ? 'undated snapshot'
      : snapshot.warning
        ? 'snapshot times differ by more than 10 minutes'
        : 'snapshots are within 10 minutes of each other',
  };
}

function headlineText(direction) {
  if (direction === 'ahead') {
    return 'your character is higher than the reference character';
  }
  if (direction === 'behind') {
    return 'your character is lower than the reference character';
  }
  if (direction === 'even') {
    return 'your character and the reference character are equal';
  }
  return 'combat power is unknown for at least one character';
}

/**
 * Compares two normalized characters (the output of
 * `normalizeCharacterForComparison`) and returns a UI-neutral view model.
 * `left` is always "my character"; `right` is always the reference.
 *
 * @param {object} left - normalized "my character"
 * @param {object} right - normalized reference character
 * @returns {object} comparison view model
 */
export function compareCharacters(left, right) {
  const sameClass =
    left?.class != null && right?.class != null && left.class === right.class;

  const leftTime = left?.syncedAt ? new Date(left.syncedAt).getTime() : null;
  const rightTime = right?.syncedAt ? new Date(right.syncedAt).getTime() : null;
  const bothDated =
    leftTime !== null &&
    !Number.isNaN(leftTime) &&
    rightTime !== null &&
    !Number.isNaN(rightTime);
  const diffMs = bothDated ? Math.abs(leftTime - rightTime) : null;
  const snapshot = {
    leftSyncedAt: left?.syncedAt ?? null,
    rightSyncedAt: right?.syncedAt ?? null,
    undated: !bothDated,
    diffMs,
    warning: diffMs !== null && diffMs > 10 * 60 * 1000,
  };

  const leftCp = left?.combatPower ?? null;
  const rightCp = right?.combatPower ?? null;
  const hasCp = leftCp !== null && rightCp !== null;
  const combatDelta = hasCp ? leftCp - rightCp : null;
  const relativePct =
    hasCp && leftCp !== 0
      ? roundTo(((rightCp - leftCp) / leftCp) * 100, 3)
      : null;
  const combatDirection = directionOf(combatDelta);
  const headline = {
    metric: 'combatPower',
    left: leftCp,
    right: rightCp,
    delta: combatDelta,
    relativePct,
    unit: null,
    direction: combatDirection,
    evidence: hasCp ? 'api-fact' : 'unknown',
    coverage: hasCp
      ? 'complete'
      : leftCp !== null || rightCp !== null
        ? 'partial'
        : 'unavailable',
    text: headlineText(combatDirection),
  };

  const rows = [
    makeRow({
      category: 'headline',
      metric: 'combatPower',
      left: leftCp,
      right: rightCp,
      unit: null,
      evidence: 'api-fact',
    }),
    makeRow({
      category: 'summary',
      metric: 'level',
      left: left?.level ?? null,
      right: right?.level ?? null,
      unit: null,
      evidence: 'api-fact',
    }),
    worldRow(left?.world ?? null, right?.world ?? null),
    makeRow({
      category: 'summary',
      metric: 'unionLevel',
      left: left?.union?.level ?? null,
      right: right?.union?.level ?? null,
      unit: null,
      evidence: 'api-fact',
    }),
    makeRow({
      category: 'summary',
      metric: 'symbolProgress',
      left: left?.symbols?.totalLevel ?? null,
      right: right?.symbols?.totalLevel ?? null,
      unit: null,
      evidence: 'derived',
    }),
    snapshotQualityRow(snapshot),
  ];

  // Same-class comparisons get complete observed-stat rows. Cross-class
  // comparisons stop at the common summaries above — no main-stat rows,
  // per the spec's Cross-class Behavior section.
  if (sameClass) {
    const mainStatKey = left?.finalStats?.mainStatKey ?? null;
    rows.push(
      makeRow({
        category: 'stats',
        metric: mainStatKey ? `mainStat:${mainStatKey}` : 'mainStat',
        left: mainStatKey ? left.finalStats.values[mainStatKey] : null,
        right: mainStatKey
          ? (right?.finalStats?.values?.[mainStatKey] ?? null)
          : null,
        unit: null,
        evidence: 'api-fact',
      }),
      makeRow({
        category: 'stats',
        metric: 'attack',
        left: left?.finalStats?.values?.attack ?? null,
        right: right?.finalStats?.values?.attack ?? null,
        unit: null,
        evidence: 'api-fact',
      }),
      // Percentage-point delta per the spec's Units section: "Damage,
      // boss damage, IED, critical rate, and critical damage use
      // percentage points" (docs/superpowers/specs/
      // 2026-07-17-character-power-comparison-design.md:279-280).
      makeRow({
        category: 'stats',
        metric: 'damage',
        left: left?.finalStats?.values?.damage ?? null,
        right: right?.finalStats?.values?.damage ?? null,
        unit: 'pp',
        evidence: 'api-fact',
      }),
      makeRow({
        category: 'stats',
        metric: 'bossDamage',
        left: left?.finalStats?.values?.bossDamage ?? null,
        right: right?.finalStats?.values?.bossDamage ?? null,
        unit: 'pp',
        evidence: 'api-fact',
      }),
      makeRow({
        category: 'stats',
        metric: 'ied',
        left: left?.finalStats?.values?.ied ?? null,
        right: right?.finalStats?.values?.ied ?? null,
        unit: 'pp',
        evidence: 'api-fact',
      }),
      makeRow({
        category: 'stats',
        metric: 'critRate',
        left: left?.finalStats?.values?.critRate ?? null,
        right: right?.finalStats?.values?.critRate ?? null,
        unit: 'pp',
        evidence: 'api-fact',
      }),
      makeRow({
        category: 'stats',
        metric: 'critDamage',
        left: left?.finalStats?.values?.critDamage ?? null,
        right: right?.finalStats?.values?.critDamage ?? null,
        unit: 'pp',
        evidence: 'api-fact',
      })
    );
  }

  const categories = {
    equipment: {
      activePresetNo: {
        left: left?.equipment?.activePresetNo ?? null,
        right: right?.equipment?.activePresetNo ?? null,
      },
      // Derived aggregate — distinct from the final-stat Star Force
      // value below.
      starSum: makeRow({
        category: 'Equipment',
        metric: 'currentEquipmentStarSum',
        left: left?.equipment?.starSum ?? null,
        right: right?.equipment?.starSum ?? null,
        unit: null,
        evidence: 'derived',
      }),
      finalStatStarForce: makeRow({
        category: 'Equipment',
        metric: 'finalStatStarForce',
        left: left?.finalStats?.values?.starForceFinal ?? null,
        right: right?.finalStats?.values?.starForceFinal ?? null,
        unit: null,
        evidence: 'api-fact',
      }),
      scrollAttackSum: makeRow({
        category: 'Equipment',
        metric: 'scrollAttackSum',
        left: left?.equipment?.scrollAttackSum ?? null,
        right: right?.equipment?.scrollAttackSum ?? null,
        unit: null,
        evidence: 'derived',
      }),
      scrollMagicSum: makeRow({
        category: 'Equipment',
        metric: 'scrollMagicSum',
        left: left?.equipment?.scrollMagicSum ?? null,
        right: right?.equipment?.scrollMagicSum ?? null,
        unit: null,
        evidence: 'derived',
      }),
    },
    symbols: {
      totalLevel: makeRow({
        category: 'Symbols',
        metric: 'totalSymbolLevel',
        left: left?.symbols?.totalLevel ?? null,
        right: right?.symbols?.totalLevel ?? null,
        unit: null,
        evidence: 'derived',
      }),
      authenticForce: makeRow({
        category: 'Symbols',
        metric: 'authenticForce',
        left: left?.symbols?.authenticForce ?? null,
        right: right?.symbols?.authenticForce ?? null,
        unit: null,
        evidence: 'api-fact',
      }),
    },
    union: {
      level: makeRow({
        category: 'Union',
        metric: 'unionLevel',
        left: left?.union?.level ?? null,
        right: right?.union?.level ?? null,
        unit: null,
        evidence: 'api-fact',
      }),
      // Raider stats are compared without inventing an unavailable
      // preset identifier.
      raider: {
        statCount: makeRow({
          category: 'Union',
          metric: 'raiderStatCount',
          left: left?.unionRaider?.statCount ?? null,
          right: right?.unionRaider?.statCount ?? null,
          unit: null,
          evidence: 'derived',
        }),
      },
    },
    hexa: {
      totalCoreLevel: makeRow({
        category: 'HEXA',
        metric: 'totalHexaCoreLevel',
        left: left?.hexa?.totalCoreLevel ?? null,
        right: right?.hexa?.totalCoreLevel ?? null,
        unit: null,
        evidence: 'derived',
      }),
      totalStatLevel: makeRow({
        category: 'HEXA',
        metric: 'totalHexaStatLevel',
        left: left?.hexa?.totalStatLevel ?? null,
        right: right?.hexa?.totalStatLevel ?? null,
        unit: null,
        evidence: 'derived',
      }),
    },
    hyperStat: {
      activePresetNo: {
        left: left?.hyperStat?.activePresetNo ?? null,
        right: right?.hyperStat?.activePresetNo ?? null,
      },
      totalLevel: makeRow({
        category: 'Hyper Stat',
        metric: 'totalHyperStatLevel',
        left: left?.hyperStat?.totalLevel ?? null,
        right: right?.hyperStat?.totalLevel ?? null,
        unit: null,
        evidence: 'derived',
      }),
    },
    linkSkill: {
      activePresetNo: {
        left: left?.linkSkill?.activePresetNo ?? null,
        right: right?.linkSkill?.activePresetNo ?? null,
      },
      totalLevel: makeRow({
        category: 'Link Skill',
        metric: 'totalLinkSkillLevel',
        left: left?.linkSkill?.totalLevel ?? null,
        right: right?.linkSkill?.totalLevel ?? null,
        unit: null,
        evidence: 'derived',
      }),
    },
    setEffects: {
      totalSetCount: makeRow({
        category: 'Set Effects',
        metric: 'totalSetEffectCount',
        left: left?.setEffects?.totalSetCount ?? null,
        right: right?.setEffects?.totalSetCount ?? null,
        unit: null,
        evidence: 'derived',
      }),
    },
    familiar: {
      summonedFinalDamage: makeRow({
        category: 'Familiar',
        metric: 'summonedFamiliarFinalDamage',
        left: left?.familiar?.summonedFinalDamage ?? null,
        right: right?.familiar?.summonedFinalDamage ?? null,
        unit: 'pp',
        evidence: 'derived',
      }),
      registeredCount: makeRow({
        category: 'Familiar',
        metric: 'registeredFamiliarCount',
        left: left?.familiar?.registeredCount ?? null,
        right: right?.familiar?.registeredCount ?? null,
        unit: null,
        evidence: 'derived',
      }),
      linkedCount: makeRow({
        category: 'Familiar',
        metric: 'linkedFamiliarCount',
        left: left?.familiar?.linkedCount ?? null,
        right: right?.familiar?.linkedCount ?? null,
        unit: null,
        evidence: 'derived',
      }),
    },
  };

  return {
    sameClass,
    left: {
      name: left?.name ?? null,
      class: left?.class ?? null,
      level: left?.level ?? null,
      world: left?.world ?? null,
      combatPower: leftCp,
      syncedAt: left?.syncedAt ?? null,
    },
    right: {
      name: right?.name ?? null,
      class: right?.class ?? null,
      level: right?.level ?? null,
      world: right?.world ?? null,
      combatPower: rightCp,
      syncedAt: right?.syncedAt ?? null,
    },
    snapshot,
    headline,
    rows,
    categories,
  };
}

// Maps each stable-order category name to its predefined headline row.
const HEADLINE_ROW_BY_CATEGORY = {
  Equipment: categories => categories.equipment.starSum,
  Symbols: categories => categories.symbols.totalLevel,
  Union: categories => categories.union.level,
  HEXA: categories => categories.hexa.totalCoreLevel,
  'Hyper Stat': categories => categories.hyperStat.totalLevel,
  'Link Skill': categories => categories.linkSkill.totalLevel,
  'Set Effects': categories => categories.setEffects.totalSetCount,
  Familiar: categories => categories.familiar.summonedFinalDamage,
};

/**
 * Chooses at most three progression systems worth inspecting, from a
 * `compareCharacters` result. Only same-class comparisons are
 * considered. A category is eligible only when both sides have complete
 * structural data for its predefined headline metric and my character is
 * behind. Returned in the spec's stable inspection order; never a score
 * or a predicted combat-power gain.
 *
 * @param {object} comparison - result of compareCharacters
 * @returns {object[]} at most 3 upgrade-direction entries
 */
export function rankUpgradeDirections(comparison) {
  if (!comparison?.sameClass) return [];

  const eligible = [];
  for (const category of CATEGORY_ORDER) {
    const row = HEADLINE_ROW_BY_CATEGORY[category](comparison.categories);
    if (!row || row.coverage !== 'complete' || row.direction !== 'behind') {
      continue;
    }
    eligible.push({
      category,
      metric: row.metric,
      myValue: row.left,
      referenceValue: row.right,
      delta: row.delta,
      evidence: row.evidence,
      note: 'worth checking',
    });
    if (eligible.length === 3) break;
  }
  return eligible;
}
