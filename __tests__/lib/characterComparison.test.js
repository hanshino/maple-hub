/**
 * @jest-environment node
 */

import {
  normalizeCharacterForComparison,
  compareCharacters,
  rankUpgradeDirections,
} from '../../lib/characterComparison.js';

// --- Fixture helpers -------------------------------------------------

const stat = (name, value) => ({ stat_name: name, stat_value: String(value) });

/**
 * Builds a `getFullCharacterData`-shaped raw response (see
 * lib/db/queries.js:449-481). Keeps every category present with sane
 * empty defaults so individual tests only need to override what they
 * care about.
 */
function makeRawCharacter({
  ocid = 'OCID_BASE',
  name = 'Base Character',
  characterClass = '暗殺者',
  level = 290,
  world = '重生',
  combatPower = 1000000000,
  finalStat = [],
  equipmentPresetActive = 1,
  equipmentItems = [],
  hyperStatUsePresetNo = '1',
  hyperStatPresets = {},
  linkSkillUsePresetNo = '1',
  linkSkillPresets = {},
  ownedLinkSkill = null,
  union = { union_level: 1000, union_grade: null, union_artifact_level: null },
  raiderStats = [],
  hexaCores = [],
  hexaStats = {},
  symbols = [],
  setEffects = [],
  familiar = null,
  syncedAt = '2026-07-17T00:00:00.000Z',
} = {}) {
  return {
    basicInfo: {
      ocid,
      character_name: name,
      character_level: level,
      character_class: characterClass,
      character_class_level: null,
      world_name: world,
      character_image: null,
      character_exp_rate: null,
      character_gender: null,
      character_guild_name: null,
      combat_power: combatPower,
    },
    stats: { final_stat: finalStat },
    equipment: {
      preset_no: equipmentPresetActive,
      item_equipment: equipmentItems,
      item_equipment_preset_1: [],
      item_equipment_preset_2: [],
      item_equipment_preset_3: [],
    },
    equipment_presets: {
      active: equipmentPresetActive,
      presets: { 1: [], 2: [], 3: [] },
    },
    hyperStats: {
      use_preset_no: hyperStatUsePresetNo,
      hyper_stat_preset_1: hyperStatPresets['1'] || [],
      hyper_stat_preset_2: hyperStatPresets['2'] || [],
      hyper_stat_preset_3: hyperStatPresets['3'] || [],
    },
    linkSkills: {
      use_preset_no: linkSkillUsePresetNo,
      character_link_skill_preset_1: linkSkillPresets['1'] || [],
      character_link_skill_preset_2: linkSkillPresets['2'] || [],
      character_link_skill_preset_3: linkSkillPresets['3'] || [],
      character_owned_link_skill: ownedLinkSkill,
    },
    hexaCores: { character_hexa_core_equipment: hexaCores },
    hexaStats,
    symbols: { symbol: symbols },
    setEffects: { set_effect: setEffects },
    union,
    unionRaider: { union_raider_stat: raiderStats },
    unionArtifacts: { union_artifact_crystal: [], union_artifact_effect: [] },
    unionChampion: { union_champion: [], champion_badge_total_info: [] },
    cashEquipment: { cash_item_equipment_base: [] },
    petEquipment: {},
    familiar,
    syncedAt,
  };
}

// --- Primary fixture: the spec's verified live sample -----------------
// 影之愛衣 (mine) vs 護甲大師 (reference), same class.

