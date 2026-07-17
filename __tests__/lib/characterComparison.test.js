/**
 * @jest-environment node
 */

import {
  normalizeCharacterForComparison,
  compareCharacters,
  rankUpgradeDirections,
} from '../../lib/characterComparison.js';
import {
  stat,
  makeRawCharacter,
  shadowRaw,
  armorMasterRaw,
} from '../../test-fixtures/compareFixtures.js';

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
      expect(['api-fact', 'derived', 'unknown']).toContain(row.evidence);
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

  it('produces no rows — rows only ever holds stats-category entries, which cross-class comparisons never get', () => {
    expect(comparison.rows).toEqual([]);
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
    const { snapshot } = compareCharacters(left, right);

    expect(snapshot.undated).toBe(false);
    expect(snapshot.diffMs).toBe(599999);
    expect(snapshot.warning).toBe(false);
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
    const { snapshot } = compareCharacters(left, right);

    expect(snapshot.diffMs).toBe(600001);
    expect(snapshot.warning).toBe(true);
  });

  it('treats a missing syncedAt on one side as undated, never a fake "fresh" claim', () => {
    const left = withSyncedAt(BASE);
    const right = withSyncedAt(null);
    const { snapshot } = compareCharacters(left, right);

    expect(snapshot.undated).toBe(true);
    expect(snapshot.diffMs).toBeNull();
    expect(snapshot.warning).toBe(false);
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
    const { snapshot } = compareCharacters(left, right);
    expect(snapshot.undated).toBe(true);
    expect(snapshot.diffMs).toBeNull();
    expect(snapshot.warning).toBe(false);
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
  // Mirrors the verified live sample: the equipped familiar is the one
  // with summoned_flag='true' (垃圾桶), NOT the 羈絆-linked one
  // (寒冰半人馬, familiar_state='linked').
  const familiarPayload = {
    familiar_info: [
      {
        familiar_name: '寒冰半人馬',
        familiar_state: 'linked',
        slot_id: '1',
        summoned_flag: 'false',
        familiar_level: 5,
        option_level: 5,
        option: [
          { option_no: 1, option_name: '最終傷害 (%)', option_value: '2' },
          { option_no: 2, option_name: 'LUK (%)', option_value: '4' },
        ],
      },
      {
        familiar_name: '青蛇',
        familiar_state: 'registered',
        slot_id: 'not link',
        summoned_flag: 'false',
        familiar_level: 5,
        option_level: 5,
        option: [
          { option_no: 1, option_name: '最終傷害 (%)', option_value: '2' },
          { option_no: 2, option_name: '緩慢效果', option_value: '1002' },
        ],
      },
      {
        familiar_name: '垃圾桶',
        familiar_state: 'registered',
        slot_id: 'not link',
        summoned_flag: 'true',
        familiar_level: 5,
        option_level: 5,
        option: [
          { option_no: 1, option_name: '物理攻擊力 (%)', option_value: '14' },
          { option_no: 2, option_name: '最終傷害 (%)', option_value: '20' },
          { option_no: 3, option_name: '最終傷害 (%)', option_value: '20' },
        ],
      },
    ],
  };

  it('sums 最終傷害 only over the equipped (summoned) familiar, never the 羈絆-linked one', () => {
    const normalized = normalizeCharacterForComparison(
      makeRawCharacter({ familiar: familiarPayload })
    );

    expect(normalized.familiar).toEqual({
      coverage: true,
      registeredCount: 3,
      linkedCount: 1,
      // 垃圾桶 20+20; 寒冰半人馬's and 青蛇's 最終傷害 are excluded
      // because they are not summoned.
      summonedFinalDamage: 40,
    });
  });

  it('reports a real zero (not unknown) when data exists but nothing is equipped', () => {
    const normalized = normalizeCharacterForComparison(
      makeRawCharacter({
        familiar: {
          familiar_info: [
            {
              familiar_name: '青蛇',
              familiar_state: 'registered',
              summoned_flag: 'false',
              option: [
                {
                  option_no: 1,
                  option_name: '最終傷害 (%)',
                  option_value: '2',
                },
              ],
            },
          ],
        },
      })
    );

    expect(normalized.familiar.linkedCount).toBe(0);
    expect(normalized.familiar.summonedFinalDamage).toBe(0);
  });

  it('treats a character synced before familiar support as unavailable, never zero', () => {
    const normalized = normalizeCharacterForComparison(makeRawCharacter());

    expect(normalized.familiar).toEqual({
      coverage: false,
      registeredCount: null,
      linkedCount: null,
      summonedFinalDamage: null,
    });
  });
});

