# MapleCombat repo survey

Repo: https://github.com/centre173/MapleCombat
Clone: `git clone --depth 1` (shallow — only 1 commit visible)
HEAD commit: `318cf3b0304d451a872758fbba1b142dcaff9198`
Commit date: 2026-07-15 16:04:35 +0800
Commit message: "新增萌獸終傷計算、戰鬥力校正選項、滿魂開關與新Buff" (add pet/familiar final-damage calc, combat-power correction options, full-soul-orb toggle, new buffs)
package.json version: 1.2.0 (`package.json:4`)
License: MIT for source code (`LICENSE`); game assets (icons/images/terminology) explicitly excluded, © NEXON Korea, "fan/non-commercial, educational use only" (`LICENSE` trailing note). No separate license/terms for "the formulas" as such — they exist only as expression in MIT-licensed TS source.

## What the project actually is

Not an API client. It is a Windows desktop app (Vue 3 + Vite + TypeScript + Tauri 2, `README.md:1-5`) where the PLAYER manually types numbers copied off their own in-game character screen. Confirmed by:

- `src/components/character/StatPreviewDialog.vue:168` — "先用**面板**對照遊戲，再確認「**技能.消耗**」是否有填" (first cross-check against the in-game panel, then confirm skill-consumption entries) — i.e., the workflow is: open the game, read numbers off panels/detailed-info tooltips, type them into the app.
- `src/assets/images/數值輸入說明.png` — an asset literally titled "value input instructions."
- Grep across all `*.ts`/`*.vue`/`*.md` for `nexon|openapi|open-api`: zero hits in source, README's only "NEXON" hit is the LICENSE copyright disclaimer boilerplate. There is no HTTP client, no fetch/axios, no API schema anywhere in the repo.
- The core formula modules (`src/core/combatPower.ts`, `src/core/actualDamage.ts`) consume already-decomposed per-stat fields (`baseMain`, `percentMain`, `noApplyMain`, `skillBaseMain`, …) — this base/percent/noApply/final breakdown is something the MapleStory game client shows via an in-game "detailed info" popup for each stat, but is **not** exposed by Nexon's OpenAPI (`/character/stat` only returns the aggregated final stat value, not this decomposition).

Conclusion: MapleCombat solves a different problem than ours. It never needs a "back-calculate C_base from raw equipment" step because the human supplies the already-broken-down numbers by reading them off the actual client. It therefore contains no code at all for turning raw Nexon API JSON (item-equipment/symbol-equipment/set-effect/union-raider/union-artifact) into stat totals.

## Combat-power formula as implemented

Source: `src/core/combatPower.ts`.

Common multiplier (`combatPower.ts:254-255`):

```
commonMultiplier = attack.total * rawDmgSum * rawCritSum * finalMult / 100
rawDmgSum  = 1 + (damage + bossDamage) / 100        // combatPower.ts:185
rawCritSum = 1.35 + critDamage / 100                // combatPower.ts:186 — base crit mult is an EXACT 1.35 constant here, not an approximation
finalMult  = genesisMult * famMult * ruinMult        // combatPower.ts:188-193, 236
```

- `genesisMult` = 1.1 if "創世武器 10% 終傷" checkbox on, else 1.0 (`combatPower.ts:188`, `CombatPowerContext.genesisFinalChecked` at line 14).
- `famMult` = pet/familiar final-damage buffs, stacked via literal float32 accumulation to match the game engine's rounding order (`src/core/familiar.ts:41-48`, called at `combatPower.ts:192-193`).
- `ruinMult` = Demon Avenger / 惡魔殺手 "破滅" final-damage skill, `1 + ruinFinal/100`, only for those two jobs (`combatPower.ts:189-190`).
- Notably: **general equipment/potential/set-effect final damage% is NOT part of `finalMult` at all** — only these three named sources are. This is a materially more precise claim than our doc's "cannot explain 2%"; it names exactly which final-damage sources the CP formula counts.

Per-job power (`combatPower.ts:245-286`):

