# Character Power Comparison Design

**Date:** 2026-07-17

## Summary

Add a shareable character comparison page that helps a player understand which
observable differences and progression systems are worth inspecting first. The
left side is always **my character** and the right side is the **reference
character**.

V1 does not attribute portions of the combat-power gap to individual systems.
It presents Nexon's displayed combat power as the authoritative outcome, then
shows differences that coexist with that outcome. A difference may be useful
evidence, but it is not a causal contribution and comparison rows must never be
summed to reproduce the total gap.

## Goals

A player should be able to answer, from one page:

1. How large is the combat-power gap?
2. Which important stats are lower, and which are higher?
3. Which three progression systems are most worth opening and inspecting?
4. Is each value an API fact, a derived value, an estimate, or unknown?
5. Are the two snapshots fresh and complete enough to compare?

## Non-goals

V1 will not:

- claim that a system contributed a precise amount of combat power;
- produce an additive waterfall or percentages that total 100%;
- create a cross-character equipment-swap simulator;
- rank individual equipment slots by predicted combat-power gain;
- treat alternate-preset estimates as observed combat power;
- add a database table, migration, or third-party dependency.

## Research Findings

### Existing data flow

Character names can already be resolved to OCIDs. The full character endpoint
returns the persisted character snapshot and synchronizes missing, stale, or
incomplete data first. The response already contains displayed combat power,
final stats, equipment and equipment presets, Hyper Stats, Link Skills, HEXA,
symbols, set effects, Union data, cash equipment, pets, and `syncedAt`.

Relevant existing code:

- Character refresh and full response:
  `app/api/character/[ocid]/route.js:17-37`
- Full response shape: `lib/db/queries.js:449-481`
- Parallel Nexon synchronization and partial-failure behavior:
  `lib/characterSyncService.js:70-119`
- Equipment/stat parser: `lib/combatPowerCalculator.js:267-339`
- Current preset analysis: `lib/combatPowerCalculator.js:395-577,739-843`
- Preset classification heuristic:
  `lib/combatPowerCalculator.js:638-725`
- Investment profile, not combat-power attribution:
  `lib/statBalance.js:20-170`

### Calculator limits

The current calculator is designed to estimate alternate equipment presets for
one character. It takes the active API combat power as a calibration point and
back-calculates a character-specific hidden factor. It does not implement a
universal cross-character formula.

It does not fully simulate Union, Union Raider, Union Artifact, HEXA, Link Skill
effects, set effects, inner ability, class skills, or current buffs. Its class
model also cannot safely cover special main-stat rules such as Demon Avenger or
Xenon. The documented formula has an unexplained error of about 2% in its
existing example, and part of the symbol formula is unconfirmed
(`docs/combat-power-formulas.md:260-285,367-372`).

Therefore, extending the existing estimator into an additive attribution model
would create false precision.

### External formula research (MapleCombat)

A survey of <https://github.com/centre173/MapleCombat> (commit `318cf3b`,
2026-07-15, MIT-licensed code) was performed on 2026-07-17; full notes with
file:line citations live in `2026-07-17-maplecombat-survey.md`. Conclusions
relevant to this design:

- Combat-power calculation has two layers: a stats-to-power formula and a
  raw-API-to-stats derivation. MapleCombat implements the first layer in
  detail but contains no Nexon OpenAPI integration at all — players manually
  enter panel-decomposed values read from the game client. The derivation
  layer remains unsolved by any known research.
- Displayed combat power reflects only the currently active preset
  combination. Computing the true combat power of non-active presets from the
  OpenAPI alone is impossible regardless of formula completeness: the API does
  not expose per-preset inner ability, active buffs and skill levels, or the
  per-source breakdown of pet/familiar final-damage buffs that the game's
  float32 stacking order requires.
- Reusable pieces for a future estimator upgrade, all still at model-estimate
  evidence level: explicit Xenon (2.625–2.975 × triple-stat sum) and Demon
  Avenger (HP-to-stat conversion with 0.75–0.85 coefficients) formulas; a
  testable hypothesis for the documented ~2% error (only genesis-weapon 10%,
  pet/familiar buffs, and the ruin skill enter the final-damage multiplier,
  with separate mentor/empress/genesis buff corrections); an exact 1.35 base
  critical multiplier.