const shadowRaw = makeRawCharacter({
  ocid: 'OCID_SHADOW',
  name: '影之愛衣',
  characterClass: '夜使者',
  combatPower: 1626455576,
  finalStat: [
    stat('LUK', 100345),
    stat('攻擊力', 16586),
    stat('傷害', 20),
    stat('BOSS怪物傷害', 665),
    stat('無視防禦率', 96.99),
    stat('爆擊傷害', 164.25),
    stat('星力', 1500),
    stat('真實之力', 740),
  ],
  equipmentPresetActive: 2,
  equipmentItems: [
    {
      item_equipment_slot: '帽子',
      starforce: 436,
      item_etc_option: { attack_power: '121', magic_power: '0' },
    },
  ],
  hyperStatUsePresetNo: '2',
  hyperStatPresets: {
    2: [{ stat_type: '力量', stat_level: 10, stat_increase: '+300' }],
  },
  linkSkillUsePresetNo: '2',
  linkSkillPresets: {
    2: [{ skill_name: '夜使者的連結', skill_level: 3 }],
  },
  ownedLinkSkill: '夜使者的連結',
  union: { union_level: 10046, union_grade: null, union_artifact_level: null },
  raiderStats: ['STR : +230', 'DEX : +100', '攻擊力 : +30', 'HP : +1000'],
  hexaCores: [{ hexa_core_name: '核心A', hexa_core_level: 30 }],
  symbols: [{ symbol_name: '符文A', symbol_level: 20 }],
  setEffects: [{ set_name: '套裝A', total_set_count: 6 }],
});

const armorMasterRaw = makeRawCharacter({
  ocid: 'OCID_ARMOR',
  name: '護甲大師',
  characterClass: '夜使者',
  combatPower: 2002590020,
  finalStat: [
    stat('LUK', 105285),
    stat('攻擊力', 18117),
    stat('傷害', 15),
    stat('BOSS怪物傷害', 703),
    stat('無視防禦率', 97.17),
    stat('爆擊傷害', 149.6),
    stat('星力', 1600),
    stat('真實之力', 770),
  ],
  equipmentPresetActive: 3,
  equipmentItems: [
    {
      item_equipment_slot: '帽子',
      starforce: 447,
      item_etc_option: { attack_power: '100', magic_power: '0' },
    },
  ],
  hyperStatUsePresetNo: '3',
  hyperStatPresets: {
    3: [{ stat_type: '力量', stat_level: 12, stat_increase: '+360' }],
  },
  linkSkillUsePresetNo: '1',
  linkSkillPresets: {
    1: [{ skill_name: '護甲大師的連結', skill_level: 3 }],
  },
  ownedLinkSkill: '護甲大師的連結',
  union: { union_level: 10737, union_grade: null, union_artifact_level: null },
  raiderStats: [
    'STR : +300',
    'DEX : +150',
    '攻擊力 : +40',
    'HP : +1200',
    'DEF : +50',
  ],
  hexaCores: [{ hexa_core_name: '核心A', hexa_core_level: 30 }],
  symbols: [{ symbol_name: '符文A', symbol_level: 25 }],
  setEffects: [{ set_name: '套裝A', total_set_count: 8 }],
});

