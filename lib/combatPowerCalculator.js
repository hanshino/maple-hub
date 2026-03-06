/**
 * Combat Power Calculator
 *
 * Analyzes equipment presets to estimate combat power for each preset configuration.
 * Uses the reverse-engineering method documented in docs/combat-power-formulas.md sections 11-12.
 */

const LEVELING_KEYWORDS = ['道具掉落率', '楓幣獲得量', '一般怪物傷害'];
const LEVELING_THRESHOLD = 3;

// HyperStat stat_type → CP formula mapping (TWMS API names)
const HYPER_STAT_TYPE_MAP = {
  力量: { key: 'STR', type: 'flat' },
  敏捷: { key: 'DEX', type: 'flat' },
  智力: { key: 'INT', type: 'flat' },
  幸運: { key: 'LUK', type: 'flat' },
  Boss傷害: { key: 'boss_damage', type: 'percent' },
  爆擊傷害: { key: 'critical_damage', type: 'percent' },
  傷害: { key: 'damage', type: 'percent' },
  無視防禦率: { key: 'ignore_def', type: 'percent' },
  攻擊力: { key: 'attack_power', type: 'flat' },
  魔法攻擊力: { key: 'magic_power', type: 'flat' },
};

/**
 * Parses a HyperStat stat_increase string.
 * Formats vary: "+30,000", "爆擊傷害13%增加", "提高傷害 36%", "無視防禦率增加 45%"
 * Extracts the first number found in the string.
 * @param {string} str
 * @returns {number}
 */
function parseHyperStatValue(str) {
  if (!str) return 0;
  const match = str.match(/([\d,.]+)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) || 0 : 0;
}

/**
 * Extracts stat contributions from a HyperStat preset.
 * @param {object[]} presetStats - array of { stat_type, stat_level, stat_increase }
 * @returns {{ flat: object, percent: object }}
 */
export function extractHyperStatStats(presetStats) {
  const flat = { STR: 0, DEX: 0, INT: 0, LUK: 0, attack_power: 0, magic_power: 0 };
  const percent = { damage: 0, boss_damage: 0, critical_damage: 0, ignore_def: 0 };

  if (!presetStats) return { flat, percent };

  for (const stat of presetStats) {
    if (stat.stat_level <= 0) continue;
    const mapping = HYPER_STAT_TYPE_MAP[stat.stat_type];
    if (!mapping) continue;

    const value = parseHyperStatValue(stat.stat_increase);
    if (mapping.type === 'flat' && mapping.key in flat) {
      flat[mapping.key] += value;
    } else if (mapping.type === 'percent' && mapping.key in percent) {
      percent[mapping.key] += value;
    }
  }

  return { flat, percent };
}

/**
 * Calculates the HyperStat delta between target and current presets.
 * @param {object[]} currentPresetStats
 * @param {object[]} targetPresetStats
 * @returns {{ flat: object, percent: object }}
 */
export function calcHyperStatDelta(currentPresetStats, targetPresetStats) {
  const current = extractHyperStatStats(currentPresetStats);
  const target = extractHyperStatStats(targetPresetStats);

  const flat = {};
  for (const key of Object.keys(current.flat)) {
    flat[key] = target.flat[key] - current.flat[key];
  }
  const percent = {};
  for (const key of Object.keys(current.percent)) {
    percent[key] = target.percent[key] - current.percent[key];
  }

  return { flat, percent };
}

// Potential option field names on each item
const POTENTIAL_FIELDS = [
  'potential_option_1',
  'potential_option_2',
  'potential_option_3',
  'additional_potential_option_1',
  'additional_potential_option_2',
  'additional_potential_option_3',
];

/**
 * Parses a potential option string into a structured object.
 *
 * @param {string|null} str - e.g. "LUK : +12%" or "Boss攻擊時傷害 : +40%"
 * @returns {{ stat: string, value: number, isPercent: boolean } | null}
 */
