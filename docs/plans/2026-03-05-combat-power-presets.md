# Combat Power Preset Analysis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 CharacterCard 中顯示「打王戰力」「目前戰力」「練等戰力」三行，透過反推公式計算各 Preset 的戰鬥力，並自動辨識練等 Preset。

**Architecture:** 前端計算方案。在 `page.js` 的 `searchCharacter()` 中提前載入 equipment 資料（與 stats/union/runes 平行請求），傳入純函數計算模組 `combatPowerCalculator.js` 做 Preset 戰力推算和練等辨識，結果傳給 CharacterCard 顯示。equipment 資料同時共用給 EquipmentDialog 避免重複請求。

**Tech Stack:** Next.js 15, React, MUI 7, Jest 30

---

## 已驗證的公式

詳見 `docs/combat-power-formulas.md` 第十一、十二章。核心公式：

```
面板最高 = (主屬×4 + 副屬) × 武器係數 × 攻擊力 / 100 × (1+傷害%) × (1+終傷%)
戰鬥力 ≈ (主屬×4 + 副屬) × 1.3 × 攻擊力 / 100 × (1+傷害%+Boss傷%) × (1+爆傷%)
總屬性 = floor((C_base + 裝備固定值) × (1 + 裝備%)) + C_final
```

反推法：用當前 API stat 作為真值，分離獨立裝備（寶玉+圖騰）和 Preset 裝備，反推 C_base/C_final 常數，替換 Preset 裝備重算。

---

### Task 1: 核心計算模組 — 裝備分析函數

**Files:**

- Create: `lib/combatPowerCalculator.js`
- Create: `__tests__/lib/combatPowerCalculator.test.js`

**Step 1: Write failing tests for equipment analysis helpers**

```javascript
// __tests__/lib/combatPowerCalculator.test.js
import {
  parsePotentialOption,
  analyzeEquipment,
  identifyIndependentItems,
} from '../../lib/combatPowerCalculator';

describe('parsePotentialOption', () => {
  it('parses percentage stat', () => {
    expect(parsePotentialOption('LUK +13%')).toEqual({
      stat: 'LUK',
      value: 13,
      isPercent: true,
    });
  });

  it('parses flat stat', () => {
    expect(parsePotentialOption('LUK +19')).toEqual({
      stat: 'LUK',
      value: 19,
      isPercent: false,
    });
  });

  it('parses all stat percentage', () => {
    expect(parsePotentialOption('全屬性 +5%')).toEqual({
      stat: 'all_stat',
      value: 5,
      isPercent: true,
    });
  });

  it('parses level-based stat', () => {
    // 295 / 9 = 32, 32 * 2 = 64
    expect(parsePotentialOption('以角色等級為準每9級 LUK +2', 295)).toEqual({
      stat: 'LUK',
      value: 64,
      isPercent: false,
    });
  });

  it('returns null for null/empty input', () => {
    expect(parsePotentialOption(null)).toBeNull();
    expect(parsePotentialOption('')).toBeNull();
  });
});

describe('analyzeEquipment', () => {
  const mockItems = [
    {
      item_equipment_slot: '帽子',
      item_name: '永恆盜賊頭巾',
      item_total_option: {
        str: '129',
        dex: '249',
        int: '150',
        luk: '306',
        attack_power: '338',
        boss_damage: '0',
        ignore_monster_armor: '15',
        damage: '0',
      },
      potential_option_1: 'LUK +13%',
      potential_option_2: 'LUK +10%',
      potential_option_3: 'LUK +13%',
      additional_potential_option_1: 'LUK +9%',
      additional_potential_option_2: 'LUK +19',
      additional_potential_option_3: 'LUK +7%',
    },
  ];

  it('sums flat stats from total_option', () => {
    const result = analyzeEquipment(mockItems);
    expect(result.flat.LUK).toBe(306);
    expect(result.flat.ATK).toBe(338);
  });

  it('sums percentage stats from potentials', () => {
    const result = analyzeEquipment(mockItems);
    // 13+10+13+9+7 = 52% LUK
    expect(result.pct.LUK).toBe(52);
  });

  it('sums flat stats from potentials', () => {
    const result = analyzeEquipment(mockItems);
    expect(result.potFlat.LUK).toBe(19);
  });
});

describe('identifyIndependentItems', () => {
  const currentItems = [
    { item_equipment_slot: '帽子', item_name: 'A' },
    { item_equipment_slot: '墜飾', item_name: '培羅德墜飾' },
    { item_equipment_slot: '墜飾', item_name: '伊妮絲的寶玉' },
    { item_equipment_slot: '馬鞍', item_name: '圖騰A' },
  ];
  const presetSlots = new Set(['帽子', '墜飾']);

  it('identifies items not in any preset slot', () => {
    const result = identifyIndependentItems(currentItems, presetSlots);
    expect(result.find(i => i.item_name === '圖騰A')).toBeTruthy();
  });

  it('identifies duplicate-slot items as independent (jewel)', () => {
    const result = identifyIndependentItems(currentItems, presetSlots);
    expect(result.find(i => i.item_name === '伊妮絲的寶玉')).toBeTruthy();
  });

  it('does not include first occurrence of preset slots', () => {
    const result = identifyIndependentItems(currentItems, presetSlots);
    expect(result.find(i => i.item_name === '培羅德墜飾')).toBeFalsy();
    expect(result.find(i => i.item_name === 'A')).toBeFalsy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="combatPowerCalculator" --no-coverage`