describe('normalizeCharacterForComparison', () => {
  const mine = normalizeCharacterForComparison(shadowRaw);
  const reference = normalizeCharacterForComparison(armorMasterRaw);

  it('extracts identity and combat power as api-facts', () => {
    expect(mine.name).toBe('影之愛衣');
    expect(mine.combatPower).toBe(1626455576);
    expect(reference.combatPower).toBe(2002590020);
  });

  it('extracts active equipment and Hyper Stat preset identifiers (P2/P3)', () => {
    expect(mine.equipment.activePresetNo).toBe(2);
    expect(reference.equipment.activePresetNo).toBe(3);
    expect(mine.hyperStat.activePresetNo).toBe('2');
    expect(reference.hyperStat.activePresetNo).toBe('3');
  });

  it('derives the current-equipment star sum from the active item list', () => {
    expect(mine.equipment.starSum).toBe(436);
    expect(reference.equipment.starSum).toBe(447);
  });

  it('exposes the final-stat Star Force value distinctly from the derived star sum', () => {
    expect(mine.finalStats.values.starForceFinal).toBe(1500);
    expect(mine.finalStats.values.starForceFinal).not.toBe(
      mine.equipment.starSum
    );
  });

  it('reports the known Link Skill preset number when use_preset_no is present', () => {
    expect(mine.linkSkill.activePresetNo).toBe('2');
    expect(mine.linkSkill.coverage).toBe(true);
  });

  it('reports the Link Skill preset as unknown when use_preset_no is absent', () => {
    // `null` here (not the default-triggering `undefined`) models a
    // future response shape where `linkSkills.use_preset_no` is missing
    // entirely — the field must never be defaulted to "1".
    const raw = makeRawCharacter({ linkSkillUsePresetNo: null });
    const normalized = normalizeCharacterForComparison(raw);
    expect(normalized.linkSkill.activePresetNo).toBeNull();
    expect(normalized.linkSkill.coverage).toBe(false);
  });

  it('never invents a Union Raider preset identifier, while still exposing comparable raider stats', () => {
    expect(mine.unionRaider.activePresetNo).toBeUndefined();
    expect(
      Object.prototype.hasOwnProperty.call(mine.unionRaider, 'activePresetNo')
    ).toBe(false);
    expect(mine.unionRaider.statCount).toBe(4);
    expect(reference.unionRaider.statCount).toBe(5);
  });

  it('sums scroll-granted attack across the active equipment items', () => {
    expect(mine.equipment.scrollAttackSum).toBe(121);
    expect(reference.equipment.scrollAttackSum).toBe(100);
    expect(mine.equipment.scrollMagicSum).toBe(0);
  });

  it('measures HEXA by core levels and files Authentic Force under symbols', () => {
    expect(mine.hexa.totalCoreLevel).toBe(30);
    expect(mine.hexa.coreCount).toBe(1);
    expect(mine.hexa.authenticForce).toBeUndefined();
    expect(mine.symbols.authenticForce).toBe(740);
    expect(reference.symbols.authenticForce).toBe(770);
  });

  it('treats a missing or empty category as unknown, never zero', () => {
    const raw = makeRawCharacter({ union: null });
    const normalized = normalizeCharacterForComparison(raw);
    expect(normalized.union.level).toBeNull();
    expect(normalized.union.coverage).toBe(false);

    const rawEmptySymbols = makeRawCharacter({ symbols: [] });
    const normalizedEmpty = normalizeCharacterForComparison(rawEmptySymbols);
    expect(normalizedEmpty.symbols.totalLevel).toBeNull();
    expect(normalizedEmpty.symbols.coverage).toBe(false);
  });
});