export function parsePotentialOption(str) {
  if (!str) return null;

  // Boss damage
  const bossMatch = str.match(/Boss攻擊時傷害\s*:\s*\+(\d+)%/);
  if (bossMatch) {
    return { stat: 'Boss傷害', value: parseInt(bossMatch[1]), isPercent: true };
  }

  // Critical damage
  const critMatch = str.match(/爆擊傷害\s*:\s*\+(\d+)%/);
  if (critMatch) {
    return { stat: '爆擊傷害', value: parseInt(critMatch[1]), isPercent: true };
  }

  // Damage (must be exact prefix "傷害 :" to avoid matching Boss damage variants)
  const dmgMatch = str.match(/^傷害\s*:\s*\+(\d+)%/);
  if (dmgMatch) {
    return { stat: '傷害', value: parseInt(dmgMatch[1]), isPercent: true };
  }

  // Drop rate
  const dropMatch = str.match(/道具掉落率\s*:\s*\+(\d+)%/);
  if (dropMatch) {
    return {
      stat: '道具掉落率',
      value: parseInt(dropMatch[1]),
      isPercent: true,
    };
  }

  // Meso rate
  const mesoMatch = str.match(/楓幣獲得量\s*:\s*\+(\d+)%/);
  if (mesoMatch) {
    return {
      stat: '楓幣獲得量',
      value: parseInt(mesoMatch[1]),
      isPercent: true,
    };
  }

  // Normal monster damage
  const normalMatch = str.match(/一般怪物傷害\s*:\s*\+(\d+)%/);
  if (normalMatch) {
    return {
      stat: '一般怪物傷害',
      value: parseInt(normalMatch[1]),
      isPercent: true,
    };
  }

  // All-stat percent
  const allStatMatch = str.match(/全屬性\s*:\s*\+(\d+)%/);
  if (allStatMatch) {
    return {
      stat: '全屬性',
      value: parseInt(allStatMatch[1]),
      isPercent: true,
    };
  }

  // Percent stat (STR/DEX/INT/LUK/攻擊力/魔法攻擊力)
  const pctStatMatch = str.match(
    /^(STR|DEX|INT|LUK|攻擊力|魔法攻擊力)\s*:\s*\+(\d+)%/
  );
  if (pctStatMatch) {
    return {
      stat: pctStatMatch[1],
      value: parseInt(pctStatMatch[2]),
      isPercent: true,
    };
  }

  // Flat stat (STR/DEX/INT/LUK/攻擊力/魔法攻擊力)
  const flatStatMatch = str.match(
    /^(STR|DEX|INT|LUK|攻擊力|魔法攻擊力)\s*:\s*\+(\d+)$/
  );
  if (flatStatMatch) {
    return {
      stat: flatStatMatch[1],
      value: parseInt(flatStatMatch[2]),
      isPercent: false,
    };
  }

  return null;
}

/**
 * Identifies items that are independent of preset switching.
 * - Totems: slot not in any preset
 * - Jewels: duplicate slot in item_equipment (second occurrence)
 *
 * @param {object} equipmentData
 * @returns {object[]} independent items
 */
export function identifyIndependentItems(equipmentData) {
  const {
    item_equipment = [],
    item_equipment_preset_1,
    item_equipment_preset_2,
    item_equipment_preset_3,
  } = equipmentData;

  // Collect all slots that appear in any preset
  const presetSlots = new Set();
  const hasAnyPreset = [
    item_equipment_preset_1,
    item_equipment_preset_2,
    item_equipment_preset_3,
  ].some(p => p && p.length > 0);
  if (!hasAnyPreset) return [];
  for (const preset of [
    item_equipment_preset_1,
    item_equipment_preset_2,
    item_equipment_preset_3,
  ]) {
    if (!preset) continue;
    for (const item of preset) {
      presetSlots.add(item.item_equipment_slot);
    }
  }

  const independent = [];
  const seenSlots = new Set();

  for (const item of item_equipment) {
    const slot = item.item_equipment_slot;

    // Slot not in any preset → totem
    if (!presetSlots.has(slot)) {
      independent.push(item);
      continue;
    }

    // Duplicate slot → second occurrence is jewel
    if (seenSlots.has(slot)) {
      independent.push(item);
    } else {
      seenSlots.add(slot);
    }
  }

  return independent;
}