Expected: FAIL — modules not found

**Step 3: Implement the helper functions**

```javascript
// lib/combatPowerCalculator.js

const STAT_NAME_MAP = {
  STR: 'STR',
  DEX: 'DEX',
  INT: 'INT',
  LUK: 'LUK',
  全屬性: 'all_stat',
  攻擊力: 'ATK',
  魔法攻擊力: 'MATK',
  BOSS怪物傷害: 'boss_damage',
  傷害: 'damage',
  無視怪物防禦率: 'ignore_def',
  爆擊傷害: 'crit_damage',
};

const POTENTIAL_KEYS = [
  'potential_option_1',
  'potential_option_2',
  'potential_option_3',
  'additional_potential_option_1',
  'additional_potential_option_2',
  'additional_potential_option_3',
];

export function parsePotentialOption(text, characterLevel = 295) {
  if (!text) return null;

  // 百分比: "LUK +13%"
  let m = text.match(/^(.+?)\s*\+\s*(\d+)%$/);
  if (m) {
    const stat = STAT_NAME_MAP[m[1].trim()] || m[1].trim();
    return { stat, value: parseInt(m[2]), isPercent: true };
  }

  // 固定值: "LUK +19"
  m = text.match(/^(.+?)\s*\+\s*(\d+)$/);
  if (m) {
    const stat = STAT_NAME_MAP[m[1].trim()] || m[1].trim();
    return { stat, value: parseInt(m[2]), isPercent: false };
  }

  // 等級型: "以角色等級為準每9級 LUK +2"
  m = text.match(/以角色等級為準每(\d+)級\s*(\w+)\s*\+\s*(\d+)/);
  if (m) {
    const stat = STAT_NAME_MAP[m[2]] || m[2];
    const value = Math.floor(characterLevel / parseInt(m[1])) * parseInt(m[3]);
    return { stat, value, isPercent: false };
  }

  return null;
}

export function analyzeEquipment(items, characterLevel = 295) {
  const flat = { STR: 0, DEX: 0, INT: 0, LUK: 0, ATK: 0 };
  const pct = { STR: 0, DEX: 0, INT: 0, LUK: 0, all_stat: 0, ATK: 0 };
  const potFlat = { STR: 0, DEX: 0, INT: 0, LUK: 0, ATK: 0 };

  for (const item of items) {
    const opt = item.item_total_option || {};
    flat.STR += parseInt(opt.str || 0);
    flat.DEX += parseInt(opt.dex || 0);
    flat.INT += parseInt(opt.int || 0);
    flat.LUK += parseInt(opt.luk || 0);
    flat.ATK += parseInt(opt.attack_power || 0);

    for (const key of POTENTIAL_KEYS) {
      const parsed = parsePotentialOption(item[key], characterLevel);
      if (!parsed) continue;
      if (parsed.isPercent && parsed.stat in pct) {
        pct[parsed.stat] += parsed.value;
      } else if (!parsed.isPercent && parsed.stat in potFlat) {
        potFlat[parsed.stat] += parsed.value;
      }
    }
  }

  return { flat, pct, potFlat };
}

export function identifyIndependentItems(currentItems, presetSlots) {
  const independent = [];
  const seenSlots = new Set();

  for (const item of currentItems) {
    const slot = item.item_equipment_slot;
    if (!presetSlots.has(slot)) {
      independent.push(item);
    } else if (seenSlots.has(slot)) {
      independent.push(item);
    } else {
      seenSlots.add(slot);
    }
  }

  return independent;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="combatPowerCalculator" --no-coverage`
Expected: All PASS

**Step 5: Commit**

```bash
git add lib/combatPowerCalculator.js __tests__/lib/combatPowerCalculator.test.js
git commit -m "feat: add equipment analysis helpers for combat power calculator"
```

---

### Task 2: 核心計算模組 — Preset 戰力推算

**Files:**