describe('compareCharacters + rankUpgradeDirections — familiar category', () => {
  // Builds a familiar payload whose equipped familiar grants
  // `finalDamage`% total, with `registered` familiars overall.
  const familiarOf = (registered, finalDamage) => ({
    familiar_info: Array.from({ length: registered }, (_, i) => ({
      familiar_name: `萌獸${i}`,
      familiar_state: 'registered',
      summoned_flag: i === 0 && finalDamage > 0 ? 'true' : 'false',
      option_level: 5,
      option:
        i === 0 && finalDamage > 0
          ? [
              {
                option_no: 1,
                option_name: '最終傷害 (%)',
                option_value: String(finalDamage),
              },
            ]
          : [],
    })),
  });

  it('produces derived Familiar rows with the equipped final-damage headline in pp', () => {
    const mine = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'A', name: 'A', familiar: familiarOf(3, 40) })
    );
    const reference = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'B', name: 'B', familiar: familiarOf(78, 40) })
    );

    const { familiar } = compareCharacters(mine, reference).categories;
    expect(familiar.summonedFinalDamage.category).toBe('Familiar');
    expect(familiar.summonedFinalDamage.metric).toBe(
      'summonedFamiliarFinalDamage'
    );
    expect(familiar.summonedFinalDamage.evidence).toBe('derived');
    expect(familiar.summonedFinalDamage.unit).toBe('pp');
    expect(familiar.summonedFinalDamage.delta).toBe(0);
    expect(familiar.registeredCount.delta).toBe(-75);
  });

  it('marks familiar rows partial when only one side has data', () => {
    const mine = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'A', name: 'A', familiar: familiarOf(3, 40) })
    );
    const reference = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'B', name: 'B' })
    );

    const row = compareCharacters(mine, reference).categories.familiar
      .summonedFinalDamage;
    expect(row.coverage).toBe('partial');
    expect(row.delta).toBeNull();
    expect(row.direction).toBe('unknown');
  });

  it('keys the Familiar upgrade direction on equipped final damage, not collection size', () => {
    // Mine owns MORE familiars but the equipped one grants less final
    // damage — the direction must still flag Familiar as behind.
    const mine = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'A', name: 'A', familiar: familiarOf(78, 10) })
    );
    const reference = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'B', name: 'B', familiar: familiarOf(3, 40) })
    );

    const directions = rankUpgradeDirections(
      compareCharacters(mine, reference)
    );
    const familiarEntry = directions.find(d => d.category === 'Familiar');
    expect(familiarEntry).toBeDefined();
    expect(familiarEntry.metric).toBe('summonedFamiliarFinalDamage');
    expect(familiarEntry.myValue).toBe(10);
    expect(familiarEntry.referenceValue).toBe(40);
  });
});

describe('normalizeCharacterForComparison — attack source sums', () => {
  const richEquipment = {
    equipmentItems: [
      {
        item_equipment_slot: '帽子',
        starforce: 22,
        item_base_option: { attack_power: '10', magic_power: '0' },
        item_starforce_option: { attack_power: '120', magic_power: '0' },
        item_etc_option: { attack_power: '50', magic_power: '0' },
        item_add_option: { attack_power: '9', magic_power: '3' },
        item_total_option: { attack_power: '189', magic_power: '3' },
      },
      {
        item_equipment_slot: '武器',
        starforce: 22,
        item_base_option: { attack_power: '189' },
        item_starforce_option: { attack_power: '222' },
        item_etc_option: { attack_power: '72' },
        item_add_option: { attack_power: '59' },
        item_total_option: { attack_power: '542' },
      },
    ],
    petEquipment: {
      pet_1_equipment: {
        item_name: '月光水晶鑰匙',
        item_option: [
          { option_type: '攻擊力', option_value: '105' },
          { option_type: '魔法攻擊力', option_value: '10' },
        ],
      },
    },
    cashEquipment: {
      cash_item_equipment_base: [
        {
          cash_item_name: '強化披風',
          cash_item_option: [{ option_type: '攻擊力', option_value: '20' }],
        },
        { cash_item_name: '純造型帽', cash_item_option: [] },
      ],
    },
  };

  it('sums base/starforce/scroll/flame/total plus pet and cash attack', () => {
    const eq = normalizeCharacterForComparison(
      makeRawCharacter(richEquipment)
    ).equipment;

    expect(eq.baseAttackSum).toBe(199);
    expect(eq.starforceAttackSum).toBe(342);
    expect(eq.scrollAttackSum).toBe(122);
    expect(eq.flameAttackSum).toBe(68);
    expect(eq.totalAttackSum).toBe(731);
    expect(eq.flameMagicSum).toBe(3);
    expect(eq.petAttackSum).toBe(105);
    expect(eq.petMagicSum).toBe(10);
    expect(eq.cashAttackSum).toBe(20);
    expect(eq.cashMagicSum).toBe(0);
  });

  it('treats pet/cash absence as a real zero once equipment data exists', () => {
    const eq = normalizeCharacterForComparison(
      makeRawCharacter({
        equipmentItems: [{ item_equipment_slot: '帽子', starforce: 1 }],
      })
    ).equipment;

    expect(eq.petAttackSum).toBe(0);
    expect(eq.cashAttackSum).toBe(0);
  });

  it('keeps every source sum unknown when equipment coverage is missing', () => {
    const eq = normalizeCharacterForComparison(makeRawCharacter()).equipment;

    expect(eq.baseAttackSum).toBeNull();
    expect(eq.starforceAttackSum).toBeNull();
    expect(eq.totalAttackSum).toBeNull();
    expect(eq.petAttackSum).toBeNull();
    expect(eq.cashAttackSum).toBeNull();
  });

  it('exposes each source sum as a derived Equipment row with a delta', () => {
    const mine = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'A', name: 'A', ...richEquipment })
    );
    const reference = normalizeCharacterForComparison(
      makeRawCharacter({
        ocid: 'B',
        name: 'B',
        equipmentItems: [
          {
            item_equipment_slot: '武器',
            starforce: 22,
            item_starforce_option: { attack_power: '195' },
          },
        ],
      })
    );

    const { equipment } = compareCharacters(mine, reference).categories;
    expect(equipment.starforceAttackSum.category).toBe('Equipment');
    expect(equipment.starforceAttackSum.metric).toBe('starforceAttackSum');
    expect(equipment.starforceAttackSum.evidence).toBe('derived');
    expect(equipment.starforceAttackSum.delta).toBe(147);
    expect(equipment.petAttackSum.delta).toBe(105);
    expect(equipment.cashAttackSum.delta).toBe(20);
  });
});

