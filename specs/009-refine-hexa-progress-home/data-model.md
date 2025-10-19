# Data Model: Refine Hexa Progress Data and Home Display

**Date**: 2025-10-19  
**Feature**: 009-refine-hexa-progress-home

## Overview

This document defines the data structures and relationships for hexa progress filtering and hexa stat core integration.

## Entities

### HexaCore (Existing - Extended)

Represents a skill core in the hexa matrix system.

**Fields**:

- `hexa_core_name`: string - Name of the skill
- `hexa_core_level`: number - Current level (0-10)
- `hexa_core_type`: string - Type of core ("精通核心", "強化核心", "共通核心")
- `slot_index`: string - Position in hexa matrix

**Validation Rules**:

- `hexa_core_level` must be 0-10
- `hexa_core_type` must be one of the three valid types
- For filtering: If count of "精通核心" OR "強化核心" > 4, filter cores where `hexa_core_level === 0`

**State Transitions**:

- Raw API data → Filtered data (via filterHexaCoreSkills)
- Filtered data → Progress calculation

**Relationships**:

- Many HexaCores belong to one Character
- HexaCores are grouped by hexa_core_type for validation

---

### HexaStatCore (New)

Represents an attribute enhancement core in the hexa matrix system.

**Fields**:

- `slot_id`: string - Slot position identifier ("0", "1", "2")
- `main_stat_name`: string | null - Primary stat being enhanced (e.g., "boss傷害增加", "爆擊傷害增加")
- `sub_stat_name_1`: string | null - First secondary stat
- `sub_stat_name_2`: string | null - Second secondary stat
- `main_stat_level`: number - Level of main stat (0-10)
- `sub_stat_level_1`: number - Level of first sub stat (0-10)
- `sub_stat_level_2`: number - Level of second sub stat (0-10)
- `stat_grade`: number - Overall grade of the stat core (0-20)

**Validation Rules**:

- All stat levels must be 0-10
- stat_grade must be 0-20
- If stat_grade is 0, all stat names should be null (unactivated)
- If stat_grade > 0, main_stat_name must not be null
- Same stat type cannot appear in main and sub positions

**State Transitions**:

- Unactivated (stat_grade = 0) → Activated (stat_grade > 0)
- Each upgrade attempt can increase one of the three stat levels
- stat_grade represents sum of main + sub levels

**Relationships**:

- Many HexaStatCores belong to one Character (up to 3 cores can be activated eventually)
- HexaStatCores are independent from HexaCores (different API endpoints)

---

### HexaProgress (Existing - Extended)

Represents the calculated progress for hexa matrix system.

**Fields (Existing)**:

- `totalCores`: number - Count of all skill cores
- `maxedCores`: number - Count of level 10 cores
- `averageLevel`: number - Average level across all cores
- `progressPercentage`: number - Overall progress (0-100)

**Fields (New)**:

- `statCoresProgress`: object - Progress tracking for stat cores
  - `activatedCount`: number - How many stat cores are activated
  - `totalAvailable`: number - Total cores that can be activated (currently 3)
  - `materialUsed`: object - Estimated materials consumed
    - `soulElda`: number - 靈魂艾爾達 used
    - `soulEldaFragments`: number - 靈魂艾爾達碎片 used
  - `averageGrade`: number - Average stat_grade across activated cores

**Validation Rules**:

- progressPercentage must be 0-100
- statCoresProgress.activatedCount ≤ totalAvailable
- Material calculations only for stat_grade 0 or 20 (deferred for partial)

**Calculation Logic**:

```javascript
// Skill cores progress (existing)
totalCores = filteredHexaCores.length
maxedCores = filteredHexaCores.filter(c => c.hexa_core_level === 10).length
averageLevel = sum(hexa_core_levels) / totalCores
progressPercentage = (averageLevel / 10) * 100

// Stat cores progress (new)
activatedCount = hexaStatCores.filter(c => c.stat_grade > 0).length
averageGrade = sum(stat_grades) / activatedCount

// Material calculation
for each core:
  if stat_grade === 0:
    add activation cost based on slot_id
  else if stat_grade === 20:
    calculate upgrade costs based on level distribution
  else:
    skip (deferred)
```

---

### Character (Existing - Referenced)

Represents a MapleStory character.

**Fields (Relevant)**:

- `ocid`: string - Character identifier
- `character_class`: string - Character's class name
- `character_name`: string - Display name

**Relationships**:

- One Character has many HexaCores
- One Character has many HexaStatCores
- One Character has one HexaProgress calculation

---

## Data Flow

```
1. User searches for character
   ↓
2. Fetch character data (existing flow)
   ↓
3. Fetch hexa matrix skill data (existing endpoint)
   ↓
4. **NEW**: Filter hexa cores based on type count validation
   ↓
5. **NEW**: Fetch hexa stat core data (/hexamatrix-stat endpoint)
   ↓
6. **NEW**: Calculate stat core progress (with material estimates)
   ↓
7. Combine skill + stat progress into unified HexaProgress
   ↓
8. Display on home page with table for stat cores
```

## API Contracts

See `/contracts/hexa-matrix-stat-api.md` for detailed API schema.

## Storage

- **Cache Strategy**: Store fetched hexa stat core data in same cache structure as existing hexa data
- **Cache Key**: `hexa-stat-${ocid}`
- **TTL**: Same as existing hexa data cache (24 hours recommended)
- **Storage Location**: localStorage (client-side only)

## Sample Data

### Filtered HexaCore

```json
{
  "hexa_core_name": "轉瞬之間",
  "hexa_core_level": 5,
  "hexa_core_type": "精通核心",
  "slot_index": "1"
}
```

### HexaStatCore (Activated)

```json
{
  "slot_id": "0",
  "main_stat_name": "boss傷害增加",
  "sub_stat_name_1": "爆擊傷害增加",
  "sub_stat_name_2": "主要屬性增加",
  "main_stat_level": 3,
  "sub_stat_level_1": 7,
  "sub_stat_level_2": 10,
  "stat_grade": 20
}
```

### HexaProgress (Extended)

```json
{
  "totalCores": 12,
  "maxedCores": 3,
  "averageLevel": 6.5,
  "progressPercentage": 65,
  "statCoresProgress": {
    "activatedCount": 1,
    "totalAvailable": 3,
    "materialUsed": {
      "soulElda": 5,
      "soulEldaFragments": 10
    },
    "averageGrade": 20
  }
}
```

## Validation & Constraints

1. **Hexa Core Filtering**:
   - Must validate type counts before filtering
   - Preserve all cores if counts are valid (≤4 per type)
   - Only filter level 0 cores when special case detected

2. **Stat Core Progress**:
   - Only calculate for fully unactivated or fully maxed cores
   - Mark partial progress with flag for future calculation
   - Ensure material costs align with official game data

3. **Display**:
   - Handle null stat names gracefully
   - Show appropriate messaging for unactivated slots
   - Indicate deferred calculations clearly to users

## Migration Notes

No database migrations needed (client-side only). Existing localStorage cache structure is compatible with additions.