- MapleCombat's own verification is regression testing against a previous
  build's output, not an error bound against real displayed combat power, and
  its class coefficients are uncited community constants.

This confirms the V1 decision: show active preset identifiers, never estimate
cross-preset combat power.

### Live feasibility sample

Official Nexon GET responses were captured on 2026-07-17 for the same-class
characters 影之愛衣 and 護甲大師. The data is useful as an undated captured
snapshot, but all endpoint `date` fields were `null`. The capture time alone
does not prove that every upstream value represents exactly the same instant.

Observed active-snapshot highlights, with 護甲大師 as the reference:

| Metric               |      影之愛衣 |      護甲大師 | Reference minus my character |
| -------------------- | ------------: | ------------: | ---------------------------: |
| Combat power         | 1,626,455,576 | 2,002,590,020 |      +376,134,444 (+23.126%) |
| LUK                  |       100,345 |       105,285 |                       +4,940 |
| Attack               |        16,586 |        18,117 |                       +1,531 |
| Boss damage          |          665% |          703% |                        +38pp |
| IED                  |        96.99% |        97.17% |                      +0.18pp |
| Critical damage      |       164.25% |       149.60% |                     -14.65pp |
| Active-item star sum |           436 |           447 |                          +11 |
| Authentic Force      |           740 |           770 |                          +30 |
| Union level          |        10,046 |        10,737 |                         +691 |

The reference character has higher displayed combat power despite having lower
damage and critical damage. Both have eleven level-30 HEXA cores, while their
HEXA stat allocations differ. This demonstrates why V1 must preserve both
positive and negative differences and must not present raw metrics as an
additive causal decomposition.

The direct Nexon sample also uses different active presets:

- Equipment: P2 versus P3
- Hyper Stat: P2 versus P3
- Union Raider: P4 versus P1 in the raw response, although the current Maple Hub
  full response does not persist or expose this identifier
- Link Skill: the production full response exposes the stored
  `linkSkills.use_preset_no`; if that field is absent from a future response,
  the comparison treats it as unknown

V1 displays only preset identifiers available in the existing full response.
It therefore omits the Union Raider preset number while still comparing the
returned active Raider stats.

## Product Decisions

- Use the balanced overview layout selected during visual design.
- Provide a standalone page plus an **Add to comparison** action on character
  pages.
- The left side is **my character** and the right side is the reference.
- Allow swapping sides.
- Same-class comparisons get complete observed-stat and upgrade-direction
  output.
- Cross-class comparisons remain available, but only show combat power, level,
  and common progression summaries. They do not rank main-stat upgrade
  directions.
- Upgrade directions identify a system and its evidence. V1 does not recommend
  a specific item replacement.
- Compose existing APIs in the page instead of adding `/api/compare`.

## URL and Entry Points

The canonical URL is:

```text
/compare?left=影之愛衣&right=護甲大師
```

- `left` identifies my character.
- `right` identifies the reference character.
- The URL is shareable and restores the comparison after refresh.
- Swapping characters swaps the two URL parameters and comparison direction.
- From a character page, **Add to comparison** navigates to `/compare` with the
  current character prefilled as `left` and focuses the reference search.
- When both names are identical, the page displays an inline same-character
  message and does not issue the second duplicate request.

## Architecture

### Client data flow

1. Parse `left` and `right` from the URL.
2. Resolve each non-empty name to an OCID through the existing character search
   API.
3. Fetch both `/api/character/[ocid]` responses in parallel. This preserves the
   existing ten-minute freshness and automatic synchronization behavior.
4. Pass both responses to a pure comparison layer.
5. Render the returned comparison view model.

The page keeps each side's loading and error state independent. Replacing one
character does not discard the successful result on the other side. Stale
responses from an earlier search are cancelled or ignored.

### Comparison layer

The comparison layer consists of three focused pure functions:

```js
normalizeCharacterForComparison(data);
compareCharacters(left, right);
rankUpgradeDirections(comparison);
```

`normalizeCharacterForComparison` extracts:

- identity and snapshot metadata;
- character class and level;
- displayed combat power and final stats;
- active equipment, Hyper Stat, and Link Skill preset identifiers when exposed;
- active Union Raider stats without inventing its unavailable preset identifier;
- equipment aggregates and per-slot evidence;
- symbols, HEXA, Union, set effects, Hyper Stats, and Link Skills;
- category coverage.