describe('compareCharacters — verified sample (影之愛衣 vs 護甲大師)', () => {
  const comparison = compareCharacters(
    normalizeCharacterForComparison(shadowRaw),
    normalizeCharacterForComparison(armorMasterRaw)
  );

  it('computes the internal combat-power delta as mine minus reference', () => {
    expect(comparison.headline.delta).toBe(-376134444);
  });

  it('computes the reference-relative-to-mine headline percentage', () => {
    expect(comparison.headline.relativePct).toBeCloseTo(23.126, 3);
  });

  it('reports ordinary deltas for LUK (main stat) and attack', () => {
    const mainStatRow = comparison.rows.find(r => r.metric === 'mainStat:LUK');
    const attackRow = comparison.rows.find(r => r.metric === 'attack');
    expect(mainStatRow.delta).toBe(-4940);
    expect(attackRow.delta).toBe(-1531);
  });

  it('reports Boss/IED/critical-damage deltas in percentage points, preserving advantages', () => {
    const bossRow = comparison.rows.find(r => r.metric === 'bossDamage');
    const iedRow = comparison.rows.find(r => r.metric === 'ied');
    const critDamageRow = comparison.rows.find(r => r.metric === 'critDamage');

    expect(bossRow.unit).toBe('pp');
    expect(bossRow.delta).toBe(-38);

    expect(iedRow.unit).toBe('pp');
    expect(iedRow.delta).toBeCloseTo(-0.18, 2);

    // My character's critical damage is actually higher than the
    // reference's — this advantage must be preserved, not filtered out.
    expect(critDamageRow.unit).toBe('pp');
    expect(critDamageRow.delta).toBeCloseTo(14.65, 2);
    expect(critDamageRow.direction).toBe('ahead');
  });

  it("reports the damage row in percentage points, per the spec's Units section", () => {
    // docs/superpowers/specs/2026-07-17-character-power-comparison-design.md:279-280:
    // "Damage, boss damage, IED, critical rate, and critical damage use
    // percentage points."
    const damageRow = comparison.rows.find(r => r.metric === 'damage');
    expect(damageRow.unit).toBe('pp');
    expect(damageRow.delta).toBe(5);
  });

  it('labels the current-equipment star sum distinctly from the final-stat Star Force', () => {
    const starSumRow = comparison.categories.equipment.starSum;
    const starForceRow = comparison.categories.equipment.finalStatStarForce;

    expect(starSumRow.metric).toBe('currentEquipmentStarSum');
    expect(starForceRow.metric).toBe('finalStatStarForce');
    expect(starSumRow.metric).not.toBe(starForceRow.metric);
    expect(starSumRow.left).toBe(436);
    expect(starForceRow.left).toBe(1500);
  });

  it('exposes scroll attack/magic sums as derived equipment rows', () => {
    const attackRow = comparison.categories.equipment.scrollAttackSum;
    expect(attackRow.metric).toBe('scrollAttackSum');
    expect(attackRow.evidence).toBe('derived');
    expect(attackRow.left).toBe(121);
    expect(attackRow.delta).toBe(21);

    const magicRow = comparison.categories.equipment.scrollMagicSum;
    expect(magicRow.metric).toBe('scrollMagicSum');
    expect(magicRow.delta).toBe(0);
  });

  it('compares HEXA by core-level sum and Authentic Force inside Symbols', () => {
    const hexaRow = comparison.categories.hexa.totalCoreLevel;
    expect(hexaRow.metric).toBe('totalHexaCoreLevel');
    expect(hexaRow.evidence).toBe('derived');
    expect(hexaRow.delta).toBe(0); // both fixtures run core level 30

    const authenticRow = comparison.categories.symbols.authenticForce;
    expect(authenticRow.category).toBe('Symbols');
    expect(authenticRow.metric).toBe('authenticForce');
    expect(authenticRow.evidence).toBe('api-fact');
    expect(authenticRow.left).toBe(740);
    expect(authenticRow.delta).toBe(-30);
  });

  it('carries an evidence level and coverage on every row', () => {
    for (const row of comparison.rows) {
      expect(['api-fact', 'derived', 'model-estimate', 'unknown']).toContain(
        row.evidence
      );
      expect(['complete', 'partial', 'unavailable']).toContain(row.coverage);
    }
  });
});

describe('compareCharacters — sign and copy inversion after swapping sides', () => {
  const mineNormalized = normalizeCharacterForComparison(shadowRaw);
  const referenceNormalized = normalizeCharacterForComparison(armorMasterRaw);

  const original = compareCharacters(mineNormalized, referenceNormalized);
  const swapped = compareCharacters(referenceNormalized, mineNormalized);

  it('flips the headline delta sign and direction', () => {
    expect(swapped.headline.delta).toBe(-original.headline.delta);
    expect(original.headline.direction).toBe('behind');
    expect(swapped.headline.direction).toBe('ahead');
  });

  it('flips the headline copy to describe the new relationship', () => {
    expect(original.headline.text).toMatch(/lower/);
    expect(swapped.headline.text).toMatch(/higher/);
  });

  it('flips ordinary row deltas (e.g. LUK) after swapping', () => {
    const originalLuk = original.rows.find(r => r.metric === 'mainStat:LUK');
    const swappedLuk = swapped.rows.find(r => r.metric === 'mainStat:LUK');
    expect(swappedLuk.delta).toBe(-originalLuk.delta);
  });
});