/**
 * Sums fixed stats and percent stats from a list of equipment items.
 *
 * @param {object[]} items
 * @returns {{ fixed: object, percent: object }}
 */
export function extractEquipmentStats(items) {
  const fixed = {
    STR: 0,
    DEX: 0,
    INT: 0,
    LUK: 0,
    attack_power: 0,
    magic_power: 0,
  };
  const percent = {
    STR: 0,
    DEX: 0,
    INT: 0,
    LUK: 0,
    attack_power: 0,
    magic_power: 0,
    damage: 0,
    boss_damage: 0,
    critical_damage: 0,
  };

  for (const item of items) {
    const opt = item.item_total_option || {};
    fixed.STR += parseInt(opt.str) || 0;
    fixed.DEX += parseInt(opt.dex) || 0;
    fixed.INT += parseInt(opt.int) || 0;
    fixed.LUK += parseInt(opt.luk) || 0;
    fixed.attack_power += parseInt(opt.attack_power) || 0;
    fixed.magic_power += parseInt(opt.magic_power) || 0;

    for (const field of POTENTIAL_FIELDS) {
      const parsed = parsePotentialOption(item[field]);
      if (!parsed || !parsed.isPercent) continue;

      switch (parsed.stat) {
        case '全屬性':
          percent.STR += parsed.value;
          percent.DEX += parsed.value;
          percent.INT += parsed.value;
          percent.LUK += parsed.value;
          break;
        case 'STR':
          percent.STR += parsed.value;
          break;
        case 'DEX':
          percent.DEX += parsed.value;
          break;
        case 'INT':
          percent.INT += parsed.value;
          break;
        case 'LUK':
          percent.LUK += parsed.value;
          break;
        case '攻擊力':
          percent.attack_power += parsed.value;
          break;
        case '魔法攻擊力':
          percent.magic_power += parsed.value;
          break;
        case '傷害':
          percent.damage += parsed.value;
          break;
        case 'Boss傷害':
          percent.boss_damage += parsed.value;
          break;
        case '爆擊傷害':
          percent.critical_damage += parsed.value;
          break;
      }
    }
  }

  return { fixed, percent };
}

/**
 * Identifies whether a preset is a leveling preset.
 * Returns true if >= LEVELING_THRESHOLD leveling keyword options are found across all items.
 *
 * @param {object[]} presetItems
 * @returns {boolean}
 */
export function identifyLevelingPreset(presetItems) {
  let count = 0;
  for (const item of presetItems) {
    for (const field of POTENTIAL_FIELDS) {
      const val = item[field];
      if (!val) continue;
      for (const kw of LEVELING_KEYWORDS) {
        if (val.includes(kw)) {
          count++;
          break; // one field can only match one keyword for count purposes
        }
      }
    }
  }
  return count >= LEVELING_THRESHOLD;
}

/**
 * Calculates estimated combat power for a given set of equipment items,
 * using the formula documented in section 11.2:
 *   CP ≈ (main×4 + sub) × 1.3 × ATK/100 × damageFactor
 *
 * The damageFactor is back-calculated from the current API CP rather than
 * reading from potential fields, because most damage multipliers (inner ability,
 * union, set effects) are not reflected in individual item potential options.
 *
 * Stat derivation uses the reverse-engineering method from section 12.2.
 *
 * @param {object[]} targetPresetItems - items for the preset being evaluated
 * @param {object[]} currentPresetItems - items for the currently active preset (used to derive C_base)
 * @param {object[]} independentItems - items shared across all presets
 * @param {object} statsData - API /character/stat response
 * @param {object} symbolData - API /character/symbol-equipment response
 * @param {number} currentPower - actual CP from API for the current preset
 * @param {{ flat: object, percent: object }|null} hyperStatDelta - delta between target and current HyperStat presets
 * @returns {number}
 */