`compareCharacters` returns UI-neutral rows shaped conceptually as:

```js
{
  category,
  metric,
  left,
  right,
  delta,
  unit,
  direction,
  evidence,
  coverage,
}
```

`rankUpgradeDirections` chooses at most three systems worth inspecting. It only
considers comparable categories with complete structural data where my
character is behind. Each result includes at least one observed supporting
value. It does not output predicted combat-power gain or an aggregate score.

Selection is deterministic without pretending that unlike units share a common
score:

1. Each category is marked eligible when at least one predefined headline
   metric is lower for my character and both values are present.
2. Eligible categories follow this stable inspection order: Equipment,
   Symbols, Union, HEXA, Hyper Stat, Link Skill, Set Effects.
3. The first three eligible categories are returned. The UI describes them as
   a checklist ordered for inspection, not as an effectiveness ranking.
4. When a category has several deficits, its evidence row uses the first
   available metric in that category's documented display order.

This order is a V1 product rule and a testable tie-break, not a claim that an
earlier category produces more combat power.

## Comparison Semantics

### Delta direction

All internal row deltas use:

```text
my character - reference character
```

- A negative result means my character is lower.
- A positive result means my character is higher.
- The headline also spells out the relationship in words to avoid relying on a
  sign alone.
- Relative headline percentage uses my character as the denominator:
  `(reference - mine) / mine × 100`.

### Units

- Ordinary numeric metrics use their native unit.
- Damage, boss damage, IED, critical rate, and critical damage use percentage
  points, shown as `pp`.
- They must not be formatted as relative percentage growth.
- Active equipment star sum is labelled **current equipment star sum**. It is
  distinct from Nexon's final-stat Star Force value.

### Evidence levels

Every row carries one of:

- **API fact**: a value returned directly by Nexon;
- **Derived**: a deterministic aggregate of API fields;
- **Model estimate**: output of an incomplete local formula;
- **Unknown**: absent, failed, or not identifiable from the API.

An empty or missing category is never silently converted to zero. With the
existing full-character contract, coverage is structural: the comparison can
detect absent fields and empty collections, but it cannot prove whether
persisted non-empty data came from the latest upstream call. `syncedAt` is a
character-snapshot timestamp, not per-category freshness evidence.

### Duplicate evidence and causality

The same underlying investment may be visible in multiple places. For example,
star force influences equipment totals and final stats. V1 may show both as
context, but must not add or present them as independent contributions.

All upgrade-direction copy uses wording such as **worth checking** or
**observable difference**. It must not say that a system caused or contributed
a precise amount of the combat-power gap.

## User Interface

### Comparison header

A glass card with explicit `p: 3` contains:

- my character and reference character;
- class, level, world, and active equipment/Hyper Stat/Link Skill preset
  identifiers when present;
- displayed combat power for both;
- absolute combat-power difference;
- relative difference using my character as the baseline;
- a swap action.

### Data-quality notice

The notice shows both `syncedAt` values. When their difference exceeds ten
minutes, it warns:

> Snapshot times differ; equipment or preset changes may affect this result.

The notice also states that displayed combat power reflects each character's
currently active preset combination and is not necessarily that character's
maximum; the page does not estimate combat power for other presets (see the
MapleCombat survey findings above).

When an upstream API date is absent, the page describes the data as an
**undated snapshot**, not an exactly simultaneous live comparison. Structurally
missing categories are listed as unavailable. V1 does not claim per-category
freshness or surface the outcome of each upstream request because the existing
full-character response does not carry that metadata.

### Balanced overview

The overview contains:

1. headline combat-power gap;
2. fixed-order key stat rows, including both advantages and deficits;
3. up to three systems worth inspecting;
4. progression-system summary cards;
5. evidence badges and coverage state.

The key-stat list uses a stable semantic order rather than sorting away the
player's advantages: main stat, attack, damage, boss damage, IED, critical
rate, critical damage, and other supported class-relevant stats.

### Detail tabs

- Overview
- Equipment
- Symbols
- HEXA
- Union
- Hyper Stat
- Link Skill
- Set Effects

The Equipment tab compares slots and can expand fixed stats, star force,
scroll/flame additions, potential, and additional potential. V1 does not rank
slots by predicted combat-power gain.