- Modify: `lib/combatPowerCalculator.js`
- Modify: `__tests__/lib/combatPowerCalculator.test.js`

**Step 1: Write failing tests for preset combat power calculation**

```javascript
// 追加到 __tests__/lib/combatPowerCalculator.test.js
import { calculatePresetCombatPower } from '../../lib/combatPowerCalculator';

describe('calculatePresetCombatPower', () => {
  // 簡化的測試數據，驗證公式邏輯
  const mockStats = {
    final_stat: [
      { stat_name: 'LUK', stat_value: '10000' },
      { stat_name: 'DEX', stat_value: '2000' },
      { stat_name: 'STR', stat_value: '1000' },
      { stat_name: 'INT', stat_value: '1000' },
      { stat_name: '攻擊力', stat_value: '5000' },
      { stat_name: '傷害', stat_value: '90.00' },
      { stat_name: 'BOSS怪物傷害', stat_value: '300.00' },
      { stat_name: '最終傷害', stat_value: '50.00' },
      { stat_name: '爆擊傷害', stat_value: '80.00' },
      { stat_name: '戰鬥力', stat_value: '100000000' },
    ],
  };

  const mockEquipment = {
    item_equipment: [
      {
        item_equipment_slot: '帽子',
        item_name: 'Hat',
        item_total_option: {
          str: '0',
          dex: '0',
          int: '0',
          luk: '100',
          attack_power: '50',
          boss_damage: '0',
          ignore_monster_armor: '0',
          damage: '0',
        },
        potential_option_1: 'LUK +10%',
        potential_option_2: null,
        potential_option_3: null,
        additional_potential_option_1: null,
        additional_potential_option_2: null,
        additional_potential_option_3: null,
      },
    ],
    item_equipment_preset_1: [
      {
        item_equipment_slot: '帽子',
        item_name: 'Hat',
        item_total_option: {
          str: '0',
          dex: '0',
          int: '0',
          luk: '100',
          attack_power: '50',
          boss_damage: '0',
          ignore_monster_armor: '0',
          damage: '0',
        },
        potential_option_1: 'LUK +10%',
        potential_option_2: null,
        potential_option_3: null,
        additional_potential_option_1: null,
        additional_potential_option_2: null,
        additional_potential_option_3: null,
      },
    ],
    item_equipment_preset_2: [],
    item_equipment_preset_3: [],
  };

  const mockSymbols = [{ symbol_level: 20 }, { symbol_level: 10 }];

  it('returns an array of preset results', () => {
    const result = calculatePresetCombatPower(
      mockStats,
      mockEquipment,
      mockSymbols,
      '暗夜行者',
      295
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it('marks empty presets as null', () => {
    const result = calculatePresetCombatPower(
      mockStats,
      mockEquipment,
      mockSymbols,
      '暗夜行者',
      295
    );
    // preset 2 and 3 are empty
    expect(result[1]).toBeNull();
    expect(result[2]).toBeNull();
  });

  it('includes estimated combat power for valid presets', () => {
    const result = calculatePresetCombatPower(
      mockStats,
      mockEquipment,
      mockSymbols,
      '暗夜行者',
      295
    );
    expect(result[0]).not.toBeNull();
    expect(result[0].combatPower).toBeGreaterThan(0);
    expect(result[0].maxRange).toBeGreaterThan(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="combatPowerCalculator" --no-coverage`
Expected: FAIL — `calculatePresetCombatPower` not found

**Step 3: Implement preset combat power calculation**

追加到 `lib/combatPowerCalculator.js`：

