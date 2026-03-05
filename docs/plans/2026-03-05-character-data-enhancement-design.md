# Character Data Enhancement Design

## Goal

Enhance the character page by (1) displaying three-line combat power with preset analysis, and (2) consolidating all character data sections into a unified Tabs component with four new data panels.

## Architecture

### Page Structure

```
1. Search bar
2. CharacterCard (with three-line combat power: bossing / current / leveling)
3. Two-column grid: ProgressChart | HexaMatrixProgress
4. CharacterDataTabs:
   [能力值] [聯盟戰地] [極限屬性] [套裝效果] [聯盟神器] [符文系統]
```

Replaces the existing CharacterStats Accordion and standalone RuneSystems Card with a single Tabs component.

### Combat Power Preset Display

CharacterCard right section changes from single battle power number to:

```
戰鬥力
──────────
打王  12,345,678  (Preset 1)
目前  11,200,000  (Preset 3)
練等   9,800,000  (Preset 2)
```

- **打王戰力**: Highest combat power across all presets
- **目前戰力**: Current API-reported combat power
- **練等戰力**: Preset detected via potential keywords (道具掉落率, 楓幣獲得量, 一般怪物傷害)
- Each line shows preset number in small text
- Fallback to single battle power if calculation fails or data insufficient

### Leveling Preset Detection

Scan potential options for keywords: 道具掉落率, 楓幣獲得量, 一般怪物傷害. Threshold >= 3 matches identifies a leveling preset.

## API Strategy

### New API Routes (4)

```
/api/character/union-raider?ocid=xxx    → Nexon /user/union-raider
/api/character/hyper-stat?ocid=xxx      → Nexon /character/hyper-stat
/api/character/set-effect?ocid=xxx      → Nexon /character/set-effect
/api/character/union-artifact?ocid=xxx  → Nexon /user/union-artifact
```

### Request Sequencing (Nexon rate limit: 5 req/s)

**Wave 1 (on search, parallel with staggering):**
- character basic (7-day history)
- stats
- union basic
- runes (symbol-equipment)
- equipment
- set-effect (delayed ~200ms to avoid exceeding 5 req/s)

**Wave 2 (lazy load on Tab switch):**
- union-raider
- hyper-stat
- union-artifact

### Data Sharing

- Equipment data fetched in Wave 1, stored in page state
- Shared with CharacterCard (preset combat power calculation) and EquipmentDialog (via `prefetchedData` prop, avoids duplicate API call)

## Tab Content Design

1. **能力值** — Existing CharacterStats table content (moved from Accordion)
2. **聯盟戰地** — List of stat bonuses from union raider placement (no board visualization)
3. **極限屬性** — Hyper stat levels and bonuses per attribute
4. **套裝效果** — Active set names and their triggered effect bonuses
5. **聯盟神器** — Artifact level, equipped crystals and effects
6. **符文系統** — Existing RuneSystems content (with sub-tabs for 祕法/真實/豪華)

Lazy-loaded tabs show loading spinner on first visit, then cache client-side.

Mobile: Tabs set to `scrollable` with horizontal scroll.

## Components

### New
- `CharacterDataTabs` — Unified tabs container
- `UnionRaiderPanel` — Union raider stat list
- `HyperStatPanel` — Hyper stat levels and bonuses
- `SetEffectPanel` — Active set effects
- `UnionArtifactPanel` — Artifact crystal effects
- `lib/combatPowerCalculator.js` — Preset combat power calculation logic

### Modified
- `CharacterCard` — Three-line combat power display
- `EquipmentDialog` — Accept `prefetchedData` prop
- `app/page.js` — Updated data flow, equipment prefetch, new state management

### Removed (content moved into Tabs)
- CharacterStats standalone Accordion usage
- RuneSystems standalone Card wrapper

## Combat Power Calculation

Uses reverse-engineering approach documented in `docs/combat-power-formulas.md`:
1. Current API stats as ground truth
2. Separate independent equipment (寶玉) from preset equipment
3. Calculate stat differences between presets
4. Account for set effect changes per preset
5. Recalculate combat power per preset using formula:
   `(主屬×4 + 副屬) × 1.3 × 攻擊力/100 × (1+傷害%+Boss傷%) × (1+爆傷%)`