function calculatePresetCombatPower(
  targetPresetItems,
  currentPresetItems,
  independentItems,
  statsData,
  symbolData,
  currentPower,
  hyperStatDelta
) {
  // Get current stat true values from API
  const finalStats = statsData?.final_stat || [];
  const getStat = name => {
    const entry = finalStats.find(s => s.stat_name === name);
    return parseFloat(entry?.stat_value || '0');
  };

  const apiLUK = getStat('LUK');
  const apiSTR = getStat('STR');
  const apiDEX = getStat('DEX');
  const apiINT = getStat('INT');
  const apiATK =
    getStat('공격력') || getStat('攻擊力') || getStat('物理攻擊力');
  const apiMATK = getStat('魔法攻擊力');

  // Calculate C_final from symbols (100 + level*100 per symbol)
  const symbols = symbolData?.symbol || [];
  const cFinalLUK = symbols.reduce(
    (acc, sym) => acc + 100 + (parseInt(sym.symbol_level) || 0) * 100,
    0
  );
  const cFinalSTR = cFinalLUK;
  const cFinalDEX = cFinalLUK;
  const cFinalINT = cFinalLUK;

  // Derive C_base from CURRENT preset items (API stats reflect the current preset)
  const allCurrentItems = [...currentPresetItems, ...independentItems];
  const currentStats = extractEquipmentStats(allCurrentItems);

  // Reverse-engineer C_base for each stat
  // total = floor((C_base + eq_fixed) * (1 + eq_pct/100)) + C_final
  // => C_base = (total - C_final) / (1 + eq_pct/100) - eq_fixed
  const calcCBase = (apiVal, cFinal, eqFixed, eqPct) => {
    const divisor = 1 + eqPct / 100;
    return (apiVal - cFinal) / divisor - eqFixed;
  };

  const cBaseLUK = calcCBase(
    apiLUK,
    cFinalLUK,
    currentStats.fixed.LUK,
    currentStats.percent.LUK
  );
  const cBaseSTR = calcCBase(
    apiSTR,
    cFinalSTR,
    currentStats.fixed.STR,
    currentStats.percent.STR
  );
  const cBaseDEX = calcCBase(
    apiDEX,
    cFinalDEX,
    currentStats.fixed.DEX,
    currentStats.percent.DEX
  );
  const cBaseINT = calcCBase(
    apiINT,
    cFinalINT,
    currentStats.fixed.INT,
    currentStats.percent.INT
  );

  // ATK: total = floor(eq_fixed * (1 + eq_pct/100)) + final_atk
  // Approximate C_final_atk as 0 for simplicity (inner ability etc not available)
  const calcAtkCBase = (apiVal, eqFixed, eqPct) => {
    return apiVal / (1 + eqPct / 100) - eqFixed;
  };
  const cBaseATK = calcAtkCBase(
    apiATK,
    currentStats.fixed.attack_power,
    currentStats.percent.attack_power
  );
  const cBaseMATK = calcAtkCBase(
    apiMATK,
    currentStats.fixed.magic_power,
    currentStats.percent.magic_power
  );

  // Back-calculate the effective damage factor from the current API CP.
  // This captures all damage multipliers (inner ability, union, set effects, etc.)
  // that are not available per-item. We use the current preset's API stats to derive it.
  const currentApiAtk = Math.max(apiATK, apiMATK);
  const currentApiStats = [apiLUK, apiSTR, apiDEX, apiINT];
  currentApiStats.sort((a, b) => b - a);
  const currentMain = currentApiStats[0];
  const currentSub = currentApiStats[1];
  const currentBaseCP =
    (currentMain * 4 + currentSub) * 1.3 * (currentApiAtk / 100);
  const damageFactor = currentBaseCP > 0 ? currentPower / currentBaseCP : 1;

  // Extract stats for the target preset
  const targetStats = extractEquipmentStats([
    ...targetPresetItems,
    ...independentItems,
  ]);

  // HyperStat flat deltas (0 if no delta provided)
  const hd = hyperStatDelta || { flat: {}, percent: {} };
  const hdFlat = (key) => hd.flat?.[key] || 0;
  const hdPct = (key) => hd.percent?.[key] || 0;

  const newLUK =
    Math.floor(
      (cBaseLUK + targetStats.fixed.LUK) * (1 + targetStats.percent.LUK / 100)
    ) + cFinalLUK + hdFlat('LUK');
  const newSTR =
    Math.floor(
      (cBaseSTR + targetStats.fixed.STR) * (1 + targetStats.percent.STR / 100)
    ) + cFinalSTR + hdFlat('STR');
  const newDEX =
    Math.floor(
      (cBaseDEX + targetStats.fixed.DEX) * (1 + targetStats.percent.DEX / 100)
    ) + cFinalDEX + hdFlat('DEX');
  const newINT =
    Math.floor(
      (cBaseINT + targetStats.fixed.INT) * (1 + targetStats.percent.INT / 100)
    ) + cFinalINT + hdFlat('INT');

  const newATK = Math.floor(
    (cBaseATK + targetStats.fixed.attack_power) *
      (1 + targetStats.percent.attack_power / 100)
  ) + hdFlat('attack_power');
  const newMATK = Math.floor(
    (cBaseMATK + targetStats.fixed.magic_power) *
      (1 + targetStats.percent.magic_power / 100)
  ) + hdFlat('magic_power');

  // Determine main/sub stats
  const stats = [newSTR, newDEX, newINT, newLUK];
  stats.sort((a, b) => b - a);
  const main = stats[0];
  const sub = stats[1];

  const atk = Math.max(newATK, newMATK);

  // Adjust damageFactor for HyperStat multiplier deltas (boss%, crit%, damage%)
  // damageFactor ≈ (1+(dmg%+boss%)/100) * (1+crit%/100) * unknownFactors
  // ratio = newMultiplier / currentMultiplier (unknownFactors cancel out)
  let adjustedDamageFactor = damageFactor;
  if (hdPct('damage') !== 0 || hdPct('boss_damage') !== 0 || hdPct('critical_damage') !== 0) {
    const apiDmg = getStat('傷害') || 0;
    const apiBoss = getStat('BOSS怪物傷害') || 0;
    const apiCrit = getStat('爆擊傷害') || 0;

    const curDmgMul = 1 + (apiDmg + apiBoss) / 100;
    const newDmgMul = 1 + (apiDmg + hdPct('damage') + apiBoss + hdPct('boss_damage')) / 100;
    const curCritMul = 1 + apiCrit / 100;
    const newCritMul = 1 + (apiCrit + hdPct('critical_damage')) / 100;

    const ratio = (curDmgMul > 0 && curCritMul > 0)
      ? (newDmgMul / curDmgMul) * (newCritMul / curCritMul)
      : 1;
    adjustedDamageFactor = damageFactor * ratio;
  }

  const cp = (main * 4 + sub) * 1.3 * (atk / 100) * adjustedDamageFactor;

  return Math.round(cp);
}