```javascript
// 職業主副屬性對照表
const CLASS_STAT_MAP = {
  // LUK 系
  夜使者: { main: 'LUK', sub: 'DEX', weapon: 1.75 },
  暗夜行者: { main: 'LUK', sub: 'DEX', weapon: 1.75 },
  暗影乃特: { main: 'LUK', sub: 'DEX', weapon: 1.75 },
  幻影: { main: 'LUK', sub: 'DEX', weapon: 1.3 },
  神偷: { main: 'LUK', sub: 'DEX', weapon: 1.75 },
  影武者: { main: 'LUK', sub: 'DEX', weapon: 1.75 },
  暗影神偷: { main: 'LUK', sub: 'DEX', weapon: 1.75 },
  卡蒂娜: { main: 'LUK', sub: 'DEX', weapon: 1.3 },
  虎影: { main: 'LUK', sub: 'DEX', weapon: 1.75 },
  // STR 系
  英雄: { main: 'STR', sub: 'DEX', weapon: 1.44 },
  聖騎士: { main: 'STR', sub: 'DEX', weapon: 1.34 },
  黑騎士: { main: 'STR', sub: 'DEX', weapon: 1.49 },
  乾坤一擊: { main: 'STR', sub: 'DEX', weapon: 1.7 },
  蒼龍俠客: { main: 'STR', sub: 'DEX', weapon: 1.49 },
  神之子: { main: 'STR', sub: 'DEX', weapon: 1.44 },
  亞克: { main: 'STR', sub: 'DEX', weapon: 1.3 },
  亞德雷: { main: 'STR', sub: 'DEX', weapon: 1.3 },
  劍豪: { main: 'STR', sub: 'DEX', weapon: 1.25 },
  琳恩: { main: 'STR', sub: 'DEX', weapon: 1.34 },
  // DEX 系
  箭神: { main: 'DEX', sub: 'STR', weapon: 1.3 },
  神射手: { main: 'DEX', sub: 'STR', weapon: 1.35 },
  乘風破浪: { main: 'DEX', sub: 'STR', weapon: 1.35 },
  乘風破浪者: { main: 'DEX', sub: 'STR', weapon: 1.35 },
  乘風破浪客: { main: 'DEX', sub: 'STR', weapon: 1.35 },
  開拓者: { main: 'DEX', sub: 'STR', weapon: 1.3 },
  凱殷: { main: 'DEX', sub: 'STR', weapon: 1.35 },
  // INT 系
  火毒: { main: 'INT', sub: 'LUK', weapon: 1.2 },
  冰雷: { main: 'INT', sub: 'LUK', weapon: 1.2 },
  主教: { main: 'INT', sub: 'LUK', weapon: 1.2 },
  烈焰巫師: { main: 'INT', sub: 'LUK', weapon: 1.2 },
  乙太: { main: 'INT', sub: 'LUK', weapon: 1.2 },
  夜光: { main: 'INT', sub: 'LUK', weapon: 1.2 },
  幻獸師: { main: 'INT', sub: 'LUK', weapon: 1.2 },
  陰陽師: { main: 'INT', sub: 'LUK', weapon: 1.3 },
  琉: { main: 'INT', sub: 'LUK', weapon: 1.2 },
  // 特殊
  傑諾: { main: 'STR', sub: 'DEX', weapon: 1.3125, isXenon: true },
};

// 預設值：如果職業不在對照表中，用通用係數
const DEFAULT_CLASS_INFO = { main: 'STR', sub: 'DEX', weapon: 1.3 };

function getClassInfo(className) {
  // 嘗試精確匹配，不行就模糊匹配
  if (CLASS_STAT_MAP[className]) return CLASS_STAT_MAP[className];
  for (const [key, value] of Object.entries(CLASS_STAT_MAP)) {
    if (className.includes(key) || key.includes(className)) return value;
  }
  return DEFAULT_CLASS_INFO;
}

function extractStatValue(stats, statName) {
  const stat = stats.final_stat?.find(s => s.stat_name === statName);
  return stat ? parseFloat(stat.stat_value) : 0;
}

export function calculatePresetCombatPower(
  statsData,
  equipmentData,
  symbols,
  characterClass,
  characterLevel
) {
  const classInfo = getClassInfo(characterClass);

  // 當前 API 真值
  const apiMainStat = extractStatValue(statsData, classInfo.main);
  const apiSubStat = extractStatValue(statsData, classInfo.sub);
  const apiATK = extractStatValue(statsData, '攻擊力');
  const apiDamage = extractStatValue(statsData, '傷害');
  const apiBoss = extractStatValue(statsData, 'BOSS怪物傷害');
  const apiFinalDmg = extractStatValue(statsData, '最終傷害');
  const apiCritDmg = extractStatValue(statsData, '爆擊傷害');

  // 符文最終屬性 (C_final)
  const cFinal = (symbols || []).reduce(
    (sum, s) => sum + 100 + (s.symbol_level || 0) * 100,
    0
  );

  // 收集所有 preset 的 slots
  const allPresetSlots = new Set();
  for (let i = 1; i <= 3; i++) {
    const items = equipmentData[`item_equipment_preset_${i}`] || [];
    for (const item of items) {
      allPresetSlots.add(item.item_equipment_slot);
    }
  }

  // 分離獨立裝備
  const currentItems = equipmentData.item_equipment || [];
  const independentItems = identifyIndependentItems(
    currentItems,
    allPresetSlots
  );
  const indAnalysis = analyzeEquipment(independentItems, characterLevel);

  // 當前 preset 部位裝備（排除獨立裝備）
  const currentPresetItems = currentItems.filter(item => {
    return !independentItems.includes(item);
  });
  const curAnalysis = analyzeEquipment(currentPresetItems, characterLevel);

  // 反推 C_base（對主屬、副屬、ATK 各自反推）
  function reverseBase(
    apiVal,
    indFlat,
    indPotFlat,
    curFlat,
    curPotFlat,
    indPct,
    curPct,
    hasFinal
  ) {
    const totalFlat = indFlat + indPotFlat + curFlat + curPotFlat;
    const totalPct = indPct + curPct;
    return (
      (apiVal - (hasFinal ? cFinal : 0)) / (1 + totalPct / 100) - totalFlat
    );
  }

  const mainKey = classInfo.main;
  const subKey = classInfo.sub;

  const cBaseMain = reverseBase(
    apiMainStat,
    indAnalysis.flat[mainKey],
    indAnalysis.potFlat[mainKey],
    curAnalysis.flat[mainKey],
    curAnalysis.potFlat[mainKey],
    indAnalysis.pct[mainKey] + indAnalysis.pct.all_stat,
    curAnalysis.pct[mainKey] + curAnalysis.pct.all_stat,
    true
  );

  const cBaseSub = reverseBase(
    apiSubStat,
    indAnalysis.flat[subKey],
    indAnalysis.potFlat[subKey],
    curAnalysis.flat[subKey],
    curAnalysis.potFlat[subKey],
    indAnalysis.pct[subKey] + indAnalysis.pct.all_stat,
    curAnalysis.pct[subKey] + curAnalysis.pct.all_stat,
    true
  );

  const cBaseATK = reverseBase(
    apiATK,
    indAnalysis.flat.ATK,
    0,
    curAnalysis.flat.ATK,
    0,
    indAnalysis.pct.ATK,
    curAnalysis.pct.ATK,
    false
  );

  // 計算各 Preset
  const results = [];
  for (let i = 1; i <= 3; i++) {
    const presetItems = equipmentData[`item_equipment_preset_${i}`] || [];
    if (presetItems.length === 0) {
      results.push(null);
      continue;
    }

    const pa = analyzeEquipment(presetItems, characterLevel);

    function calcStat(cBase, cf, indF, indPF, paF, paPF, indP, paP) {
      const totalFlat = indF + indPF + paF + paPF;
      const totalPct = indP + paP;
      return Math.floor((cBase + totalFlat) * (1 + totalPct / 100)) + cf;
    }

    const mainStat = calcStat(
      cBaseMain,
      cFinal,
      indAnalysis.flat[mainKey],
      indAnalysis.potFlat[mainKey],
      pa.flat[mainKey],
      pa.potFlat[mainKey],
      indAnalysis.pct[mainKey] + indAnalysis.pct.all_stat,
      pa.pct[mainKey] + pa.pct.all_stat
    );

    const subStat = calcStat(
      cBaseSub,
      cFinal,
      indAnalysis.flat[subKey],
      indAnalysis.potFlat[subKey],
      pa.flat[subKey],
      pa.potFlat[subKey],
      indAnalysis.pct[subKey] + indAnalysis.pct.all_stat,
      pa.pct[subKey] + pa.pct.all_stat
    );

    const atk = calcStat(
      cBaseATK,
      0,
      indAnalysis.flat.ATK,
      0,
      pa.flat.ATK,
      0,
      indAnalysis.pct.ATK,
      pa.pct.ATK
    );

    const w = classInfo.weapon;
    const maxRange =
      (((mainStat * 4 + subStat) * w * atk) / 100) *
      (1 + apiDamage / 100) *
      (1 + apiFinalDmg / 100);
    const combatPower =
      (((mainStat * 4 + subStat) * 1.3 * atk) / 100) *
      (1 + (apiDamage + apiBoss) / 100) *
      (1 + apiCritDmg / 100);

    results.push({
      presetNo: i,
      mainStat,
      subStat,
      atk,
      maxRange: Math.floor(maxRange),
      combatPower: Math.floor(combatPower),
    });
  }

  return results;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="combatPowerCalculator" --no-coverage`
