# Data Model: 六轉進度 Display

## Entities

### Hexa Matrix Core

Represents a Hexa Matrix core equipment entry from Nexon API.

**Fields:**

- `hexa_core_name`: string (core name, e.g., "天堂神罰")
- `hexa_core_level`: integer (current level, 0-30)
- `hexa_core_type`: string (core type: 技能核心/精通核心/強化核心/共用核心)
- `linked_skill`: array of objects (linked skills with hexa_skill_id)

**Validation Rules:**

- `hexa_core_level` must be integer between 0 and 30
- `hexa_core_type` must be one of the predefined types
- `linked_skill` array can be empty

**Relationships:**

- Belongs to Character (via ocid)

**State Transitions:**

- Level up: Increment hexa_core_level when resources are consumed
- Max level: hexa_core_level reaches 30

### Hexa Matrix Skill

Represents individual skills linked to Hexa Matrix cores.

**Fields:**

- `hexa_skill_id`: string (skill identifier)
- `linked_core_name`: string (reference to parent core)

**Validation Rules:**

- `hexa_skill_id` must be non-empty string
- `linked_core_name` must reference existing core

**Relationships:**

- Belongs to Hexa Matrix Core

### Hexa Matrix Level Cost

Represents resource costs for leveling each core type per level.

**Fields:**

- `level`: integer (level number, 0-30)
- `skill_core_soul_elder`: integer (Soul Elder cost for skill cores)
- `skill_core_soul_elder_fragment`: integer (Soul Elder Fragment cost for skill cores)
- `mastery_core_soul_elder`: integer (Soul Elder cost for mastery cores)
- `mastery_core_soul_elder_fragment`: integer (Soul Elder Fragment cost for mastery cores)
- `enhancement_core_soul_elder`: integer (Soul Elder cost for enhancement cores)
- `enhancement_core_soul_elder_fragment`: integer (Soul Elder Fragment cost for enhancement cores)
- `shared_core_soul_elder`: integer (Soul Elder cost for shared cores)
- `shared_core_soul_elder_fragment`: integer (Soul Elder Fragment cost for shared cores)

**Validation Rules:**

- All cost fields must be non-negative integers
- Level must be between 0 and 30

**Relationships:**

- Used for progress calculations (no direct entity relationships)

### Hexa Matrix Progress Summary

Calculated progress information for display.

**Fields:**

- `totalProgress`: number (overall progress percentage, 0-100)
- `totalSpent`: object (total resources spent { soul_elder: number, soul_elder_fragment: number })
- `totalRequired`: object (total resources required { soul_elder: number, soul_elder_fragment: number })
- `coreProgress`: array (individual core progress objects)

**Validation Rules:**

- `totalProgress` clamped between 0 and 100
- Resource amounts are non-negative numbers

## Data Flow

1. Fetch Hexa Matrix data from Nexon API
2. Parse core levels and types
3. Calculate spent resources using level cost table
4. Calculate total required resources for max progress
5. Display total progress with expandable detailed core information

## Caching Strategy

- Cache Hexa Matrix data in local storage with character ocid as key
- Cache expiration: 1 hour
- Fallback to cached data when API unavailable