Alternate-preset estimates are absent from the default overview. If surfaced
later, they must remain labelled as model estimates and state that Link Skills
and set effects are not fully simulated.

### Spacing and interaction

The implementation follows the project design system:

- card-level containers use `p: 3`;
- bordered or tinted child containers use at least `p: 1.5`;
- headings have `mb: 2` before content;
- Chips have at least `px: 1`;
- hover uses `translateY` and shadow, never scale;
- interactive controls retain accessible names, keyboard operation, and visible
  focus.

## Cross-class Behavior

When classes differ:

- show displayed combat power, level, world, snapshot quality, and common
  progression systems;
- retain raw comparable counts such as Union level and symbol progress;
- hide class-specific main-stat comparison and upgrade-direction ranking;
- show a notice that class formulas and primary-stat rules are not directly
  comparable.

This also prevents the incomplete calculator from making unsafe assumptions for
Demon Avenger, Xenon, or other class-specific stat models.

## Error and Partial-data Handling

- **Name not found:** retain the successful side and allow replacing only the
  failed side.
- **One fetch fails:** show a retry action for that side without clearing the
  other.
- **Structurally missing category:** show available overview data; mark the
  affected tab unavailable and its metrics unknown. The existing response
  cannot distinguish a latest upstream failure from persisted older data, so
  V1 does not display a per-category freshness claim.
- **Time difference over ten minutes:** show the snapshot-time warning.
- **Same character:** do not issue the second full-character request.
- **Rapid replacement:** cancel the old request or ignore its stale result.
- **Missing active Link preset number:** use the stored
  `linkSkills.use_preset_no` when present; otherwise show unknown and do not
  infer it from heuristic preset classification.
- **Union Raider preset number:** do not display one because the current full
  response returns active Raider stats but does not persist that identifier.

## Testing

### Pure-function tests

Use a minimal fixture based on the verified same-class sample to test:

- combat power `1,626,455,576` versus `2,002,590,020`;
- internal delta `-376,134,444`;
- reference-relative-to-mine headline `+23.126%`;
- ordinary deltas for LUK and attack;
- Boss `-38pp`, IED `-0.18pp`, and critical damage `+14.65pp`;
- preservation of my character's advantages instead of filtering them out;
- active equipment P2/P3 and Hyper Stat P2/P3;
- known Link Skill preset numbers when `linkSkills.use_preset_no` is present and
  unknown when it is absent;
- omission of the unavailable Union Raider preset identifier while preserving
  comparison of its returned active stats;
- deterministic inspection directions following the documented category order,
  including a fixture with more than three eligible categories;
- separate labels for current-equipment star sum and final-stat Star Force;
- unknown rather than zero for missing categories;
- common-summary-only behavior for different classes;
- inverted signs and copy after swapping sides;
- no duplicate second fetch when both names match.

### Component tests

Cover:

- URL-prefilled characters;
- replacing either search result;
- swapping characters and URL parameters;
- independent loading, error, and retry states;
- no stale content from a superseded request;
- tabs and equipment-slot expansion;
- evidence badges and partial-data states;
- snapshot freshness warning;
- cross-class summary mode.

### Integration and visual verification

Mock the existing search and full-character APIs in Jest; tests never call
Nexon.

Run the application and exercise:

1. open `/compare`;
2. compare two names;
3. observe the balanced overview, advantages, deficits, and quality notice;
4. swap characters;
5. refresh and share the URL;
6. enter from a character page with the left side prefilled.

Use computed styles to verify 24px card padding and at least 12px child-container
padding.

## Acceptance Criteria

The feature is complete when:

- the comparison URL is shareable and reload-safe;
- character pages can prefill my character into comparison;
- two same-class characters show displayed combat-power gap, positive and
  negative stat differences, and at most three evidenced systems worth
  inspecting;
- cross-class comparisons degrade to common summaries;
- every displayed metric identifies evidence and coverage;
- missing data is unknown rather than zero;
- snapshot times and freshness limitations are visible;
- existing active equipment, Hyper Stat, and Link Skill preset identifiers are
  shown when present, while the unavailable Union Raider identifier is not
  invented;
- no UI claims causal or additive combat-power contribution;
- pure-function, component, integration, and measured-spacing checks pass.