describe('compareCharacters — cross-class common-summary mode', () => {
  const warriorRaw = makeRawCharacter({
    characterClass: '劍士',
    finalStat: [stat('LUK', 500), stat('攻擊力', 999)],
  });
  const mageRaw = makeRawCharacter({
    characterClass: '法師',
    finalStat: [stat('LUK', 100), stat('魔法攻擊力', 2000)],
  });

  const comparison = compareCharacters(
    normalizeCharacterForComparison(warriorRaw),
    normalizeCharacterForComparison(mageRaw)
  );

  it('marks the comparison as not same-class', () => {
    expect(comparison.sameClass).toBe(false);
  });

  it('only includes common-summary rows, no main-stat rows', () => {
    const statRows = comparison.rows.filter(r => r.category === 'stats');
    expect(statRows).toHaveLength(0);

    const metrics = comparison.rows.map(r => r.metric);
    expect(metrics).toEqual(
      expect.arrayContaining([
        'combatPower',
        'level',
        'world',
        'unionLevel',
        'symbolProgress',
        'snapshotQuality',
      ])
    );
  });

  it('produces no upgrade directions for cross-class comparisons', () => {
    expect(rankUpgradeDirections(comparison)).toEqual([]);
  });
});

describe('rankUpgradeDirections — deterministic inspection order', () => {
  function makeBehindPair() {
    const commonFinalStat = [stat('真實之力', 700)];
    const referenceFinalStat = [stat('真實之力', 900)];

    const mine = makeRawCharacter({
      characterClass: '道士',
      finalStat: commonFinalStat,
      equipmentItems: [{ starforce: 10 }],
      symbols: [{ symbol_level: 5 }],
      union: {
        union_level: 100,
        union_grade: null,
        union_artifact_level: null,
      },
      hyperStatUsePresetNo: '1',
      hyperStatPresets: { 1: [{ stat_level: 5 }] },
      linkSkillUsePresetNo: '1',
      linkSkillPresets: { 1: [{ skill_level: 1 }] },
      setEffects: [{ total_set_count: 2 }],
    });
    const reference = makeRawCharacter({
      characterClass: '道士',
      finalStat: referenceFinalStat,
      equipmentItems: [{ starforce: 50 }],
      symbols: [{ symbol_level: 20 }],
      union: {
        union_level: 500,
        union_grade: null,
        union_artifact_level: null,
      },
      hyperStatUsePresetNo: '1',
      hyperStatPresets: { 1: [{ stat_level: 20 }] },
      linkSkillUsePresetNo: '1',
      linkSkillPresets: { 1: [{ skill_level: 5 }] },
      setEffects: [{ total_set_count: 8 }],
    });
    return { mine, reference };
  }

  it('returns only the first three eligible categories, in stable order, when more than three are eligible', () => {
    const { mine, reference } = makeBehindPair();
    const comparison = compareCharacters(
      normalizeCharacterForComparison(mine),
      normalizeCharacterForComparison(reference)
    );

    // All 7 categories are eligible (mine is behind in every headline
    // metric with complete data on both sides).
    const directions = rankUpgradeDirections(comparison);
    expect(directions).toHaveLength(3);
    expect(directions.map(d => d.category)).toEqual([
      'Equipment',
      'Symbols',
      'Union',
    ]);
    for (const direction of directions) {
      expect(direction).toHaveProperty('myValue');
      expect(direction).toHaveProperty('referenceValue');
      expect(direction.myValue).not.toBeNull();
      expect(direction.referenceValue).not.toBeNull();
      // No scores or predicted combat-power gain.
      expect(direction).not.toHaveProperty('score');
      expect(direction).not.toHaveProperty('predictedCombatPower');
    }
  });

  it('returns fewer than three entries when fewer categories are eligible', () => {
    const { mine, reference } = makeBehindPair();
    // Make mine equal or ahead everywhere except Equipment and Union.
    reference.symbols = mine.symbols;
    reference.hyperStats = mine.hyperStats;
    reference.linkSkills = mine.linkSkills;
    reference.setEffects = mine.setEffects;

    const comparison = compareCharacters(
      normalizeCharacterForComparison(mine),
      normalizeCharacterForComparison(reference)
    );
    const directions = rankUpgradeDirections(comparison);
    expect(directions.map(d => d.category)).toEqual(['Equipment', 'Union']);
  });

  it('keys HEXA eligibility on core levels, never on Authentic Force', () => {
    const { mine, reference } = makeBehindPair();
    // Authentic Force stays behind (700 vs 900) while core levels tie —
    // HEXA must not become eligible off the symbol-fed stat.
    const tiedCores = [{ hexa_core_name: '核心A', hexa_core_level: 10 }];
    mine.hexaCores = { character_hexa_core_equipment: tiedCores };
    reference.hexaCores = { character_hexa_core_equipment: tiedCores };

    let directions = rankUpgradeDirections(
      compareCharacters(
        normalizeCharacterForComparison(mine),
        normalizeCharacterForComparison(reference)
      )
    );
    expect(directions.map(d => d.category)).not.toContain('HEXA');

    // Core levels behind (10 vs 40) → HEXA becomes eligible, reported
    // via the core-level metric. Symbols/Union are tied so HEXA fits in
    // the top three.
    reference.hexaCores = {
      character_hexa_core_equipment: [
        { hexa_core_name: '核心A', hexa_core_level: 40 },
      ],
    };
    reference.symbols = mine.symbols;
    reference.union = mine.union;

    directions = rankUpgradeDirections(
      compareCharacters(
        normalizeCharacterForComparison(mine),
        normalizeCharacterForComparison(reference)
      )
    );
    const hexaDirection = directions.find(d => d.category === 'HEXA');
    expect(hexaDirection).toBeDefined();
    expect(hexaDirection.metric).toBe('totalHexaCoreLevel');
    expect(hexaDirection.myValue).toBe(10);
    expect(hexaDirection.referenceValue).toBe(40);
  });

  it('skips a category with incomplete structural data even if the raw value looks worse', () => {
    const { mine, reference } = makeBehindPair();
    reference.union = null; // structurally missing on the reference side

    const comparison = compareCharacters(
      normalizeCharacterForComparison(mine),
      normalizeCharacterForComparison(reference)
    );
    const directions = rankUpgradeDirections(comparison);
    expect(directions.map(d => d.category)).not.toContain('Union');
  });
});

