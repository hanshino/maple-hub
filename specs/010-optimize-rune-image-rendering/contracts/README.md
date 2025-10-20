# API Contracts: Optimize Rune Image Rendering

This feature does not introduce new API endpoints. It modifies frontend components to use existing Nexon API data differently.

## Existing Contracts Used

- `/api/character/[ocid]/runes` - Returns rune data including symbol_icon URLs
- `/api/character/equipment` - Returns equipment data including item_icon URLs

## Contract Changes

No changes to API contracts. The response schemas remain the same, but frontend consumption changes from Next.js Image optimization to direct URL usage.

## Validation

- Ensure symbol_icon and item_icon fields contain valid Nexon URLs
- No breaking changes to existing API responses
