# Data Model: Dashboard Progress UI Layout Adjustment

**Date**: 2025-10-18
**Feature**: specs/003-dashboard-progress-ui-layout/spec.md

## Entities

### Character (Existing)

**Purpose**: Represents the game character whose progress is being displayed

**Attributes**:

- `id` (string): Unique character identifier (ocid)
- `name` (string): Character name
- `level` (integer): Character level (1-300)
- `class` (string): Character class/job
- `experience` (integer): Current experience points
- `maxExperience` (integer): Experience needed for next level
- `character_class_level` (integer): Class advancement level (determines Hexa Matrix availability)

**Relationships**:

- Has one Hexa Matrix (when character_class_level >= 6)

**Validation Rules**:

- `character_class_level` must be between 1 and 6
- `level` must be positive integer
- `experience` must be non-negative

### Hexa Matrix (Existing)

**Purpose**: Represents the Hexa Matrix skill system for level 6+ characters

**Attributes**:

- `character_ocid` (string): Reference to character
- `cores` (array): Array of core objects with:
  - `hexa_core_name` (string): Name of the core
  - `hexa_core_level` (integer): Current level (0-30)
  - `hexa_core_type` (string): Type (技能核心/精通核心/強化核心/共用核心)
  - `linked_skill` (array): Array of linked skill objects

**Relationships**:

- Belongs to Character

**Validation Rules**:

- Only exists for characters with `character_class_level = 6`
- Core levels must be between 0 and 30
- Core types must be one of the predefined categories

## Data Flow

1. Character data loaded from existing API endpoints
2. Hexa Matrix data fetched conditionally when `character_class_level = 6`
3. UI components receive data through props
4. Chart component transforms core data into radial chart format

## State Management

- Component-level state for UI interactions
- No new global state required
- Existing local storage patterns used for caching