describe('normalizeCharacterForComparison — inner ability (內在能力)', () => {
  // Verbatim live line texts — the 狀態異常 line also says 傷害增加 and
  // must NOT count as boss damage.
  const referenceAbility = {
    ability_grade: '傳說',
    preset_no: 1,
    ability_info: [
      {
        ability_no: '1',
        ability_grade: '傳說',
        ability_value: '攻擊Boss怪物時，傷害增加 20%',
      },
      {
        ability_no: '2',
        ability_grade: '罕見',
        ability_value: '攻擊力增加21 ',
      },
      {
        ability_no: '3',
        ability_grade: '罕見',
        ability_value: '攻擊陷入狀態異常的對象時，傷害增加8%',
      },
    ],
  };

  it('parses boss damage and flat attack from active lines, ignoring look-alikes', () => {
    const normalized = normalizeCharacterForComparison(
      makeRawCharacter({ ability: referenceAbility })
    );

    expect(normalized.ability.coverage).toBe(true);
    expect(normalized.ability.grade).toBe('傳說');
    expect(normalized.ability.activePresetNo).toBe('1');
    expect(normalized.ability.bossDamage).toBe(20);
    expect(normalized.ability.attackPower).toBe(21);
    expect(normalized.ability.magicPower).toBe(0);
    expect(normalized.ability.critRate).toBe(0);
  });

  it('reports real zeros when all lines are utility lines', () => {
    const normalized = normalizeCharacterForComparison(
      makeRawCharacter({
        ability: {
          ability_grade: '傳說',
          preset_no: 2,
          ability_info: [
            {
              ability_no: '1',
              ability_grade: '傳說',
              ability_value: '道具掉落率增加 18%',
            },
          ],
        },
      })
    );

    expect(normalized.ability.coverage).toBe(true);
    expect(normalized.ability.bossDamage).toBe(0);
    expect(normalized.ability.attackPower).toBe(0);
  });

  it('treats a character synced before ability support as unavailable, never zero', () => {
    const normalized = normalizeCharacterForComparison(makeRawCharacter());

    expect(normalized.ability).toEqual({
      coverage: false,
      grade: null,
      activePresetNo: null,
      bossDamage: null,
      attackPower: null,
      magicPower: null,
      critRate: null,
    });
  });

  it('exposes ability rows with pp units and surfaces the boss-damage lag as an upgrade direction', () => {
    const mine = normalizeCharacterForComparison(
      makeRawCharacter({
        ocid: 'A',
        name: 'A',
        ability: {
          ability_grade: '傳說',
          preset_no: 3,
          ability_info: [
            {
              ability_no: '2',
              ability_grade: '罕見',
              ability_value: '攻擊Boss怪物時，傷害增加 8%',
            },
          ],
        },
      })
    );
    const reference = normalizeCharacterForComparison(
      makeRawCharacter({ ocid: 'B', name: 'B', ability: referenceAbility })
    );
    const comparison = compareCharacters(mine, reference);

    const row = comparison.categories.ability.bossDamage;
    expect(row.category).toBe('Ability');
    expect(row.metric).toBe('abilityBossDamage');
    expect(row.unit).toBe('pp');
    expect(row.evidence).toBe('derived');
    expect(row.delta).toBe(-12);
    expect(row.direction).toBe('behind');

    const directions = rankUpgradeDirections(comparison);
    const abilityEntry = directions.find(d => d.category === 'Ability');
    expect(abilityEntry).toBeDefined();
    expect(abilityEntry.metric).toBe('abilityBossDamage');
    expect(abilityEntry.myValue).toBe(8);
    expect(abilityEntry.referenceValue).toBe(20);
  });
});
