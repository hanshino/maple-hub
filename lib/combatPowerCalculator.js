/**
 * Combat Power Calculator
 *
 * Analyzes equipment presets to estimate combat power for each preset configuration.
 * Uses the reverse-engineering method documented in docs/combat-power-formulas.md sections 11-12.
 */

const LEVELING_KEYWORDS = ['道具掉落率', '楓幣獲得量', '一般怪物傷害'];
const LEVELING_THRESHOLD = 3;

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
 * @returns {number}
 */
function calculatePresetCombatPower(
  targetPresetItems,
  currentPresetItems,
  independentItems,
  statsData,
  symbolData,
  currentPower
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

  const newLUK =
    Math.floor(
      (cBaseLUK + targetStats.fixed.LUK) * (1 + targetStats.percent.LUK / 100)
    ) + cFinalLUK;
  const newSTR =
    Math.floor(
      (cBaseSTR + targetStats.fixed.STR) * (1 + targetStats.percent.STR / 100)
    ) + cFinalSTR;
  const newDEX =
    Math.floor(
      (cBaseDEX + targetStats.fixed.DEX) * (1 + targetStats.percent.DEX / 100)
    ) + cFinalDEX;
  const newINT =
    Math.floor(
      (cBaseINT + targetStats.fixed.INT) * (1 + targetStats.percent.INT / 100)
    ) + cFinalINT;

  const newATK = Math.floor(
    (cBaseATK + targetStats.fixed.attack_power) *
      (1 + targetStats.percent.attack_power / 100)
  );
  const newMATK = Math.floor(
    (cBaseMATK + targetStats.fixed.magic_power) *
      (1 + targetStats.percent.magic_power / 100)
  );

  // Determine main/sub stats
  const stats = [newSTR, newDEX, newINT, newLUK];
  stats.sort((a, b) => b - a);
  const main = stats[0];
  const sub = stats[1];

  const atk = Math.max(newATK, newMATK);

  // Apply the back-calculated damage factor (accounts for inner ability, union, set effects)
  const cp = (main * 4 + sub) * 1.3 * (atk / 100) * damageFactor;

  return Math.round(cp);
}

/**
 * Main entry point. Analyzes all 3 presets and returns combat power estimates.
 *
 * @param {object|null} equipmentData - /character/item-equipment API response
 * @param {object|null} statsData - /character/stat API response
 * @param {object|null} symbolData - /character/symbol-equipment API response
 * @param {object|null} setEffectData - /character/set-effect API response (unused currently)
 * @returns {{ current: { power: number, presetNo: number }, bossing: { power: number, presetNo: number }, leveling: { power: number, presetNo: number } | null } | null}
 */
export function analyzeAllPresets(
  equipmentData,
  statsData,
  symbolData,
  setEffectData
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

  // Calculate power for each preset
  const presetPowers = {};
  for (const no of [1, 2, 3]) {
    if (no === currentPresetNo) {
      presetPowers[no] = currentPower;
    } else {
      presetPowers[no] = calculatePresetCombatPower(
        presetMap[no],
        currentPresetItems,
        independentItems,
        statsData,
        symbolData,
        currentPower
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

  return { current, bossing, leveling };
}