Expected: All PASS

**Step 5: Commit**

```bash
git add lib/combatPowerCalculator.js __tests__/lib/combatPowerCalculator.test.js
git commit -m "feat: add preset combat power calculation with reverse-engineering formula"
```

---

### Task 3: 練等 Preset 辨識

**Files:**

- Modify: `lib/combatPowerCalculator.js`
- Modify: `__tests__/lib/combatPowerCalculator.test.js`

**Step 1: Write failing tests**

```javascript
import {
  identifyLevelingPreset,
  analyzeAllPresets,
} from '../../lib/combatPowerCalculator';

describe('identifyLevelingPreset', () => {
  const makeMockItem = (potentials = []) => ({
    item_equipment_slot: '帽子',
    item_name: 'Hat',
    item_total_option: {
      str: '0',
      dex: '0',
      int: '0',
      luk: '0',
      attack_power: '0',
    },
    potential_option_1: potentials[0] || null,
    potential_option_2: potentials[1] || null,
    potential_option_3: potentials[2] || null,
    additional_potential_option_1: potentials[3] || null,
    additional_potential_option_2: potentials[4] || null,
    additional_potential_option_3: potentials[5] || null,
  });

  it('identifies preset with drop rate potentials as leveling', () => {
    const items = [
      makeMockItem(['道具掉落率 +20%', '道具掉落率 +20%', 'LUK +13%']),
      makeMockItem(['楓幣獲得量 +20%', 'LUK +10%', 'LUK +13%']),
    ];
    expect(identifyLevelingPreset(items)).toBe(true);
  });

  it('does not identify boss preset as leveling', () => {
    const items = [
      makeMockItem(['LUK +13%', 'LUK +10%', 'LUK +13%']),
      makeMockItem(['BOSS怪物傷害 +30%', 'LUK +10%', 'LUK +13%']),
    ];
    expect(identifyLevelingPreset(items)).toBe(false);
  });

  it('identifies preset with mob damage potentials as leveling', () => {
    const items = [
      makeMockItem(['道具掉落率 +20%', '一般怪物傷害 +10%', 'LUK +13%']),
      makeMockItem(['楓幣獲得量 +20%', 'LUK +10%', 'LUK +13%']),
    ];
    expect(identifyLevelingPreset(items)).toBe(true);
  });
});

describe('analyzeAllPresets', () => {
  it('returns object with bossing, current, leveling keys', () => {
    // 使用最小 mock
    const stats = {
      final_stat: [
        { stat_name: 'LUK', stat_value: '10000' },
        { stat_name: 'DEX', stat_value: '2000' },
        { stat_name: '攻擊力', stat_value: '5000' },
        { stat_name: '傷害', stat_value: '90' },
        { stat_name: 'BOSS怪物傷害', stat_value: '300' },
        { stat_name: '最終傷害', stat_value: '50' },
        { stat_name: '爆擊傷害', stat_value: '80' },
        { stat_name: '戰鬥力', stat_value: '100000000' },
      ],
    };
    const equipment = {
      item_equipment: [],
      item_equipment_preset_1: [],
      item_equipment_preset_2: [],
      item_equipment_preset_3: [],
    };

    const result = analyzeAllPresets(stats, equipment, [], '暗夜行者', 295);
    expect(result).toHaveProperty('bossing');
    expect(result).toHaveProperty('current');
    expect(result).toHaveProperty('leveling');
    expect(result.current).toHaveProperty('combatPower');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="combatPowerCalculator" --no-coverage`
