# Data Model: Add Character Details to Home Page

**Date**: 2025-10-19  
**Feature**: 008-add-character-details-home

## Overview

This feature extends the existing character data model to support detailed equipment and stats display on the home page.

## Core Entities

### Character (Extended)

**Existing Fields**:

- `character_name`: string - Character display name
- `character_level`: number - Character level
- `character_class`: string - Character class/job
- `character_image`: string - Character portrait URL
- `ocid`: string - Character unique identifier

**New Fields**:

- `item_equipment`: Equipment[] - Base equipment array
- `item_equipment_preset_1`: Equipment[] - Preset 1 equipment
- `item_equipment_preset_2`: Equipment[] - Preset 2 equipment
- `item_equipment_preset_3`: Equipment[] - Preset 3 equipment
- `preset_no`: number - Active preset (1-3)
- `character_stat`: Stat[] - Character statistics array

### Equipment

**Fields**:

- `item_equipment_part`: string - Equipment slot type (e.g., "戒指", "武器")
- `item_equipment_slot`: string - Specific slot identifier (e.g., "戒指1", "戒指2")
- `item_name`: string - Equipment item name
- `item_icon`: string - Equipment icon URL
- `item_level`: number - Equipment level/upgrade level

**Validation Rules**:

- `item_equipment_slot` must be unique within equipment array
- `item_icon` should be valid HTTP/HTTPS URL when present
- `item_level` should be positive integer when present

### Stat

**Fields**:

- `stat_name`: string - Statistic name (e.g., "STR", "INT", "攻擊力")
- `stat_value`: number - Statistic value

**Validation Rules**:

- `stat_name` must be non-empty string
- `stat_value` should be non-negative number

## Relationships

```
Character (1) ──── (0..*) Equipment (base + presets)
Character (1) ──── (0..*) Stat
```

## Data Processing Logic

### Equipment Merging

1. Start with base equipment from `item_equipment`
2. Apply preset equipment based on `preset_no` (1-3)
3. Preset items override base items with same `item_equipment_part`
4. Map equipment to display positions using `item_equipment_slot`

### Stats Display Processing

1. Group stats into pairs for table display (屬性: 數值 屬性: 數值 per row)
2. Identify min/max pairs (e.g., "最低屬性攻擊力" + "最高屬性攻擊力")
3. Merge min/max pairs into range format (e.g., "100-200")
4. Filter out non-essential stats during implementation
5. Display in table format with proper spacing and alignment

## State Transitions

### Equipment Display States

- `loading`: Fetching equipment data
- `loaded`: Equipment data processed and ready for display
- `error`: Failed to load equipment data (block hidden)
- `empty`: No equipment data available

### Stats Display States

- `loading`: Fetching stats data
- `loaded`: Stats data processed and ready for display
- `error`: Failed to load stats data (block hidden)
- `empty`: No stats data available

## Caching Strategy

- **Storage**: Client-side storage (localStorage when available)
- **Key Format**: `equipment_${ocid}`, `stats_${ocid}`
- **TTL**: 5 minutes
- **Invalidation**: Automatic expiration, manual refresh on user action

## Error Handling

- **API Failures**: Hide equipment/stats blocks entirely
- **Invalid Data**: Graceful fallback to empty states
- **Image Load Failures**: Display fallback text in equipment slots
- **Cache Corruption**: Clear cache and refetch data</content>
  <parameter name="filePath">e:\workspace\maplestory\specs\008-add-character-details-home\data-model.md
