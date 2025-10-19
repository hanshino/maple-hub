# Research: Refine Hexa Progress Data and Home Display

**Date**: 2025-10-19  
**Feature**: 009-refine-hexa-progress-home

## Overview

Research findings for implementing hexa progress data filtering and hexa attribute stat core integration.

## Research Tasks

### 1. Hexa Core Type Filtering Logic

**Decision**: Filter skills using hexa_core_type count validation and hexa_core_level check

**Rationale**:

- Game mechanics limit "精通核心" and "強化核心" to 4 skills each
- When either type exceeds 4 skills, it indicates API returns invalid cross-class data
- Skills with hexa_core_level = 0 in this scenario are not relevant to current class
- This approach maintains accuracy without needing hardcoded class-skill mappings

**Alternatives considered**:

- Hardcoded class-to-skill mappings: Rejected because it requires constant maintenance as game updates
- Server-side filtering: Rejected because this is client-side only application
- User manual filtering: Rejected due to poor UX

**Implementation approach**:

```javascript
// Pseudocode for filtering logic
function filterHexaCoreSkills(hexaCoreData) {
  const masteryCount = hexaCoreData.filter(
    c => c.hexa_core_type === '精通核心'
  ).length;
  const enhanceCount = hexaCoreData.filter(
    c => c.hexa_core_type === '強化核心'
  ).length;

  if (masteryCount > 4 || enhanceCount > 4) {
    // Special case: filter out level 0 skills
    return hexaCoreData.filter(c => c.hexa_core_level > 0);
  }

  return hexaCoreData; // Normal case: all skills valid
}
```

### 2. Hexa Stat Core API Integration

**Decision**: Use character_hexa_stat_core array from /hexamatrix-stat endpoint

**Rationale**:

- API endpoint: `https://open.api.nexon.com/maplestorytw/v1/character/hexamatrix-stat`
- Returns structured data with slot_id, stat names, levels, and grade
- Consistent with existing API integration pattern using Axios
- Data structure already validated in clarification phase

**Alternatives considered**:

- Using preset_hexa_stat_core fields: Rejected because character_hexa_stat_core represents active configuration
- Combining all three core arrays: Rejected due to complexity without clear benefit

**API Response Structure**:

```json
{
  "character_class": "string",
  "character_hexa_stat_core": [
    {
      "slot_id": "string",
      "main_stat_name": "string",
      "sub_stat_name_1": "string",
      "sub_stat_name_2": "string",
      "main_stat_level": number,
      "sub_stat_level_1": number,
      "sub_stat_level_2": number,
      "stat_grade": number
    }
  ]
}
```

### 3. Progress Calculation for Attribute Cores

**Decision**: Calculate progress based on activation status with deferred handling for partial activations

**Rationale**:

- Unactivated cores (stat_grade = 0): Use minimum activation cost (5 靈魂艾爾達 + 10 碎片 for Core I)
- Fully activated cores (stat_grade = 20): Calculate actual material usage based on level distribution
- Partially activated cores: Defer calculation due to upgrade probability uncertainty
- This approach provides accurate estimates while acknowledging calculation limits

**Alternatives considered**:

- Averaging all upgrade paths: Rejected due to high variance in actual costs
- User input for partial cores: Rejected to maintain automatic calculation
- Ignoring partial cores: Rejected as it would show incomplete progress

**Material Cost Reference**:

```
Activation costs:
- Core I: 5 靈魂艾爾達 + 10 碎片
- Core II: 10 靈魂艾爾達 + 200 碎片
- Core III: 15 靈魂艾爾達 + 350 碎片

Upgrade costs per level (靈魂艾爾達碎片):
- Level 0-2: 10 碎片/attempt
- Level 3-6: 20 碎片/attempt
- Level 7-8: 30 碎片/attempt
- Level 9: 50 碎片/attempt
```

### 4. UI Layout for Hexa Stat Display

**Decision**: Display hexa stat cores in Material-UI table below existing hexa progress section

**Rationale**:

- Consistent with existing Material-UI component usage
- Table format clearly shows slot, stat names, and levels
- Positioning below existing progress maintains logical information hierarchy
- Responsive table design works across devices per constitution

**Alternatives considered**:

- Card layout: Rejected as less efficient for tabular data with multiple columns
- Inline with existing hexa progress: Rejected to avoid cluttering existing visualization
- Separate modal/dialog: Rejected as spec requires direct visibility on home page

**Table Columns**:

1. Slot ID
2. Main Stat (name + level)
3. Sub Stat 1 (name + level)
4. Sub Stat 2 (name + level)
5. Grade

### 5. Best Practices for React Component Updates

**Decision**: Extend existing HexaMatrixProgress component with new table subcomponent

**Rationale**:

- Maintains component cohesion (all hexa data in one component)
- Follows React composition pattern
- Easier to test and maintain than creating separate disconnected component
- Aligns with Component Reusability principle in constitution

**Alternatives considered**:

- New standalone component: Rejected as it would duplicate data fetching logic
- Inline all changes in page.js: Rejected violates component reusability principle

**Component Structure**:

```jsx
<HexaMatrixProgress>
  {/* Existing progress visualization */}
  <HexaStatCoresTable cores={filteredStatCores} />
</HexaMatrixProgress>
```

## Performance Considerations

- **Filtering**: O(n) complexity acceptable for typical dataset size (<100 skills)
- **API Call**: Single additional endpoint, leverage existing caching mechanism
- **Rendering**: Material-UI table handles virtualization for large datasets
- **Bundle Size**: No new major dependencies needed

## Testing Strategy

1. **Unit Tests**:
   - Filter function with various skill count scenarios
   - Progress calculation for different activation states
   - API response parsing

2. **Integration Tests**:
   - Full data flow from API to display
   - Error handling for missing/malformed data
   - Cache behavior

3. **Visual Regression**:
   - Table layout responsiveness
   - Data accuracy in display

## Security & Privacy

- No new security considerations
- Uses existing API key management
- No sensitive data stored beyond existing patterns

## Conclusion

All technical decisions align with existing architecture and constitution principles. No blockers identified for implementation. Ready to proceed to Phase 1 (Design & Contracts).