Expected: FAIL

**Step 3: Implement leveling detection and main entry point**

追加到 `lib/combatPowerCalculator.js`：

```javascript
const LEVELING_KEYWORDS = ['道具掉落率', '楓幣獲得量', '一般怪物傷害'];

const LEVELING_THRESHOLD = 3; // 至少 3 條練等相關潛能

export function identifyLevelingPreset(presetItems) {
  let count = 0;
  for (const item of presetItems) {
    for (const key of POTENTIAL_KEYS) {
      const text = item[key];
      if (!text) continue;
      if (LEVELING_KEYWORDS.some(kw => text.includes(kw))) {
        count++;
      }
    }
  }
  return count >= LEVELING_THRESHOLD;
}

export function analyzeAllPresets(
  statsData,
  equipmentData,
  symbols,
  characterClass,
  characterLevel
) {
  const currentCP = extractStatValue(statsData, '戰鬥力');

  const presetResults = calculatePresetCombatPower(
    statsData,
    equipmentData,
    symbols,
    characterClass,
    characterLevel
  );

  // 辨識各 Preset 類型
  let bossing = null;
  let leveling = null;

  const validPresets = presetResults
    .filter(r => r !== null)
    .map(r => {
      const items = equipmentData[`item_equipment_preset_${r.presetNo}`] || [];
      const isLeveling = identifyLevelingPreset(items);
      return { ...r, isLeveling };
    });

  // 練等 Preset = 被辨識為練等的
  const levelingPresets = validPresets.filter(p => p.isLeveling);
  if (levelingPresets.length > 0) {
    leveling = levelingPresets.reduce((a, b) =>
      a.combatPower > b.combatPower ? a : b
    );
  }

  // 打王 Preset = 非練等中戰力最高的
  const bossingPresets = validPresets.filter(p => !p.isLeveling);
  if (bossingPresets.length > 0) {
    bossing = bossingPresets.reduce((a, b) =>
      a.combatPower > b.combatPower ? a : b
    );
  }

  return {
    bossing,
    leveling,
    current: { combatPower: Math.floor(currentCP) },
    presets: presetResults,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="combatPowerCalculator" --no-coverage`