// HyperStat stat_type keywords for classification (TWMS API names)
const HYPER_STAT_EXP_KEYWORDS = ['獲得經驗值', '經驗值'];
const HYPER_STAT_BOSS_KEYWORDS = ['Boss傷害', '無視防禦率'];

// Link skill effect keywords for exp orientation
const LINK_SKILL_EXP_KEYWORDS = ['經驗值', 'EXP'];

/**
 * Classifies a HyperStat preset as 'boss', 'exp', or 'neutral'.
 * @param {object[]} presetStats - array of { stat_type, stat_level, stat_increase }
 * @returns {'boss'|'exp'|'neutral'}
 */
export function classifyHyperStatPreset(presetStats) {
  if (!presetStats || presetStats.length === 0) return 'neutral';

  const active = presetStats.filter(s => s.stat_level > 0);
  if (active.length === 0) return 'neutral';

  const hasExp = active.some(s =>
    HYPER_STAT_EXP_KEYWORDS.some(kw => s.stat_type?.includes(kw))
  );
  const hasBoss = active.some(s =>
    HYPER_STAT_BOSS_KEYWORDS.some(kw => s.stat_type?.includes(kw))
  );

  // Exp keywords are decisive — boss presets never waste points on exp
  if (hasExp) return 'exp';
  if (hasBoss) return 'boss';
  return 'neutral';
}

