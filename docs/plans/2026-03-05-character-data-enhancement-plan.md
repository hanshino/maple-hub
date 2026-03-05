# Character Data Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add three-line preset combat power display and consolidate all character data (stats, union raider, hyper stat, set effect, union artifact, runes) into a unified Tabs component.

**Architecture:** New API routes proxy to Nexon OpenAPI for 4 additional endpoints. Combat power calculator reverse-engineers preset stats from equipment data. A new CharacterDataTabs component replaces the standalone CharacterStats Accordion and RuneSystems Card. Equipment data is prefetched on search and shared with EquipmentDialog.

**Tech Stack:** Next.js 15 App Router, React 19, MUI 7, Jest 30 + React Testing Library

---

### Task 1: Nexon API Client Functions

Add 4 new functions to the Nexon API client.

**Files:**
- Modify: `lib/nexonApi.js`
- Test: `__tests__/lib/nexonApi.test.js`

**Step 1: Write the failing tests**

Add these tests to `__tests__/lib/nexonApi.test.js`:

```js
// Add to existing imports
import {
  getCharacterBasicInfo,
  getCharacterStats,
  getCharacterEquipment,
  getCharacterCashItemEquipment,
  getCharacterPetEquipment,
  getCharacterHyperStat,
  getCharacterSetEffect,
  getUnionRaider,
  getUnionArtifact,
} from '../../lib/nexonApi';

// Add these test cases inside the existing describe block

describe('getCharacterHyperStat', () => {
  it('should fetch hyper stat data', async () => {
    const mockData = { character_class: '英雄', hyper_stat_preset_1: [] };
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await getCharacterHyperStat('test-ocid');
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/character/hyper-stat?ocid=test-ocid')
    );
    expect(result).toEqual(mockData);
  });
});

describe('getCharacterSetEffect', () => {
  it('should fetch set effect data', async () => {
    const mockData = { set_effect: [] };
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await getCharacterSetEffect('test-ocid');
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/character/set-effect?ocid=test-ocid')
    );
    expect(result).toEqual(mockData);
  });
});

describe('getUnionRaider', () => {
  it('should fetch union raider data', async () => {
    const mockData = { union_raider_stat: [] };
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await getUnionRaider('test-ocid');
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/user/union-raider?ocid=test-ocid')
    );
    expect(result).toEqual(mockData);
  });
});

describe('getUnionArtifact', () => {
  it('should fetch union artifact data', async () => {
    const mockData = { union_artifact_effect: [] };
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await getUnionArtifact('test-ocid');
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/user/union-artifact?ocid=test-ocid')
    );
    expect(result).toEqual(mockData);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="__tests__/lib/nexonApi" --verbose`
Expected: FAIL — functions not exported

**Step 3: Implement the functions**

Add to the end of `lib/nexonApi.js`:

```js
export const getCharacterHyperStat = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/hyper-stat?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch character hyper stat: ${error.message}`
    );
  }
};

export const getCharacterSetEffect = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/set-effect?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch character set effect: ${error.message}`
    );
  }
};

export const getUnionRaider = async ocid => {
  try {
    const response = await apiClient.get(
      `/user/union-raider?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch union raider: ${error.message}`
    );
  }
};

export const getUnionArtifact = async ocid => {
  try {
    const response = await apiClient.get(
      `/user/union-artifact?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch union artifact: ${error.message}`
    );
  }
};
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="__tests__/lib/nexonApi" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/nexonApi.js __tests__/lib/nexonApi.test.js
git commit -m "feat: add Nexon API functions for hyper-stat, set-effect, union-raider, union-artifact"
```

---

### Task 2: New API Routes

Create 4 API routes following existing patterns (see `app/api/character/equipment/route.js`).

**Files:**
- Create: `app/api/character/hyper-stat/route.js`
- Create: `app/api/character/set-effect/route.js`
- Create: `app/api/character/union-raider/route.js`
- Create: `app/api/character/union-artifact/route.js`

**Step 1: Create all 4 route files**

`app/api/character/hyper-stat/route.js`:
```js
import { NextResponse } from 'next/server';
import { getCharacterHyperStat } from '../../../../lib/nexonApi';
import { handleApiError } from '../../../../lib/apiErrorHandler';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ocid = searchParams.get('ocid');

    if (!ocid) {
      return NextResponse.json(
        { error: 'OCID parameter is required' },
        { status: 400 }
      );
    }

    const data = await getCharacterHyperStat(ocid);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status || 500 }
    );
  }
}
```

`app/api/character/set-effect/route.js`:
```js
import { NextResponse } from 'next/server';
import { getCharacterSetEffect } from '../../../../lib/nexonApi';
import { handleApiError } from '../../../../lib/apiErrorHandler';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ocid = searchParams.get('ocid');

    if (!ocid) {
      return NextResponse.json(
        { error: 'OCID parameter is required' },
        { status: 400 }
      );
    }

    const data = await getCharacterSetEffect(ocid);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status || 500 }
    );
  }
}
```

`app/api/character/union-raider/route.js`:
```js
import { NextResponse } from 'next/server';
import { getUnionRaider } from '../../../../lib/nexonApi';
import { handleApiError } from '../../../../lib/apiErrorHandler';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ocid = searchParams.get('ocid');

    if (!ocid) {
      return NextResponse.json(
        { error: 'OCID parameter is required' },
        { status: 400 }
      );
    }

    const data = await getUnionRaider(ocid);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status || 500 }
    );
  }
}
```

`app/api/character/union-artifact/route.js`:
```js
import { NextResponse } from 'next/server';
import { getUnionArtifact } from '../../../../lib/nexonApi';
import { handleApiError } from '../../../../lib/apiErrorHandler';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ocid = searchParams.get('ocid');

    if (!ocid) {
      return NextResponse.json(
        { error: 'OCID parameter is required' },
        { status: 400 }
      );
    }

    const data = await getUnionArtifact(ocid);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status || 500 }
    );
  }
}
```

**Step 2: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add app/api/character/hyper-stat/route.js app/api/character/set-effect/route.js app/api/character/union-raider/route.js app/api/character/union-artifact/route.js
git commit -m "feat: add API routes for hyper-stat, set-effect, union-raider, union-artifact"
```

---

### Task 3: Combat Power Calculator

Core logic for preset combat power analysis. Ref: `docs/combat-power-formulas.md` sections 11-12.

**Files:**
- Create: `lib/combatPowerCalculator.js`
- Create: `__tests__/lib/combatPowerCalculator.test.js`

**Step 1: Write the failing tests**

```js
// __tests__/lib/combatPowerCalculator.test.js
import {
  identifyIndependentItems,
  extractEquipmentStats,
  parsePotentialOption,
  identifyLevelingPreset,
  calculatePresetCombatPower,
  analyzeAllPresets,
} from '../../lib/combatPowerCalculator';