Expected: All PASS

**Step 5: Commit**

```bash
git add lib/combatPowerCalculator.js __tests__/lib/combatPowerCalculator.test.js
git commit -m "feat: add leveling preset identification and analyzeAllPresets entry point"
```

---

### Task 4: 資料流調整 — equipment 提前載入並共用

**Files:**

- Modify: `app/page.js`
- Modify: `components/EquipmentDialog.js`

**Step 1: Modify page.js to fetch equipment in parallel and compute presets**

在 `app/page.js` 的 `searchCharacter` 函數中：

1. 在 `Promise.all` 中新增 equipment API 呼叫
2. 計算 preset 分析結果
3. 將 equipment 和 preset 結果存入 state
4. 將 equipment 傳給 EquipmentDialog（避免重複請求）

```javascript
// page.js 修改重點（非完整檔案）

// 新增 import
import { analyzeAllPresets } from '../lib/combatPowerCalculator';

// 新增 state
const [presetAnalysis, setPresetAnalysis] = useState(null);
const [equipmentRawData, setEquipmentRawData] = useState(null);

// 在 Promise.all 中新增 equipment
const [statsResult, unionResult, runeResult, equipResult] = await Promise.all([
  apiCall(`/api/character/stats?ocid=${ocid}`).catch(() => null),
  apiCall(`/api/union/${ocid}`).catch(() => null),
  apiCall(`/api/character/${ocid}/runes`).catch(() => null),
  apiCall(`/api/character/equipment?ocid=${ocid}`).catch(() => null),
]);

// 處理 equipment 並計算 preset 分析
if (equipResult?.status >= 200 && equipResult?.status < 300) {
  setEquipmentRawData(equipResult.data);
}

// 當 stats + equipment + runes 都有時，計算 preset
if (statsResult?.data && equipResult?.data) {
  const symbols = runeResult?.data?.symbol || [];
  const analysis = analyzeAllPresets(
    statsResult.data,
    equipResult.data,
    symbols,
    latestCharacter.character_class,
    latestCharacter.character_level
  );
  setPresetAnalysis(analysis);
}

// 傳給 CharacterCard
<CharacterCard
  character={character}
  unionData={unionData}
  battlePower={battlePower}
  presetAnalysis={presetAnalysis}
  onEquipmentClick={() => setEquipmentDialogOpen(true)}
/>

// 傳 raw data 給 EquipmentDialog
<EquipmentDialog
  ocid={character.ocid}
  character={character}
  open={equipmentDialogOpen}
  onClose={() => setEquipmentDialogOpen(false)}
  prefetchedData={equipmentRawData}
/>
```

**Step 2: Modify EquipmentDialog to accept prefetched data**

在 `components/EquipmentDialog.js` 中，修改 useEffect 讓它在有 `prefetchedData` 時直接使用，不再重新請求：

```javascript
// EquipmentDialog.js 修改重點
const EquipmentDialog = ({ ocid, character, open, onClose, prefetchedData = null }) => {
  // ... 在 useEffect 中:
  // 如果有 prefetchedData，直接使用
  if (prefetchedData) {
    const processed = processEquipmentData(prefetchedData);
    setEquipment(processed);
    return;
  }
  // 否則正常 fetch...
```

**Step 3: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add app/page.js components/EquipmentDialog.js
git commit -m "feat: prefetch equipment data and compute preset analysis in main data flow"
```

---

### Task 5: CharacterCard UI — 三行戰力顯示

**Files:**

- Modify: `components/CharacterCard.js`

**Step 1: Update CharacterCard to display preset combat power**

將右側戰鬥力區域從單一數字改為三行顯示：

```javascript
// components/CharacterCard.js
import { memo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  CardContent,
  Button,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import GroupsIcon from '@mui/icons-material/Groups';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import DiamondIcon from '@mui/icons-material/Diamond';

const formatCombatPower = value => {
  if (!value || value <= 0) return '-';
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}億`;
  } else if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}萬`;
  }
  return value.toLocaleString();
};

const CombatPowerRow = ({ label, value, presetNo, color = 'text.primary' }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 2,
    }}
  >
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ whiteSpace: 'nowrap' }}
    >
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography variant="body1" sx={{ fontWeight: 'bold', color }}>
        {formatCombatPower(value)}
      </Typography>
      {presetNo && (
        <Tooltip title={`對應 Preset ${presetNo}`}>
          <Typography variant="caption" color="text.disabled">
            P{presetNo}
          </Typography>
        </Tooltip>
      )}
    </Box>
  </Box>
);