/**
 * Classifies a Link Skill preset as 'boss', 'exp', or 'neutral'.
 * @param {object[]} presetSkills - array of { skill_name, skill_effect, ... }
 * @returns {'boss'|'exp'|'neutral'}
 */
export function classifyLinkSkillPreset(presetSkills) {
  if (!presetSkills || presetSkills.length === 0) return 'neutral';

  const expCount = presetSkills.filter(s =>
    LINK_SKILL_EXP_KEYWORDS.some(
      kw => s.skill_effect?.includes(kw) || s.skill_name?.includes(kw)
    )
  ).length;

  if (expCount >= 1) return 'exp';
  return 'boss';
}

/**
 * Analyzes preset combinations across all categories.
 * Returns which preset number is used for each scenario (live/boss/exp).
 *
 * @param {object|null} equipmentData
 * @param {object|null} hyperStatData
 * @param {object|null} linkSkillData
 * @returns {{ live: object, boss: object, exp: object } | null}
 */
export function analyzePresetCombinations(
  equipmentData,
  hyperStatData,
  linkSkillData
) {
  // Live: currently active preset for each category
  const live = {
    equip: equipmentData?.preset_no || null,
    hyperStat: hyperStatData?.use_preset_no
      ? parseInt(hyperStatData.use_preset_no)
      : null,
    linkSkill: null,
  };

  // Detect active link skill preset
  if (linkSkillData?.character_link_skill) {
    const current = linkSkillData.character_link_skill;
    for (let i = 1; i <= 3; i++) {
      const preset = linkSkillData[`character_link_skill_preset_${i}`];
      if (
        preset &&
        preset.length > 0 &&
        preset.length === current.length &&
        current.every((s, j) => preset[j]?.skill_name === s.skill_name)
      ) {
        live.linkSkill = i;
        break;
      }
    }
  }

  // Classify each preset in each category
  const equipClassify = {};
  for (let i = 1; i <= 3; i++) {
    const items = equipmentData?.[`item_equipment_preset_${i}`] || [];
    if (items.length === 0) {
      equipClassify[i] = 'neutral';
    } else {
      equipClassify[i] = identifyLevelingPreset(items) ? 'exp' : 'boss';
    }
  }

  const hyperClassify = {};
  for (let i = 1; i <= 3; i++) {
    hyperClassify[i] = classifyHyperStatPreset(
      hyperStatData?.[`hyper_stat_preset_${i}`]
    );
  }

  const linkClassify = {};
  for (let i = 1; i <= 3; i++) {
    linkClassify[i] = classifyLinkSkillPreset(
      linkSkillData?.[`character_link_skill_preset_${i}`]
    );
  }

  // Pick preset with given direction; prefer live preset if multiple match
  const pickByDirection = (classify, direction, liveNo) => {
    const matches = Object.entries(classify)
      .filter(([, v]) => v === direction)
      .map(([k]) => parseInt(k));
    if (matches.length === 0) return liveNo;
    // Prefer the live preset if it matches, otherwise first match
    return matches.includes(liveNo) ? liveNo : matches[0];
  };

  const boss = {
    equip: pickByDirection(equipClassify, 'boss', live.equip),
    hyperStat: pickByDirection(hyperClassify, 'boss', live.hyperStat),
    linkSkill: pickByDirection(linkClassify, 'boss', live.linkSkill),
  };

  // Exp combination: pick the exp-oriented preset, fallback to live
  const hasExpPreset =
    Object.values(equipClassify).includes('exp') ||
    Object.values(hyperClassify).includes('exp') ||
    Object.values(linkClassify).includes('exp');

  const exp = hasExpPreset
    ? {
        equip: pickByDirection(equipClassify, 'exp', live.equip),
        hyperStat: pickByDirection(hyperClassify, 'exp', live.hyperStat),
        linkSkill: pickByDirection(linkClassify, 'exp', live.linkSkill),
      }
    : null;

  return { live, boss, exp };
}