describe('combatPowerCalculator', () => {
  describe('parsePotentialOption', () => {
    it('should parse percentage stat option', () => {
      const result = parsePotentialOption('LUK : +12%');
      expect(result).toEqual({ stat: 'LUK', value: 12, isPercent: true });
    });

    it('should parse flat stat option', () => {
      const result = parsePotentialOption('LUK : +30');
      expect(result).toEqual({ stat: 'LUK', value: 30, isPercent: false });
    });

    it('should parse all stat percentage', () => {
      const result = parsePotentialOption('全屬性 : +9%');
      expect(result).toEqual({ stat: '全屬性', value: 9, isPercent: true });
    });

    it('should parse attack power option', () => {
      const result = parsePotentialOption('攻擊力 : +12%');
      expect(result).toEqual({ stat: '攻擊力', value: 12, isPercent: true });
    });

    it('should return null for non-stat option', () => {
      const result = parsePotentialOption('每10秒恢復50HP');
      expect(result).toBeNull();
    });

    it('should parse boss damage option', () => {
      const result = parsePotentialOption('Boss攻擊時傷害 : +40%');
      expect(result).toEqual({ stat: 'Boss傷害', value: 40, isPercent: true });
    });

    it('should parse critical damage option', () => {
      const result = parsePotentialOption('爆擊傷害 : +8%');
      expect(result).toEqual({ stat: '爆擊傷害', value: 8, isPercent: true });
    });

    it('should parse damage option', () => {
      const result = parsePotentialOption('傷害 : +12%');
      expect(result).toEqual({ stat: '傷害', value: 12, isPercent: true });
    });

    it('should parse item drop rate', () => {
      const result = parsePotentialOption('道具掉落率 : +20%');
      expect(result).toEqual({ stat: '道具掉落率', value: 20, isPercent: true });
    });
  });

  describe('identifyIndependentItems', () => {
    it('should identify totem items not in any preset', () => {
      const equipmentData = {
        item_equipment: [
          { item_equipment_slot: '帽子', item_name: 'Hat' },
          { item_equipment_slot: '圖騰1', item_name: 'Totem1' },
        ],
        item_equipment_preset_1: [
          { item_equipment_slot: '帽子', item_name: 'Hat' },
        ],
        item_equipment_preset_2: [],
        item_equipment_preset_3: [],
      };

      const result = identifyIndependentItems(equipmentData);
      expect(result).toHaveLength(1);
      expect(result[0].item_name).toBe('Totem1');
    });

    it('should identify 寶玉 from duplicate slots', () => {
      const equipmentData = {
        item_equipment: [
          { item_equipment_slot: '墜飾', item_name: '培羅德墜飾' },
          { item_equipment_slot: '墜飾', item_name: '伊妮絲的寶玉' },
        ],
        item_equipment_preset_1: [
          { item_equipment_slot: '墜飾', item_name: '培羅德墜飾' },
        ],
        item_equipment_preset_2: [],
        item_equipment_preset_3: [],
      };

      const result = identifyIndependentItems(equipmentData);
      // The duplicate (second occurrence) of same slot is independent
      expect(result.some(item => item.item_name === '伊妮絲的寶玉')).toBe(true);
    });
  });

  describe('extractEquipmentStats', () => {
    it('should sum fixed stats from item_total_option', () => {
      const items = [
        {
          item_equipment_slot: '帽子',
          item_total_option: { str: '50', dex: '30', int: '0', luk: '0', attack_power: '5', magic_power: '0' },
          potential_option_1: '',
          potential_option_2: '',
          potential_option_3: '',
          additional_potential_option_1: '',
          additional_potential_option_2: '',
          additional_potential_option_3: '',
        },
      ];
      const result = extractEquipmentStats(items);
      expect(result.fixed.STR).toBe(50);
      expect(result.fixed.DEX).toBe(30);
      expect(result.fixed.attack_power).toBe(5);
    });

    it('should sum percentage stats from potential options', () => {
      const items = [
        {
          item_equipment_slot: '帽子',
          item_total_option: { str: '0', dex: '0', int: '0', luk: '0', attack_power: '0', magic_power: '0' },
          potential_option_1: 'LUK : +12%',
          potential_option_2: 'LUK : +9%',
          potential_option_3: '全屬性 : +9%',
          additional_potential_option_1: 'LUK : +6%',
          additional_potential_option_2: '',
          additional_potential_option_3: '',
        },
      ];
      const result = extractEquipmentStats(items);
      // LUK% = 12 + 9 + 9(全屬性) + 6 = 36
      expect(result.percent.LUK).toBe(36);
      // STR/DEX/INT also get 9% from 全屬性
      expect(result.percent.STR).toBe(9);
    });

    it('should extract damage and boss damage percentages', () => {
      const items = [
        {
          item_equipment_slot: '武器',
          item_total_option: { str: '0', dex: '0', int: '0', luk: '0', attack_power: '0', magic_power: '0' },
          potential_option_1: 'Boss攻擊時傷害 : +40%',
          potential_option_2: '傷害 : +12%',
          potential_option_3: '攻擊力 : +12%',
          additional_potential_option_1: '',
          additional_potential_option_2: '',
          additional_potential_option_3: '',
        },
      ];
      const result = extractEquipmentStats(items);
      expect(result.percent.boss_damage).toBe(40);
      expect(result.percent.damage).toBe(12);
      expect(result.percent.attack_power).toBe(12);
    });
  });

  describe('identifyLevelingPreset', () => {
    it('should identify preset with >= 3 leveling keywords', () => {
      const presetItems = [
        {
          item_equipment_slot: '帽子',
          potential_option_1: '道具掉落率 : +20%',
          potential_option_2: '楓幣獲得量 : +20%',
          potential_option_3: '道具掉落率 : +20%',
          additional_potential_option_1: '',
          additional_potential_option_2: '',
          additional_potential_option_3: '',
        },
      ];
      expect(identifyLevelingPreset(presetItems)).toBe(true);
    });

    it('should not identify preset with < 3 leveling keywords', () => {
      const presetItems = [
        {
          item_equipment_slot: '帽子',
          potential_option_1: 'LUK : +12%',
          potential_option_2: '道具掉落率 : +20%',
          potential_option_3: 'LUK : +9%',
          additional_potential_option_1: '',
          additional_potential_option_2: '',
          additional_potential_option_3: '',
        },
      ];
      expect(identifyLevelingPreset(presetItems)).toBe(false);
    });
  });

  describe('analyzeAllPresets', () => {
    it('should return null when equipment data is missing', () => {
      expect(analyzeAllPresets(null, null, null, null)).toBeNull();
    });

    it('should return fallback with current battle power when stats insufficient', () => {
      const statsData = {
        final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000' }],
      };
      const result = analyzeAllPresets(null, statsData, null, null);
      expect(result).toEqual({
        current: { power: 1000000, presetNo: null },
        bossing: null,
        leveling: null,
      });
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="__tests__/lib/combatPowerCalculator" --verbose`
Expected: FAIL — module not found

**Step 3: Write the implementation**

Create `lib/combatPowerCalculator.js`:

```js
/**
 * Combat Power Calculator for Preset Analysis
 *
 * Reverse-engineers combat power for different equipment presets.
 * See docs/combat-power-formulas.md for formula documentation.
 */

const LEVELING_KEYWORDS = ['道具掉落率', '楓幣獲得量', '一般怪物傷害'];
const LEVELING_THRESHOLD = 3;

/**
 * Parse a single potential option string into structured data.
 * Examples:
 *   "LUK : +12%" -> { stat: 'LUK', value: 12, isPercent: true }
 *   "Boss攻擊時傷害 : +40%" -> { stat: 'Boss傷害', value: 40, isPercent: true }
 */
export function parsePotentialOption(optionStr) {
  if (!optionStr || typeof optionStr !== 'string') return null;

  // Boss damage
  const bossMatch = optionStr.match(/Boss攻擊時傷害\s*:\s*\+(\d+)%/);
  if (bossMatch) {
    return { stat: 'Boss傷害', value: parseInt(bossMatch[1]), isPercent: true };
  }

  // Critical damage
  const critMatch = optionStr.match(/爆擊傷害\s*:\s*\+(\d+)%/);
  if (critMatch) {
    return { stat: '爆擊傷害', value: parseInt(critMatch[1]), isPercent: true };
  }

  // Damage %
  const dmgMatch = optionStr.match(/^傷害\s*:\s*\+(\d+)%/);
  if (dmgMatch) {
    return { stat: '傷害', value: parseInt(dmgMatch[1]), isPercent: true };
  }

  // Item drop rate
  const dropMatch = optionStr.match(/道具掉落率\s*:\s*\+(\d+)%/);
  if (dropMatch) {
    return { stat: '道具掉落率', value: parseInt(dropMatch[1]), isPercent: true };
  }

  // Meso rate
  const mesoMatch = optionStr.match(/楓幣獲得量\s*:\s*\+(\d+)%/);
  if (mesoMatch) {
    return { stat: '楓幣獲得量', value: parseInt(mesoMatch[1]), isPercent: true };
  }

  // Normal monster damage
  const normalMatch = optionStr.match(/一般怪物傷害\s*:\s*\+(\d+)%/);
  if (normalMatch) {
    return { stat: '一般怪物傷害', value: parseInt(normalMatch[1]), isPercent: true };
  }

  // All stat %
  const allStatMatch = optionStr.match(/全屬性\s*:\s*\+(\d+)%/);
  if (allStatMatch) {
    return { stat: '全屬性', value: parseInt(allStatMatch[1]), isPercent: true };
  }

  // Percentage stat (STR/DEX/INT/LUK/攻擊力/魔法攻擊力)
  const pctMatch = optionStr.match(/^(STR|DEX|INT|LUK|攻擊力|魔法攻擊力)\s*:\s*\+(\d+)%/);
  if (pctMatch) {
    return { stat: pctMatch[1], value: parseInt(pctMatch[2]), isPercent: true };
  }

  // Flat stat
  const flatMatch = optionStr.match(/^(STR|DEX|INT|LUK|攻擊力|魔法攻擊力)\s*:\s*\+(\d+)$/);
  if (flatMatch) {
    return { stat: flatMatch[1], value: parseInt(flatMatch[2]), isPercent: false };
  }

  return null;
}

/**
 * Identify independent items that don't change with preset switching.
 * Two rules:
 *   1. Slot not in any preset -> totem/badge
 *   2. Duplicate slot in item_equipment -> the extra one is 寶玉
 */
export function identifyIndependentItems(equipmentData) {
  if (!equipmentData?.item_equipment) return [];

  const currentItems = equipmentData.item_equipment;
  const presets = [
    equipmentData.item_equipment_preset_1 || [],
    equipmentData.item_equipment_preset_2 || [],
    equipmentData.item_equipment_preset_3 || [],
  ];

  // Collect all slots that appear in any preset
  const presetSlots = new Set();
  presets.forEach(preset => {
    preset.forEach(item => presetSlots.add(item.item_equipment_slot));
  });

  // Track slot occurrences in current equipment
  const slotCount = {};
  currentItems.forEach(item => {
    const slot = item.item_equipment_slot;
    slotCount[slot] = (slotCount[slot] || 0) + 1;
  });

  const independent = [];
  const slotSeen = {};

  currentItems.forEach(item => {
    const slot = item.item_equipment_slot;

    // Rule 1: slot not in any preset
    if (!presetSlots.has(slot)) {
      independent.push(item);
      return;
    }

    // Rule 2: duplicate slot — the second occurrence is independent (寶玉)
    slotSeen[slot] = (slotSeen[slot] || 0) + 1;
    if (slotCount[slot] > 1 && slotSeen[slot] > 1) {
      independent.push(item);
    }
  });

  return independent;
}

/**
 * Extract aggregated stats from a list of equipment items.
 * Returns { fixed: { STR, DEX, INT, LUK, attack_power, magic_power }, percent: { STR, DEX, ... } }
 */
export function extractEquipmentStats(items) {
  const fixed = { STR: 0, DEX: 0, INT: 0, LUK: 0, attack_power: 0, magic_power: 0 };
  const percent = {
    STR: 0, DEX: 0, INT: 0, LUK: 0,
    attack_power: 0, magic_power: 0,
    damage: 0, boss_damage: 0, critical_damage: 0,
  };

  items.forEach(item => {
    // Fixed stats from item_total_option
    const opt = item.item_total_option;
    if (opt) {
      fixed.STR += parseInt(opt.str) || 0;
      fixed.DEX += parseInt(opt.dex) || 0;
      fixed.INT += parseInt(opt.int) || 0;
      fixed.LUK += parseInt(opt.luk) || 0;
      fixed.attack_power += parseInt(opt.attack_power) || 0;
      fixed.magic_power += parseInt(opt.magic_power) || 0;
    }

    // Percentage stats from potential options
    const potentials = [
      item.potential_option_1,
      item.potential_option_2,
      item.potential_option_3,
      item.additional_potential_option_1,
      item.additional_potential_option_2,
      item.additional_potential_option_3,
    ];

    potentials.forEach(pot => {
      const parsed = parsePotentialOption(pot);
      if (!parsed || !parsed.isPercent) return;

      if (parsed.stat === '全屬性') {
        percent.STR += parsed.value;
        percent.DEX += parsed.value;
        percent.INT += parsed.value;
        percent.LUK += parsed.value;
      } else if (parsed.stat === 'Boss傷害') {
        percent.boss_damage += parsed.value;
      } else if (parsed.stat === '爆擊傷害') {
        percent.critical_damage += parsed.value;
      } else if (parsed.stat === '傷害') {
        percent.damage += parsed.value;
      } else if (parsed.stat === '攻擊力') {
        percent.attack_power += parsed.value;
      } else if (parsed.stat === '魔法攻擊力') {
        percent.magic_power += parsed.value;
      } else if (percent[parsed.stat] !== undefined) {
        percent[parsed.stat] += parsed.value;
      }
    });
  });

  return { fixed, percent };
}

/**
 * Count leveling-related keywords across all potential options in a preset.
 * Returns true if >= LEVELING_THRESHOLD matches found.
 */
export function identifyLevelingPreset(presetItems) {
  let count = 0;

  presetItems.forEach(item => {
    const potentials = [
      item.potential_option_1,
      item.potential_option_2,
      item.potential_option_3,
      item.additional_potential_option_1,
      item.additional_potential_option_2,
      item.additional_potential_option_3,
    ];

    potentials.forEach(pot => {
      if (!pot) return;
      if (LEVELING_KEYWORDS.some(kw => pot.includes(kw))) {
        count++;
      }
    });
  });

  return count >= LEVELING_THRESHOLD;
}

/**
 * Get the preset items for a given preset number.
 * Preset 1 uses item_equipment_preset_1, etc.
 * Empty presets (null or []) are skipped.
 */
function getPresetItems(equipmentData, presetNo) {
  const key = `item_equipment_preset_${presetNo}`;
  const items = equipmentData[key];
  return items && items.length > 0 ? items : null;
}

/**
 * Calculate combat power for a single preset using reverse-engineering.
 *
 * Formula: CP ≈ (main×4 + sub) × 1.3 × ATK/100 × (1 + DMG% + Boss%) × (1 + CritDMG%)
 *
 * @param {object} currentStats - Current API stats (final_stat array)
 * @param {Array} presetItems - Equipment items in this preset
 * @param {Array} independentItems - Items that don't change between presets
 * @param {Array} currentPresetItems - Items in the currently active preset
 * @param {object} symbolData - Symbol equipment data for C_final calculation
 * @param {object} setEffectData - Current set effect data
 */
export function calculatePresetCombatPower(
  currentStats,
  presetItems,
  independentItems,
  currentPresetItems,
  symbolData,
  setEffectData
) {
  if (!currentStats?.final_stat || !presetItems || !currentPresetItems) {
    return null;
  }

  // Extract current stat values from API
  const getStat = name =>
    parseInt(
      currentStats.final_stat.find(s => s.stat_name === name)?.stat_value || '0'
    );

  const currentMainStat = getStat('LUK'); // TODO: determine by class
  const currentSubStat = getStat('DEX');
  const currentATK = Math.max(getStat('攻擊力'), getStat('魔法攻擊力'));
  const currentDmgPct = parseFloat(
    currentStats.final_stat.find(s => s.stat_name === '傷害')?.stat_value || '0'
  );
  const currentBossPct = parseFloat(
    currentStats.final_stat.find(s => s.stat_name === 'Boss怪物傷害')?.stat_value || '0'
  );
  const currentCritPct = parseFloat(
    currentStats.final_stat.find(s => s.stat_name === '爆擊傷害')?.stat_value || '0'
  );

  // Get equipment stats for current preset and new preset
  const currentEquipStats = extractEquipmentStats(currentPresetItems);
  const newEquipStats = extractEquipmentStats(presetItems);

  // Calculate stat differences
  const fixedDiff = {
    mainStat: newEquipStats.fixed.LUK - currentEquipStats.fixed.LUK,
    subStat: newEquipStats.fixed.DEX - currentEquipStats.fixed.DEX,
    atk: Math.max(
      newEquipStats.fixed.attack_power - currentEquipStats.fixed.attack_power,
      newEquipStats.fixed.magic_power - currentEquipStats.fixed.magic_power
    ),
  };

  const pctDiff = {
    mainStat: newEquipStats.percent.LUK - currentEquipStats.percent.LUK,
    atk: Math.max(
      newEquipStats.percent.attack_power - currentEquipStats.percent.attack_power,
      newEquipStats.percent.magic_power - currentEquipStats.percent.magic_power
    ),
    damage: newEquipStats.percent.damage - currentEquipStats.percent.damage,
    boss: newEquipStats.percent.boss_damage - currentEquipStats.percent.boss_damage,
    crit: newEquipStats.percent.critical_damage - currentEquipStats.percent.critical_damage,
  };

  // Approximate new stats (simplified — doesn't account for % base interaction perfectly)
  const newMainStat = currentMainStat + fixedDiff.mainStat;
  const newSubStat = currentSubStat + fixedDiff.subStat;
  const newATK = currentATK + fixedDiff.atk;
  const newDmgPct = currentDmgPct + pctDiff.damage;
  const newBossPct = currentBossPct + pctDiff.boss;
  const newCritPct = currentCritPct + pctDiff.crit;

  // Combat power formula (standardized weapon coeff 1.3)
  const cp =
    (newMainStat * 4 + newSubStat) *
    1.3 *
    (newATK / 100) *
    (1 + (newDmgPct + newBossPct) / 100) *
    (1 + newCritPct / 100);

  return Math.round(cp);
}

/**
 * Analyze all presets and return structured result.
 *
 * @returns {{ current, bossing, leveling } | null}
 *   current: { power, presetNo }
 *   bossing: { power, presetNo } (highest CP)
 *   leveling: { power, presetNo } (detected by keywords, or null)
 */
export function analyzeAllPresets(equipmentData, statsData, symbolData, setEffectData) {
  // Extract current battle power as fallback
  const currentBP = parseInt(
    statsData?.final_stat?.find(s => s.stat_name === '戰鬥力')?.stat_value || '0'
  );

  if (!equipmentData || !statsData) {
    if (currentBP > 0) {
      return {
        current: { power: currentBP, presetNo: null },
        bossing: null,
        leveling: null,
      };
    }
    return null;
  }

  const currentPresetNo = equipmentData.preset_no || 1;
  const independentItems = identifyIndependentItems(equipmentData);

  // Get current preset items
  const currentPresetItems =
    getPresetItems(equipmentData, currentPresetNo) ||
    equipmentData.item_equipment ||
    [];

  const results = [];

  for (let presetNo = 1; presetNo <= 3; presetNo++) {
    const items = getPresetItems(equipmentData, presetNo);
    if (!items) continue;

    if (presetNo === currentPresetNo) {
      // Current preset uses API's actual battle power
      results.push({
        presetNo,
        power: currentBP,
        isLeveling: identifyLevelingPreset(items),
        isCurrent: true,
      });
    } else {
      const estimatedCP = calculatePresetCombatPower(
        statsData,
        items,
        independentItems,
        currentPresetItems,
        symbolData,
        setEffectData
      );

      if (estimatedCP) {
        results.push({
          presetNo,
          power: estimatedCP,
          isLeveling: identifyLevelingPreset(items),
          isCurrent: false,
        });
      }
    }
  }

  if (results.length === 0) {
    if (currentBP > 0) {
      return {
        current: { power: currentBP, presetNo: currentPresetNo },
        bossing: null,
        leveling: null,
      };
    }
    return null;
  }

  // Find current, bossing (highest CP), and leveling
  const current = results.find(r => r.isCurrent) || results[0];
  const bossing = results.reduce((max, r) =>
    r.power > max.power ? r : max
  );
  const leveling = results.find(r => r.isLeveling) || null;

  return {
    current: { power: current.power, presetNo: current.presetNo },
    bossing: bossing.presetNo !== current.presetNo
      ? { power: bossing.power, presetNo: bossing.presetNo }
      : { power: bossing.power, presetNo: bossing.presetNo },
    leveling: leveling
      ? { power: leveling.power, presetNo: leveling.presetNo }
      : null,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="__tests__/lib/combatPowerCalculator" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/combatPowerCalculator.js __tests__/lib/combatPowerCalculator.test.js
git commit -m "feat: add combat power calculator with preset analysis"
```

---

### Task 4: Data Panel Components

Create 4 new panel components for the Tabs. Each displays API data as a simple stat list.

**Files:**
- Create: `components/UnionRaiderPanel.js`
- Create: `components/HyperStatPanel.js`
- Create: `components/SetEffectPanel.js`
- Create: `components/UnionArtifactPanel.js`

**Step 1: Create UnionRaiderPanel**

```js
// components/UnionRaiderPanel.js
'use client';

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';

export default function UnionRaiderPanel({ loading, error, data, onRetry }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
                重試
              </Button>
            )
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const stats = data?.union_raider_stat || [];

  if (stats.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">尚無聯盟戰地資料</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Box
        sx={{
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden',
          p: 1,
        }}
      >
        <TableContainer>
          <Table size="small" sx={{ '& .MuiTableCell-root': { border: 'none' } }}>
            <TableBody>
              {stats.map((stat, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ fontWeight: 'bold', p: 1 }}>
                    {stat}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
```

**Step 2: Create HyperStatPanel**

```js
// components/HyperStatPanel.js
'use client';

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { useState } from 'react';

export default function HyperStatPanel({ loading, error, data, onRetry }) {
  const [presetTab, setPresetTab] = useState(0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
                重試
              </Button>
            )
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const presetKey = `hyper_stat_preset_${presetTab + 1}`;
  const currentPreset = data?.[presetKey] || [];
  const activePresetNo = data?.use_preset_no ? parseInt(data.use_preset_no) : 1;

  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">尚無極限屬性資料</Typography>
      </Box>
    );
  }

  const activeStats = currentPreset.filter(
    (stat) => stat.stat_level > 0
  );

  return (
    <Box sx={{ p: 1 }}>
      <Tabs
        value={presetTab}
        onChange={(_, v) => setPresetTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`Preset 1${activePresetNo === 1 ? ' (使用中)' : ''}`} />
        <Tab label={`Preset 2${activePresetNo === 2 ? ' (使用中)' : ''}`} />
        <Tab label={`Preset 3${activePresetNo === 3 ? ' (使用中)' : ''}`} />
      </Tabs>
      {activeStats.length === 0 ? (
        <Typography color="text.secondary" sx={{ p: 2 }}>
          此 Preset 尚未配點
        </Typography>
      ) : (
        <Box
          sx={{
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            overflow: 'hidden',
            p: 1,
          }}
        >
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { border: 'none' } }}>
              <TableBody>
                {activeStats.map((stat) => (
                  <TableRow key={stat.stat_type}>
                    <TableCell sx={{ fontWeight: 'bold', p: 1, width: '50%' }}>
                      {stat.stat_type}
                    </TableCell>
                    <TableCell sx={{ p: 1, width: '20%' }}>
                      Lv.{stat.stat_level}
                    </TableCell>
                    <TableCell sx={{ p: 1, width: '30%' }}>
                      {stat.stat_increase || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
```

**Step 3: Create SetEffectPanel**

```js
// components/SetEffectPanel.js
'use client';

import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

export default function SetEffectPanel({ loading, error, data, onRetry }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
                重試
              </Button>
            )
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const sets = data?.set_effect || [];

  if (sets.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">尚無套裝效果資料</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {sets.map((set) => (
        <Accordion key={set.set_name} defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 'bold' }}>
                {set.set_name}
              </Typography>
              <Chip
                label={`${set.total_set_count}件`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {set.set_effect_info
              ?.filter((info) => info.set_count <= set.total_set_count)
              .map((info) => (
                <Box key={info.set_count} sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: 'primary.main' }}
                  >
                    {info.set_count}件效果
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {info.set_option}
                  </Typography>
                </Box>
              ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
```

**Step 4: Create UnionArtifactPanel**

```js
// components/UnionArtifactPanel.js
'use client';

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';

export default function UnionArtifactPanel({ loading, error, data, onRetry }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
                重試
              </Button>
            )
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const effects = data?.union_artifact_effect || [];
  const crystals = data?.union_artifact_crystal || [];

  if (effects.length === 0 && crystals.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">尚無聯盟神器資料</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {crystals.length > 0 && (
        <Box
          sx={{
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            overflow: 'hidden',
            p: 1,
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            水晶
          </Typography>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { border: 'none' } }}>
              <TableBody>
                {crystals.map((crystal, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 'bold', p: 1, width: '40%' }}>
                      {crystal.name}
                    </TableCell>
                    <TableCell sx={{ p: 1, width: '20%' }}>
                      <Chip label={`Lv.${crystal.level}`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ p: 1, width: '40%' }}>
                      {crystal.crystal_option_name_1}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {effects.length > 0 && (
        <Box
          sx={{
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            overflow: 'hidden',
            p: 1,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            效果
          </Typography>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { border: 'none' } }}>
              <TableBody>
                {effects.map((effect, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 'bold', p: 1, width: '50%' }}>
                      {effect.name}
                    </TableCell>
                    <TableCell sx={{ p: 1, width: '50%' }}>
                      Lv.{effect.level}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add components/UnionRaiderPanel.js components/HyperStatPanel.js components/SetEffectPanel.js components/UnionArtifactPanel.js
git commit -m "feat: add data panel components for union raider, hyper stat, set effect, union artifact"
```

---

### Task 5: CharacterDataTabs Component

Unified Tabs container that replaces CharacterStats Accordion and RuneSystems Card.

**Files:**
- Create: `components/CharacterDataTabs.js`
- Test: `__tests__/components/CharacterDataTabs.test.js`

**Step 1: Write the failing test**

```js
// __tests__/components/CharacterDataTabs.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CharacterDataTabs from '../../components/CharacterDataTabs';

// Mock child components
jest.mock('../../components/CharacterStats', () => {
  return function MockCharacterStats({ ocid }) {
    return <div data-testid="character-stats">Stats: {ocid}</div>;
  };
});

jest.mock('../../components/runes/RuneSystems', () => {
  return function MockRuneSystems() {
    return <div data-testid="rune-systems">Runes</div>;
  };
});

jest.mock('../../components/UnionRaiderPanel', () => {
  return function MockPanel() {
    return <div data-testid="union-raider-panel">Union Raider</div>;
  };
});

jest.mock('../../components/HyperStatPanel', () => {
  return function MockPanel() {
    return <div data-testid="hyper-stat-panel">Hyper Stat</div>;
  };
});

jest.mock('../../components/SetEffectPanel', () => {
  return function MockPanel() {
    return <div data-testid="set-effect-panel">Set Effect</div>;
  };
});

jest.mock('../../components/UnionArtifactPanel', () => {
  return function MockPanel() {
    return <div data-testid="union-artifact-panel">Union Artifact</div>;
  };
});

describe('CharacterDataTabs', () => {
  const defaultProps = {
    ocid: 'test-ocid',
    runes: [],
    setEffectData: null,
    setEffectLoading: false,
    setEffectError: null,
  };

  it('should render all tab labels', () => {
    render(<CharacterDataTabs {...defaultProps} />);
    expect(screen.getByText('能力值')).toBeInTheDocument();
    expect(screen.getByText('聯盟戰地')).toBeInTheDocument();
    expect(screen.getByText('極限屬性')).toBeInTheDocument();
    expect(screen.getByText('套裝效果')).toBeInTheDocument();
    expect(screen.getByText('聯盟神器')).toBeInTheDocument();
    expect(screen.getByText('符文系統')).toBeInTheDocument();
  });

  it('should show stats panel by default', () => {
    render(<CharacterDataTabs {...defaultProps} />);
    expect(screen.getByTestId('character-stats')).toBeInTheDocument();
  });

  it('should switch to rune panel on tab click', async () => {
    render(<CharacterDataTabs {...defaultProps} />);
    await userEvent.click(screen.getByText('符文系統'));
    expect(screen.getByTestId('rune-systems')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/components/CharacterDataTabs" --verbose`
Expected: FAIL — module not found

**Step 3: Implement CharacterDataTabs**

```js
// components/CharacterDataTabs.js
'use client';

import { useState, useCallback } from 'react';
import { Box, Tabs, Tab, Card, CardContent } from '@mui/material';
import CharacterStats from './CharacterStats';
import RuneSystems from './runes/RuneSystems';
import UnionRaiderPanel from './UnionRaiderPanel';
import HyperStatPanel from './HyperStatPanel';
import SetEffectPanel from './SetEffectPanel';
import UnionArtifactPanel from './UnionArtifactPanel';
import { getCachedData, setCachedData } from '../lib/cache';

const TAB_CONFIG = [
  { label: '能力值', key: 'stats' },
  { label: '聯盟戰地', key: 'union-raider' },
  { label: '極限屬性', key: 'hyper-stat' },
  { label: '套裝效果', key: 'set-effect' },
  { label: '聯盟神器', key: 'union-artifact' },
  { label: '符文系統', key: 'runes' },
];

export default function CharacterDataTabs({
  ocid,
  runes,
  setEffectData,
  setEffectLoading,
  setEffectError,
  onRetrySetEffect,
}) {
  const [tabIndex, setTabIndex] = useState(0);

  // Lazy-loaded data for wave-2 tabs
  const [unionRaiderData, setUnionRaiderData] = useState(null);
  const [unionRaiderLoading, setUnionRaiderLoading] = useState(false);
  const [unionRaiderError, setUnionRaiderError] = useState(null);
  const [unionRaiderLoaded, setUnionRaiderLoaded] = useState(false);

  const [hyperStatData, setHyperStatData] = useState(null);
  const [hyperStatLoading, setHyperStatLoading] = useState(false);
  const [hyperStatError, setHyperStatError] = useState(null);
  const [hyperStatLoaded, setHyperStatLoaded] = useState(false);

  const [unionArtifactData, setUnionArtifactData] = useState(null);
  const [unionArtifactLoading, setUnionArtifactLoading] = useState(false);
  const [unionArtifactError, setUnionArtifactError] = useState(null);
  const [unionArtifactLoaded, setUnionArtifactLoaded] = useState(false);

  const fetchTabData = useCallback(
    async (apiPath, cachePrefix, setData, setLoading, setError, setLoaded) => {
      setLoading(true);
      setError(null);
      try {
        const cacheKey = `${cachePrefix}_${ocid}`;
        let data = getCachedData(cacheKey);
        if (!data) {
          const response = await fetch(
            `/api/character/${apiPath}?ocid=${ocid}`
          );
          if (!response.ok) throw new Error(`載入失敗`);
          data = await response.json();
          setCachedData(cacheKey, data);
        }
        setData(data);
        setLoaded(true);
      } catch (err) {
        console.error(`Failed to load ${apiPath}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [ocid]
  );

  const handleTabChange = (_event, newValue) => {
    setTabIndex(newValue);

    const key = TAB_CONFIG[newValue].key;

    if (key === 'union-raider' && !unionRaiderLoaded) {
      fetchTabData(
        'union-raider', 'union_raider',
        setUnionRaiderData, setUnionRaiderLoading,
        setUnionRaiderError, setUnionRaiderLoaded
      );
    } else if (key === 'hyper-stat' && !hyperStatLoaded) {
      fetchTabData(
        'hyper-stat', 'hyper_stat',
        setHyperStatData, setHyperStatLoading,
        setHyperStatError, setHyperStatLoaded
      );
    } else if (key === 'union-artifact' && !unionArtifactLoaded) {
      fetchTabData(
        'union-artifact', 'union_artifact',
        setUnionArtifactData, setUnionArtifactLoading,
        setUnionArtifactError, setUnionArtifactLoaded
      );
    }
  };

  const renderTabContent = () => {
    const key = TAB_CONFIG[tabIndex].key;

    switch (key) {
      case 'stats':
        return <CharacterStats ocid={ocid} />;
      case 'union-raider':
        return (
          <UnionRaiderPanel
            loading={unionRaiderLoading}
            error={unionRaiderError}
            data={unionRaiderData}
            onRetry={() =>
              fetchTabData(
                'union-raider', 'union_raider',
                setUnionRaiderData, setUnionRaiderLoading,
                setUnionRaiderError, setUnionRaiderLoaded
              )
            }
          />
        );
      case 'hyper-stat':
        return (
          <HyperStatPanel
            loading={hyperStatLoading}
            error={hyperStatError}
            data={hyperStatData}
            onRetry={() =>
              fetchTabData(
                'hyper-stat', 'hyper_stat',
                setHyperStatData, setHyperStatLoading,
                setHyperStatError, setHyperStatLoaded
              )
            }
          />
        );
      case 'set-effect':
        return (
          <SetEffectPanel
            loading={setEffectLoading}
            error={setEffectError}
            data={setEffectData}
            onRetry={onRetrySetEffect}
          />
        );
      case 'union-artifact':
        return (
          <UnionArtifactPanel
            loading={unionArtifactLoading}
            error={unionArtifactError}
            data={unionArtifactData}
            onRetry={() =>
              fetchTabData(
                'union-artifact', 'union_artifact',
                setUnionArtifactData, setUnionArtifactLoading,
                setUnionArtifactError, setUnionArtifactLoaded
              )
            }
          />
        );
      case 'runes':
        return <RuneSystems runes={runes} />;
      default:
        return null;
    }
  };

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          {TAB_CONFIG.map((tab) => (
            <Tab key={tab.key} label={tab.label} />
          ))}
        </Tabs>
        <Box>{renderTabContent()}</Box>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/components/CharacterDataTabs" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add components/CharacterDataTabs.js __tests__/components/CharacterDataTabs.test.js
git commit -m "feat: add CharacterDataTabs unified tabs component"
```

---

### Task 6: CharacterCard Three-Line Combat Power

Update CharacterCard to display bossing / current / leveling combat power.

**Files:**
- Modify: `components/CharacterCard.js`
- Modify: `__tests__/components/CharacterCard.test.js`

**Step 1: Write the failing test**

Add to `__tests__/components/CharacterCard.test.js`:

```js
describe('preset combat power display', () => {
  it('should display three-line combat power when presetAnalysis is provided', () => {
    const presetAnalysis = {
      current: { power: 11200000, presetNo: 3 },
      bossing: { power: 12345678, presetNo: 1 },
      leveling: { power: 9800000, presetNo: 2 },
    };

    render(
      <CharacterCard
        character={mockCharacter}
        battlePower={11200000}
        presetAnalysis={presetAnalysis}
      />
    );

    expect(screen.getByText('打王')).toBeInTheDocument();
    expect(screen.getByText('目前')).toBeInTheDocument();
    expect(screen.getByText('練等')).toBeInTheDocument();
  });

  it('should fallback to single battle power when presetAnalysis is null', () => {
    render(
      <CharacterCard
        character={mockCharacter}
        battlePower={11200000}
        presetAnalysis={null}
      />
    );

    expect(screen.getByText('戰鬥力')).toBeInTheDocument();
    expect(screen.getByText('11,200,000')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/components/CharacterCard" --verbose`
Expected: FAIL — "打王" not found

**Step 3: Update CharacterCard implementation**

Modify `components/CharacterCard.js` — replace the battle power section (lines 162-192) with:

```js
// Replace the existing battlePower section with this:
const CharacterCard = memo(function CharacterCard({
  character,
  unionData = null,
  battlePower = null,
  presetAnalysis = null,
  onEquipmentClick = null,
}) {
  const formatPower = (num) => num?.toLocaleString() || '-';

  // ... existing JSX up to the Battle Power section ...

  // Replace the {battlePower && ...} block with:
  {(presetAnalysis || battlePower) && (
    <>
      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: 'none', md: 'block' } }}
      />
      <Box
        sx={{
          textAlign: { xs: 'center', md: 'right' },
          flexShrink: 0,
          px: { md: 1 },
          minWidth: { md: 160 },
        }}
      >
        {presetAnalysis && presetAnalysis.bossing ? (
          <>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.5 }}
            >
              戰鬥力
            </Typography>
            {[
              { label: '打王', data: presetAnalysis.bossing },
              { label: '目前', data: presetAnalysis.current },
              ...(presetAnalysis.leveling
                ? [{ label: '練等', data: presetAnalysis.leveling }]
                : []),
            ].map(({ label, data }) => (
              <Box
                key={label}
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'center', md: 'space-between' },
                  alignItems: 'baseline',
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'bold',
                    color: label === '打王' ? 'primary.main' : 'text.primary',
                  }}
                >
                  {formatPower(data.power)}
                </Typography>
                {data.presetNo && (
                  <Typography variant="caption" color="text.secondary">
                    P{data.presetNo}
                  </Typography>
                )}
              </Box>
            ))}
          </>
        ) : (
          <>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.5 }}
            >
              戰鬥力
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 'bold', color: 'primary.main' }}
            >
              {battlePower?.toLocaleString()}
            </Typography>
          </>
        )}
      </Box>
    </>
  )}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/components/CharacterCard" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add components/CharacterCard.js __tests__/components/CharacterCard.test.js
git commit -m "feat: add three-line preset combat power display to CharacterCard"
```

---

### Task 7: Page Data Flow Integration

Wire everything together in `app/page.js`: prefetch equipment + set-effect, compute preset analysis, replace CharacterStats/RuneSystems with CharacterDataTabs, share data with EquipmentDialog.

**Files:**
- Modify: `app/page.js`
- Modify: `components/EquipmentDialog.js`

**Step 1: Update page.js state and imports**

Add imports at the top of `app/page.js`:

```js
import CharacterDataTabs from '../components/CharacterDataTabs';
import { analyzeAllPresets } from '../lib/combatPowerCalculator';
```

Remove these imports (content moved to CharacterDataTabs):
```js
// Remove: import CharacterStats from '../components/CharacterStats';
// Remove: import RuneSystems from '../components/runes/RuneSystems';
// Remove: import RuneErrorBoundary from '../components/runes/ErrorBoundary';
```

Add new state variables after existing state declarations (around line 50):

```js
const [presetAnalysis, setPresetAnalysis] = useState(null);
const [equipmentRawData, setEquipmentRawData] = useState(null);
const [setEffectData, setSetEffectData] = useState(null);
const [setEffectLoading, setSetEffectLoading] = useState(false);
const [setEffectError, setSetEffectError] = useState(null);
```

**Step 2: Update the searchCharacter function**

Modify the parallel fetch block (around line 95) to include equipment and set-effect:

```js
// Fetch stats, union, runes, equipment in parallel
const [statsResult, unionResult, runeResult, equipmentResult] =
  await Promise.all([
    apiCall(`/api/character/stats?ocid=${ocid}`).catch(() => null),
    apiCall(`/api/union/${ocid}`).catch(() => null),
    apiCall(`/api/character/${ocid}/runes`).catch(() => null),
    apiCall(`/api/character/equipment?ocid=${ocid}`).catch(() => null),
  ]);

// Staggered: set-effect (200ms delay to avoid rate limit)
let setEffectResult = null;
setSetEffectLoading(true);
try {
  await new Promise(resolve => setTimeout(resolve, 200));
  setEffectResult = await apiCall(
    `/api/character/set-effect?ocid=${ocid}`
  );
} catch {
  // non-critical, continue
} finally {
  setSetEffectLoading(false);
}
```

After processing battle power and union/rune data, add:

```js
// Process equipment data
let rawEquipment = null;
if (equipmentResult?.status >= 200 && equipmentResult?.status < 300) {
  rawEquipment = equipmentResult.data;
  setEquipmentRawData(rawEquipment);
}

// Process set effect data
let setEffect = null;
if (setEffectResult?.status >= 200 && setEffectResult?.status < 300) {
  setEffect = setEffectResult.data;
  setSetEffectData(setEffect);
} else {
  setSetEffectError('載入套裝效果失敗');
}

// Compute preset analysis
if (rawEquipment && statsResult?.data) {
  const symbolData = runeResult?.data || null;
  const analysis = analyzeAllPresets(
    rawEquipment,
    statsResult.data,
    symbolData,
    setEffect
  );
  setPresetAnalysis(analysis);
}
```

Also reset new state in the reset block at the top of searchCharacter:

```js
setPresetAnalysis(null);
setEquipmentRawData(null);
setSetEffectData(null);
setSetEffectLoading(false);
setSetEffectError(null);
```

**Step 3: Update JSX — CharacterCard props**

Pass `presetAnalysis` to CharacterCard (around line 343):

```jsx
<CharacterCard
  character={character}
  historicalData={chartData}
  unionData={unionData}
  battlePower={battlePower}
  presetAnalysis={presetAnalysis}
  onEquipmentClick={() => setEquipmentDialogOpen(true)}
/>
```

**Step 4: Replace CharacterStats and RuneSystems with CharacterDataTabs**

Remove the Stats Section and Rune Systems Section (approx lines 384-417), replace with:

```jsx
{/* Character Data Tabs */}
<Box sx={{ mt: 2 }}>
  <CharacterDataTabs
    ocid={character.ocid}
    runes={runes}
    setEffectData={setEffectData}
    setEffectLoading={setEffectLoading}
    setEffectError={setEffectError}
    onRetrySetEffect={async () => {
      setSetEffectLoading(true);
      setSetEffectError(null);
      try {
        const res = await apiCall(
          `/api/character/set-effect?ocid=${character.ocid}`
        );
        if (res?.status >= 200 && res?.status < 300) {
          setSetEffectData(res.data);
        }
      } catch {
        setSetEffectError('載入套裝效果失敗');
      } finally {
        setSetEffectLoading(false);
      }
    }}
  />
</Box>
```

**Step 5: Update EquipmentDialog to accept prefetchedData**

Modify `components/EquipmentDialog.js` — add `prefetchedData` prop and use it to skip the equipment fetch if data is already available:

In the component signature (line 30):
```js
const EquipmentDialog = ({ ocid, character, open, onClose, prefetchedData }) => {
```

In `loadEquipment` (around line 56), add prefetch check:
```js
const loadEquipment = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    let data;

    if (prefetchedData) {
      data = prefetchedData;
    } else {
      const cacheKey = `equipment_${ocid}`;
      data = getCachedData(cacheKey);

      if (!data) {
        const response = await fetch(
          `/api/character/equipment?ocid=${ocid}`
        );
        if (!response.ok) {
          throw new Error('載入裝備失敗');
        }
        data = await response.json();
        setCachedData(cacheKey, data);
      }
    }

    const processed = processEquipmentData(data);
    setEquipment(processed);
  } catch (err) {
    console.error('Failed to load equipment:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [ocid, prefetchedData]);
```

Pass the prop in `app/page.js`:

```jsx
<EquipmentDialog
  ocid={character.ocid}
  character={character}
  open={equipmentDialogOpen}
  onClose={() => setEquipmentDialogOpen(false)}
  prefetchedData={equipmentRawData}
/>
```

**Step 6: Verify the app builds and tests pass**

Run: `npm run build && npm test`
Expected: Build succeeds, all tests pass

**Step 7: Commit**

```bash
git add app/page.js components/EquipmentDialog.js
git commit -m "feat: integrate data flow — equipment prefetch, preset analysis, CharacterDataTabs"
```

---

### Task 8: Update CharacterStats for Tabs Integration

Modify CharacterStats to work inside Tabs (remove the Accordion wrapper, keep just the content).

**Files:**
- Modify: `components/CharacterStats.js`
- Modify: `__tests__/components/CharacterStats.test.js`

**Step 1: Modify CharacterStats**

Remove the outer `<Accordion>` wrapper. The component should render the stats table directly without Accordion since CharacterDataTabs provides the tab navigation.

Replace the return statement with just the stats table content (the Box with the three stat groups). Keep the loading spinner but without the Accordion wrapper. Remove `expanded` prop handling.

```js
const CharacterStats = ({ ocid }) => {
  // ... keep existing state and loadStats logic ...

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
          p: 2,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* ... keep existing stats group rendering logic ... */}
    </Box>
  );
};
```

Remove `Accordion`, `AccordionSummary`, `AccordionDetails` from imports and the `expanded` state/handler. Remove `ExpandMore` icon import.

**Step 2: Update tests**

Update `__tests__/components/CharacterStats.test.js` to remove Accordion-specific assertions (like testing expand/collapse behavior). Keep data rendering tests.

**Step 3: Run tests**

Run: `npm test -- --testPathPattern="__tests__/components/CharacterStats" --verbose`
Expected: PASS

**Step 4: Commit**

```bash
git add components/CharacterStats.js __tests__/components/CharacterStats.test.js
git commit -m "refactor: remove Accordion wrapper from CharacterStats for Tabs integration"
```

---

### Task 9: Final Verification

Run full test suite and build to confirm everything works together.

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests PASS

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Manual smoke test**

Run: `npm run dev`
- Search a character
- Verify three-line combat power appears in CharacterCard
- Click through all 6 tabs in CharacterDataTabs
- Open equipment dialog and verify it uses prefetched data (no extra network request)

**Step 5: Final commit (if any lint/format fixes needed)**

```bash
npm run format
git add -A
git commit -m "chore: format and fix lint issues"
```