describe('compareCharacters — same-character input', () => {
  // NOTE: deciding whether left/right refer to the same character (and
  // skipping the second network fetch) is a page-level concern per the
  // design doc's Client data flow / Error handling sections. This pure
  // layer has no special case for identical inputs — it simply compares
  // them like any other pair, which is what this test documents.
  it('compares an identical character against itself without special-casing', () => {
    const normalized = normalizeCharacterForComparison(shadowRaw);
    const comparison = compareCharacters(normalized, normalized);

    expect(comparison.headline.delta).toBe(0);
    expect(comparison.headline.direction).toBe('even');
    const lukRow = comparison.rows.find(r => r.metric === 'mainStat:LUK');
    expect(lukRow.delta).toBe(0);
    expect(lukRow.direction).toBe('even');
  });
});

describe('compareCharacters — snapshot freshness', () => {
  const BASE = '2026-07-17T00:00:00.000Z';

  function withSyncedAt(syncedAt) {
    return normalizeCharacterForComparison(makeRawCharacter({ syncedAt }));
  }

  it('does not warn when the snapshot-time difference is just under 10 minutes', () => {
    const left = withSyncedAt(BASE);
    const right = withSyncedAt('2026-07-17T00:09:59.999Z'); // 599999ms
    const { snapshot, rows } = compareCharacters(left, right);

    expect(snapshot.undated).toBe(false);
    expect(snapshot.diffMs).toBe(599999);
    expect(snapshot.warning).toBe(false);

    const qualityRow = rows.find(r => r.metric === 'snapshotQuality');
    expect(qualityRow.note).toBe(
      'snapshots are within 10 minutes of each other'
    );
  });

  it('does not warn exactly at the 10-minute boundary (strictly-greater-than semantics)', () => {
    const left = withSyncedAt(BASE);
    const right = withSyncedAt('2026-07-17T00:10:00.000Z'); // exactly 600000ms
    const { snapshot } = compareCharacters(left, right);

    expect(snapshot.diffMs).toBe(600000);
    expect(snapshot.warning).toBe(false);
  });

  it('warns when the snapshot-time difference is just over 10 minutes', () => {
    const left = withSyncedAt(BASE);
    const right = withSyncedAt('2026-07-17T00:10:00.001Z'); // 600001ms
    const { snapshot, rows } = compareCharacters(left, right);

    expect(snapshot.diffMs).toBe(600001);
    expect(snapshot.warning).toBe(true);

    const qualityRow = rows.find(r => r.metric === 'snapshotQuality');
    expect(qualityRow.note).toBe(
      'snapshot times differ by more than 10 minutes'
    );
  });

  it('treats a missing syncedAt on one side as undated, never a fake "fresh" claim', () => {
    const left = withSyncedAt(BASE);
    const right = withSyncedAt(null);
    const { snapshot, rows } = compareCharacters(left, right);

    expect(snapshot.undated).toBe(true);
    expect(snapshot.diffMs).toBeNull();
    expect(snapshot.warning).toBe(false);

    const qualityRow = rows.find(r => r.metric === 'snapshotQuality');
    expect(qualityRow.note).toBe('undated snapshot');
    expect(qualityRow.evidence).toBe('unknown');
    expect(qualityRow.coverage).toBe('partial');
  });

  it('treats both syncedAt missing as undated, without crashing', () => {
    const left = withSyncedAt(null);
    const right = withSyncedAt(null);

    expect(() => compareCharacters(left, right)).not.toThrow();
    const { snapshot } = compareCharacters(left, right);
    expect(snapshot.undated).toBe(true);
    expect(snapshot.diffMs).toBeNull();
    expect(snapshot.warning).toBe(false);
  });

  it('treats an unparseable syncedAt as undated, without crashing or claiming freshness', () => {
    const left = withSyncedAt('not-a-real-date');
    const right = withSyncedAt(BASE);

    expect(() => compareCharacters(left, right)).not.toThrow();
    const { snapshot, rows } = compareCharacters(left, right);
    expect(snapshot.undated).toBe(true);
    expect(snapshot.diffMs).toBeNull();
    expect(snapshot.warning).toBe(false);

    const qualityRow = rows.find(r => r.metric === 'snapshotQuality');
    expect(qualityRow.note).toBe('undated snapshot');
  });
});