/**
 * Main entry point. Analyzes all 3 presets and returns combat power estimates.
 *
 * @param {object|null} equipmentData - /character/item-equipment API response
 * @param {object|null} statsData - /character/stat API response
 * @param {object|null} symbolData - /character/symbol-equipment API response
 * @param {object|null} setEffectData - /character/set-effect API response (unused currently)
 * @param {object|null} hyperStatData - /character/hyper-stat API response
 * @param {object|null} linkSkillData - /character/link-skill API response
 * @returns {object|null}
 */
export function analyzeAllPresets(
  equipmentData,
  statsData,
  symbolData,
  setEffectData,
  hyperStatData,
  linkSkillData
) {
  if (!equipmentData || !equipmentData.item_equipment) return null;

  const currentPresetNo = equipmentData.preset_no || 1;
  const finalStats = statsData?.final_stat || [];

  // Get current combat power from API
  const cpEntry = finalStats.find(s => s.stat_name === '戰鬥力');
  const currentPower = parseFloat(cpEntry?.stat_value || '0');

  const independentItems = identifyIndependentItems(equipmentData);

  const presetMap = {
    1: equipmentData.item_equipment_preset_1 || [],
    2: equipmentData.item_equipment_preset_2 || [],
    3: equipmentData.item_equipment_preset_3 || [],
  };

  const currentPresetItems = presetMap[currentPresetNo];

  // Determine the current HyperStat preset number
  const currentHyperNo = hyperStatData?.use_preset_no
    ? parseInt(hyperStatData.use_preset_no)
    : null;
  const currentHyperStats = currentHyperNo
    ? hyperStatData?.[`hyper_stat_preset_${currentHyperNo}`]
    : null;

  // Analyze preset combinations to know which HyperStat goes with which equip preset
  const presetCombinations = analyzePresetCombinations(
    equipmentData,
    hyperStatData,
    linkSkillData
  );

  // For each equipment preset, find its paired HyperStat preset from combinations
  const getHyperStatForEquipPreset = (equipNo) => {
    if (!presetCombinations || !hyperStatData) return null;
    // Check if this equip preset matches boss or exp scenario
    for (const scenario of ['boss', 'exp']) {
      if (presetCombinations[scenario]?.equip === equipNo) {
        const hyperNo = presetCombinations[scenario]?.hyperStat;
        if (hyperNo && hyperNo !== currentHyperNo) {
          return hyperStatData[`hyper_stat_preset_${hyperNo}`] || null;
        }
      }
    }
    return null;
  };

  // Calculate power for each preset
  const presetPowers = {};
  for (const no of [1, 2, 3]) {
    if (no === currentPresetNo) {
      presetPowers[no] = currentPower;
    } else {
      // Compute HyperStat delta if this preset uses a different HyperStat preset
      const targetHyperStats = getHyperStatForEquipPreset(no);
      const hyperDelta = targetHyperStats
        ? calcHyperStatDelta(currentHyperStats, targetHyperStats)
        : null;

      presetPowers[no] = calculatePresetCombatPower(
        presetMap[no],
        currentPresetItems,
        independentItems,
        statsData,
        symbolData,
        currentPower,
        hyperDelta
      );
    }
  }

  // Current preset
  const current = { power: currentPower, presetNo: currentPresetNo };

  // Bossing: highest power preset
  let bossingNo = currentPresetNo;
  let bossingPower = currentPower;
  for (const no of [1, 2, 3]) {
    if (presetPowers[no] > bossingPower) {
      bossingPower = presetPowers[no];
      bossingNo = no;
    }
  }
  const bossing = { power: bossingPower, presetNo: bossingNo };

  // Leveling: first preset with >= LEVELING_THRESHOLD leveling keywords
  let leveling = null;
  for (const no of [1, 2, 3]) {
    if (identifyLevelingPreset(presetMap[no])) {
      leveling = { power: presetPowers[no], presetNo: no };
      break;
    }
  }

  return { current, bossing, leveling, presetCombinations };
}
