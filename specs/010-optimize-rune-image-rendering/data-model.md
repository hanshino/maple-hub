# Data Model: Optimize Rune Image Rendering

## Entities

### Rune

Represents a rune with display and progression information.

**Fields**:

- `symbol_name` (string): Display name of the rune (required, non-empty)
- `symbol_icon` (string): Direct Nexon image URL (required, valid URL format)
- `symbol_level` (number): Current level (required, 0-20 range)
- `symbol_force` (number): Force value (required, positive integer)

**Validation Rules**:

- `symbol_icon` must be a valid Nexon URL starting with "https://open.api.nexon.com/"
- `symbol_level` must be between 0 and maximum level
- All required fields must be present

**Relationships**:

- None (standalone entity)

### Equipment Item

Represents an equipment item with display information.

**Fields**:

- `item_name` (string): Display name of the item (required, non-empty)
- `item_icon` (string): Direct Nexon image URL (required, valid URL format)
- `item_level` (number): Item level (optional, positive integer)

**Validation Rules**:

- `item_icon` must be a valid Nexon URL starting with "https://open.api.nexon.com/"
- `item_level` if present must be positive

**Relationships**:

- None (standalone entity)

## State Transitions

No state transitions required for this feature - entities are read-only display objects.

## Data Flow

1. Nexon API returns rune/equipment data with image URLs
2. Frontend components receive data through existing API routes
3. Components render images using direct URLs instead of Next.js optimization
4. Error handling provides fallbacks for invalid URLs