describe('normalizeCharacterForComparison — HEXA stat cores', () => {
  it('sums main and sub levels across all active hexa stat core arrays', () => {
    const raw = makeRawCharacter({
      hexaStats: {
        character_hexa_stat_core: [
          {
            slot_id: '0',
            main_stat_level: 10,
            sub_stat_level_1: 5,
            sub_stat_level_2: 5,
          },
        ],
        character_hexa_stat_core_2: [
          {
            slot_id: '0',
            main_stat_level: 3,
            sub_stat_level_1: 2,
            sub_stat_level_2: 0,
          },
        ],
      },
    });

    expect(normalizeCharacterForComparison(raw).hexa.totalStatLevel).toBe(25);
  });

  it('keeps totalStatLevel unknown (null) when no hexa stat data exists', () => {
    const raw = makeRawCharacter();
    expect(normalizeCharacterForComparison(raw).hexa.totalStatLevel).toBeNull();
  });

  it('exposes a derived HEXA stat row with mine-minus-reference delta', () => {
    const statCores = levels => ({
      character_hexa_stat_core: [
        {
          slot_id: '0',
          main_stat_level: levels,
          sub_stat_level_1: 0,
          sub_stat_level_2: 0,
        },
      ],
    });
    const mine = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'A', name: 'A', hexaStats: statCores(7) })
    );
    const reference = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'B', name: 'B', hexaStats: statCores(10) })
    );

    const row = compareCharacters(mine, reference).categories.hexa
      .totalStatLevel;
    expect(row.category).toBe('HEXA');
    expect(row.metric).toBe('totalHexaStatLevel');
    expect(row.evidence).toBe('derived');
    expect(row.coverage).toBe('complete');
    expect(row.delta).toBe(-3);
    expect(row.direction).toBe('behind');
  });
});

