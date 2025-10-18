# Data Model

**Feature**: Add Rune Systems to Character Info
**Date**: 2025-10-18

## Entities

### Rune

Represents a single rune with its properties and upgrade progress.

**Fields**:

- `type`: String (enum: "Secret", "True", "Luxury Authentic") - The category of rune
- `name`: String - Display name from API (e.g., "祕法符文：消逝的旅途")
- `iconUrl`: String - URL to the rune's icon image
- `level`: Integer - Current upgrade level (1-20 for Secret, 1-11 for True/Authentic)
- `force`: Integer - Current force value
- `growthCount`: Integer - Current growth count towards next level
- `requiredGrowthCount`: Integer - Total growth count needed for next level
- `progressPercentage`: Float (0-100) - Calculated progress towards next level

**Relationships**:

- Belongs to Character (via character ID)
- No direct relationships between runes

**Validation Rules**:

- `type` must be one of the allowed values
- `level` must be positive integer within type-specific max
- `iconUrl` must be valid URL format
- `progressPercentage` must be between 0 and 100

**State Transitions**:

- Level increases when growthCount >= requiredGrowthCount
- Progress recalculated on data load

## Data Flow

1. External API provides rune array for character
2. Client maps API data to Rune entities
3. Progress calculations applied to each rune
4. UI renders rune grid with calculated progress bars

## Storage

Client-side only - no persistent storage required as data is fetched from external API on demand.