const CharacterCard = memo(function CharacterCard({
  character,
  unionData = null,
  battlePower = null,
  presetAnalysis = null,
  onEquipmentClick = null,
}) {
  const hasPresetData =
    presetAnalysis && (presetAnalysis.bossing || presetAnalysis.leveling);

  return (
    <CardContent
      role="region"
      aria-labelledby={`character-${character.ocid || character.character_name}`}
      sx={{ p: 3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'flex-start' },
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* Avatar */}
        {character.character_image && (
          <Avatar
            src={character.character_image}
            alt={`${character.character_name} 角色頭像`}
            sx={{
              width: { xs: 80, md: 96 },
              height: { xs: 80, md: 96 },
              flexShrink: 0,
            }}
          />
        )}

        {/* Character info - middle section (unchanged) */}
        <Box
          sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', md: 'left' } }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'baseline' },
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              id={`character-${character.ocid || character.character_name}`}
              variant="h5"
              component="h3"
              sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}
            >
              {character.character_name}
            </Typography>
            <Chip
              label={`Lv.${character.character_level}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              {character.world_name}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: { xs: 'center', md: 'flex-start' },
              mb: 1.5,
            }}
          >
            <Chip
              icon={<WorkIcon />}
              label={`${character.character_class} ${character.character_class_level}`}
              size="small"
              variant="outlined"
              sx={{ px: 1 }}
            />
            {character.character_guild_name && (
              <Chip
                icon={<GroupsIcon />}
                label={character.character_guild_name}
                size="small"
                variant="outlined"
                sx={{ px: 1 }}
              />
            )}
            {unionData && (
              <>
                <Chip
                  icon={<MilitaryTechIcon />}
                  label={`${unionData.union_grade} Lv.${unionData.union_level}`}
                  size="small"
                  variant="outlined"
                  sx={{ px: 1 }}
                />
                <Chip
                  icon={<DiamondIcon />}
                  label={`神器 Lv.${unionData.union_artifact_level}`}
                  size="small"
                  variant="outlined"
                  sx={{ px: 1 }}
                />
              </>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            {onEquipmentClick && (
              <Button
                variant="outlined"
                size="small"
                onClick={onEquipmentClick}
                sx={{ fontWeight: 'medium' }}
              >
                裝備
              </Button>
            )}
            <Typography variant="caption" color="text.secondary">
              最後更新:{' '}
              {character.date
                ? new Date(character.date).toLocaleString()
                : new Date().toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Combat Power - right section */}
        {battlePower && (
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
              {hasPresetData ? (
                <>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                  >
                    戰鬥力總覽
                  </Typography>
                  {presetAnalysis.bossing && (
                    <CombatPowerRow
                      label="打王"
                      value={presetAnalysis.bossing.combatPower}
                      presetNo={presetAnalysis.bossing.presetNo}
                      color="error.main"
                    />
                  )}
                  <CombatPowerRow
                    label="目前"
                    value={battlePower}
                    color="primary.main"
                  />
                  {presetAnalysis.leveling && (
                    <CombatPowerRow
                      label="練等"
                      value={presetAnalysis.leveling.combatPower}
                      presetNo={presetAnalysis.leveling.presetNo}
                      color="success.main"
                    />
                  )}
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
                    {battlePower.toLocaleString()}
                  </Typography>
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </CardContent>
  );
});

export default CharacterCard;
```

**Step 2: Run build to verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/CharacterCard.js
git commit -m "feat: display bossing/current/leveling combat power in CharacterCard"
```

---

### Task 6: 整合測試與收尾

**Files:**

- Run: existing tests + manual verification

**Step 1: Run all tests**

Run: `npm test -- --no-coverage`
Expected: All tests pass

**Step 2: Run dev server and manually verify**

Run: `npm run dev`
Verify:

1. 搜尋角色後，CharacterCard 右側顯示三行戰力
2. 如果角色只有一套裝備（沒有不同 preset），只顯示「目前戰力」
3. 點擊「裝備」按鈕，EquipmentDialog 正常打開（不會重複請求）
4. Preset 編號（P1/P2/P3）正確顯示

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete combat power preset analysis feature"
```

---

## 注意事項

- **職業對照表**不完整，Task 2 中的 `CLASS_STAT_MAP` 只涵蓋了常見職業。後續可以根據用戶回饋補充。
- **練等辨識門檻** `LEVELING_THRESHOLD = 3` 是初始值，可能需要根據實際數據調整。
- **戰鬥力公式**有約 2% 系統性誤差（見 `docs/combat-power-formulas.md`），這是已知限制。
- **符文屬性公式** `100 + level × 100` 為推算值，可能需要根據更多角色數據驗證。