- Normal jobs: `power = floor((4*main.total + sub.total + subtwo.total) * commonMultiplier)` (line 281-283) — matches our doc's structure (4×main+sub)×commonMultiplier, **except MapleCombat has no separate weapon-coefficient (1.3/1.75/…) term** in this formula. That's because `attack.total` here is the manually-typed panel ATK value (already whatever the game computed), not something MapleCombat derives from raw weapon base + coefficient. So this repo doesn't confirm or use our "武器係數表" (weapon coefficient table, `combat-power-formulas.md:76-94`) inside the CP formula itself — no code path in `combatPower.ts` multiplies by 1.3/1.75/etc; that table only appears in `weaponCorrection.ts` for a different purpose (star-force/flame ATK projection, see below).
- **Xenon** (`combatPower.ts:257-263`): `baseStatSum = main.total + sub.total + subtwo.total` (triple stat, no ×4 weighting); `factor = powerCoefficientFactor(xenonPowerCoefficientRaw, 0.74375)`; `powerHigh = floor(2.625 * baseStatSum * commonMultiplier * factor)`; `powerLow = floor(2.975 * baseStatSum * commonMultiplier * factor)`. Range result (`type: 'range'`).
- **Demon Avenger** (`combatPower.ts:264-279`): `equivalentMain` is an HP→stat-equivalent conversion computed at `combatPower.ts:130-136`: `equivalentMain = baseHP/3.5 + ((mainTotal - baseHP)/3.5) * 0.8` (i.e. HP above the AP-invested baseline counts at 80% efficiency vs AP-invested HP, matching our own doc's §10 note "裸血量效益比其他來源高25%" from the other direction — 1/0.8 = 1.25). `factor = powerCoefficientFactor(daPowerCoefficientRaw, 0.75)`; `powerHigh = floor(0.85 * (equivalentMain+sub+subtwo) * commonMultiplier * factor)`; `powerLow = floor(0.75 * (equivalentMain+sub+subtwo) * commonMultiplier * factor)`. Range result.
- These DA/Xenon coefficients (2.625/2.975, 0.85/0.75/0.75-default) appear as bare literals with no inline citation to an official source — presumably community-reverse-engineered constants, same epistemic status as our own inferred constants (i.e., not officially documented, but this repo's authors evidently consider them settled enough to ship without a "may be wrong" caveat, unlike our doc's explicit uncertainty notes).

"Buff-inclusive" correction system (`src/core/combatCorrections.ts`, applied in `combatPower.ts:99-118`):

- Three toggles: `mentor` (師徒系統校正), `empress` (女皇祝福校正, overseas jobs only), `genesis` (創世武器校正, overseas+genesis only) — `combatCorrections.ts:3, 31-37`.
- These exist because some buffs' effects are sometimes baked into what the game displays as CP depending on state; MapleCombat models exact add/subtract corrections for each (`combatPower.ts:99-118`) rather than treating them as unknown noise.

Weapon correction (`src/core/weaponCorrection.ts`) is a **separate, unrelated** feature: given a chosen weapon "set" (fortune/genesis/arcane/absolab/fafnir) plus flame level, scroll ATK, and target star count, it projects "what would my ATK become at N stars" using per-set base/flame/star-gain tables from `src/data/weapons.ts`. It is NOT the main-stat weapon coefficient (1.3/1.2/1.75…) that our own doc's §5 table describes — those two concepts are unrelated; MapleCombat's `weaponDatabase` tables are for star-force ATK progression, not for converting (main×4+sub) into panel-attack via a class/weapon-type coefficient.

## Verification methodology (what "tested" means here)

`tests/unit/core.spec.ts` + `tests/unit/fixtures/golden.json` are **regression tests**: they assert the current TS implementation reproduces "舊版 dist 實際輸出" (the old built JS version's actual output) bit-for-bit (`core.spec.ts:1, 634`). This is internal consistency across a refactor, **not** validation against a real character's Nexon-API-displayed combat power. I found no file, comment, CHANGELOG, or doc anywhere in the repo that states an error bound against real game/API data, and no code path resembling parameter-fitting against observed CP (the only match for "fit" in the codebase, `useCombatPowerFit.ts`, is unrelated UI font-sizing logic, not formula calibration — confirmed by reading the whole file, `useCombatPowerFit.ts:1-172`).

**Could not confirm**: whether the base formula constants (1.35 crit base, the ×4 main-stat weighting, the DA/Xenon coefficients) were originally derived by the authors from matching real displayed CP numbers. No documentation states this; it's plausible community lore inherited from prior tools (the project reads as a mature iteration of a known community calculator lineage, same genre as the `MapleStoryCalculatorV3` project our own doc already cites), but the repo itself carries no provenance notes, docs/ folder, or Wiki links.

## Symbol/rune (`100 + level × 100`) — not addressed

Grep for 符文/symbol/rune/ARC/AUT across all source files: zero hits outside asset filenames unrelated to symbols. MapleCombat has no notion of symbols/runes at all — because the user-supplied stat fields already fold in whatever ARC/AUT contributes (the human read the final panel number off their own screen). This repo neither confirms, corrects, nor contradicts our `100 + level × 100` formula — it's simply out of scope.

## Preset-switch delta feature (`src/core/equipmentDelta.ts`, `EquipmentChangeView.vue`)

This is the closest analog to our target use case, but it is a manual "what-if I swap this one item" simulator, not a preset/API integration:

- `getEquipmentDelta` / `getEquipmentActualDelta` (`equipmentDelta.ts:90-150`) take user-typed "eqOld*"/"eqNew*" fields (old vs new equipment's contribution to each stat/atk/damage/etc., again read off equipment tooltips by the human) and produce a delta object merged into the main CP formula via `delta` (see `combatPower.ts:245-286` signature `delta: FieldValues = {}`).
- Familiar/pet final-damage deltas get special handling because they don't stack linearly (`equipmentDelta.ts:28-57`, `28-57` computes a multiplicative correction factor by re-deriving "source lists" before/after, since float32 stacking order matters — `familiar.ts:41-83`).
- Nothing in this file (or anywhere else) parses `item_equipment_preset_1/2/3`, `preset_no`, `/character/symbol-equipment`, `/character/set-effect`, `/user/union-raider`, or `/user/union-artifact`. There is no automated "diff preset 1 vs preset 2" feature at all — the user must manually type each item's before/after stat contribution for every equipment slot they intend to compare, once per comparison.

## Five gap questions — direct answers

1. **Universal formula without a per-character back-calculated constant?** No. MapleCombat doesn't need `C_base` because it sidesteps the whole "derive stats from raw equipment" problem — the human supplies pre-decomposed base/percent/noApply numbers straight off the game UI. It provides zero code for going from raw Nexon API JSON to those numbers, so it does not eliminate our back-calculation need; it just isn't attempting the same problem.
2. **Symbol/rune term `100 + level × 100`?** Not addressed at all — no symbol/rune code or mention anywhere in the repo. Cannot confirm, correct, or contradict.
3. **Does it explain/eliminate the ~2% systematic error?** Only partially / indirectly. It doesn't verify our specific character's error, but its `finalMult` model (only genesis-weapon 10%, pet/familiar buffs, and DA/惡魔殺手 ruin skill count toward CP's final-damage multiplier — general equipment/potential final damage% does **not**) plus its mentor/empress/genesis "buff correction" toggles give a concretely testable hypothesis for where such an error could originate, if our reference character carries any of those specific sources un-netted-out. This is the most actionable lead from the survey, not a solved answer.
4. **Demon Avenger / Xenon / special main-stat classes?** Yes, for the CP-from-stats formula specifically — MapleCombat has explicit, distinct range formulas for both (Xenon: 2.625–2.975× triple-stat sum; DA: 0.75–0.85× HP-equivalent-converted main stat, with an explicit `/3.5` and `×0.8`-beyond-baseline conversion). This meaningfully closes part of our gap #4, though it does not address the separate, still-unsolved problem of deriving DA's HP stat or Xenon's STR/DEX/LUK totals from raw Nexon API equipment/symbol/union data (MapleCombat again assumes those totals are already known/typed in).
5. **Sufficient to compute true CP per preset from Nexon OpenAPI alone?** No. The repo has zero Nexon API integration, zero preset-JSON parsing, and its "equipment change" feature requires manual per-item, per-stat entry for every comparison. To reuse its (verified) CP-from-stats formula for our preset-compare feature, we would still have to build, ourselves, the entire "raw API JSON → per-stat base/percent/final decomposition" layer — exactly the unsolved problem our own docs already wrestle with (C_base back-calc). Inputs the Nexon API does not provide regardless of any formula research: inner ability per non-active preset (API only exposes the currently active one), active buffs/skill levels, mentor/empress "buff-inclusive CP" state, and per-source breakdown of pet/familiar final-damage buffs (needed for the float32 stacking order MapleCombat relies on — a single aggregate percentage isn't enough to reproduce it exactly).

## Sources

- https://github.com/centre173/MapleCombat @ 318cf3b0304d451a872758fbba1b142dcaff9198 (2026-07-15)
- `README.md`
- `LICENSE`
- `package.json`
- `src/core/combatPower.ts`
- `src/core/actualDamage.ts`
- `src/core/equipmentDelta.ts`
- `src/core/familiar.ts`
- `src/core/percentFloor.ts`
- `src/core/weaponCorrection.ts`
- `src/core/combatCorrections.ts`
- `src/core/types.ts`
- `src/composables/useCombatPowerFit.ts`
- `src/constants/fields.ts`
- `src/components/character/StatPreviewDialog.vue`
- `tests/unit/core.spec.ts`
- `tests/unit/fixtures/golden.json` (referenced, not dumped)
- Our own `/home/hanshino/workspace/maple-hub/docs/combat-power-formulas.md` (for comparison)