describe('normalizeCharacterForComparison — familiar (萌獸)', () => {
  const familiarPayload = {
    familiar_info: [
      {
        familiar_name: '寒冰半人馬',
        familiar_state: 'linked',
        familiar_level: 5,
        option_level: 5,
        option: [],
      },
      {
        familiar_name: '青蛇',
        familiar_state: 'registered',
        familiar_level: 5,
        option_level: 5,
        option: [],
      },
      {
        familiar_name: '樹妖',
        familiar_state: 'registered',
        familiar_level: 3,
        option_level: 3,
        option: [],
      },
    ],
  };

  it('counts registered and linked familiars and sums linked option levels', () => {
    const normalized = normalizeCharacterForComparison(
      makeRawCharacter({ familiar: familiarPayload })
    );

    expect(normalized.familiar).toEqual({
      coverage: true,
      registeredCount: 3,
      linkedCount: 1,
      linkedOptionLevelSum: 5,
    });
  });

  it('reports a real zero (not unknown) when data exists but nothing is linked', () => {
    const normalized = normalizeCharacterForComparison(
      makeRawCharacter({
        familiar: {
          familiar_info: [
            {
              familiar_name: '青蛇',
              familiar_state: 'registered',
              option_level: 5,
            },
          ],
        },
      })
    );

    expect(normalized.familiar.linkedCount).toBe(0);
    expect(normalized.familiar.linkedOptionLevelSum).toBe(0);
  });

  it('treats a character synced before familiar support as unavailable, never zero', () => {
    const normalized = normalizeCharacterForComparison(makeRawCharacter());

    expect(normalized.familiar).toEqual({
      coverage: false,
      registeredCount: null,
      linkedCount: null,
      linkedOptionLevelSum: null,
    });
  });
});

describe('compareCharacters + rankUpgradeDirections — familiar category', () => {
  const familiarOf = (registered, linked) => ({
    familiar_info: Array.from({ length: registered }, (_, i) => ({
      familiar_name: `萌獸${i}`,
      familiar_state: i < linked ? 'linked' : 'registered',
      option_level: 5,
      option: [],
    })),
  });

  it('produces derived Familiar rows keyed on registered/linked counts', () => {
    const mine = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'A', name: 'A', familiar: familiarOf(3, 1) })
    );
    const reference = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'B', name: 'B', familiar: familiarOf(78, 0) })
    );

    const { familiar } = compareCharacters(mine, reference).categories;
    expect(familiar.registeredCount.category).toBe('Familiar');
    expect(familiar.registeredCount.metric).toBe('registeredFamiliarCount');
    expect(familiar.registeredCount.evidence).toBe('derived');
    expect(familiar.registeredCount.delta).toBe(-75);
    expect(familiar.linkedCount.delta).toBe(1);
    expect(familiar.linkedOptionLevelSum.delta).toBe(5);
  });

  it('marks familiar rows partial when only one side has data', () => {
    const mine = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'A', name: 'A', familiar: familiarOf(3, 1) })
    );
    const reference = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'B', name: 'B' })
    );

    const row = compareCharacters(mine, reference).categories.familiar
      .registeredCount;
    expect(row.coverage).toBe('partial');
    expect(row.delta).toBeNull();
    expect(row.direction).toBe('unknown');
  });

  it('surfaces Familiar in upgrade directions when it is the only lagging system', () => {
    const mine = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'A', name: 'A', familiar: familiarOf(3, 1) })
    );
    const reference = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'B', name: 'B', familiar: familiarOf(78, 0) })
    );

    const directions = rankUpgradeDirections(compareCharacters(mine, reference));
    const familiarEntry = directions.find(d => d.category === 'Familiar');
    expect(familiarEntry).toBeDefined();
    expect(familiarEntry.metric).toBe('registeredFamiliarCount');
    expect(familiarEntry.myValue).toBe(3);
    expect(familiarEntry.referenceValue).toBe(78);
  });
});
