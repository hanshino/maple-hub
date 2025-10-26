# Research Findings: Adjust Experience Progress Component Considering Level

**Date**: 2025-10-26
**Feature**: 012-fix-exp-progress-level

## Research Tasks Completed

### 1. Frontend-Only Implementation Confirmation

**Decision**: Implement level-aware percentage adjustments directly in ProgressChart.js component

**Rationale**: Analysis of existing codebase shows ProgressChart.js already handles data processing in useMemo. Frontend-only approach avoids backend changes and maintains current architecture.

**Key Findings**:

- ProgressChart.js uses Recharts for visualization
- Data processing occurs in useMemo hook with progressData prop
- No backend API changes required for this feature

### 2. ProgressChart.js Component Analysis

**Decision**: Modify the chartData useMemo logic to apply 100\*n adjustments for cross-level visualization

**Rationale**: Current implementation processes progressData array but doesn't account for level transitions. Adding level-aware calculations will fix percentage drops after level-ups.

**Current Implementation Structure**:

```javascript
const chartData = useMemo(() => {
  return progressData.map((item, index) => ({
    date: item.date,
    percentage: item.percentage,
    // Additional processing for predictions
  }));
}, [progressData]);
```

**Required Modifications**:

- Track baseline level from first data point
- Apply 100\*n adjustment where n = (current_level - baseline_level)
- Maintain existing prediction and chart logic

### 3. Level Adjustment Calculation Logic

**Decision**: Implement 100\*n percentage addition for higher level data points

**Rationale**: When character levels up, experience resets to 0%. Adding 100% per level difference provides visual continuity in charts showing historical progress across level boundaries.

**Mathematical Approach**:

- Baseline level = first data point level
- For each subsequent point: adjusted_percentage = original_percentage + 100 \* (current_level - baseline_level)
- Example: Level 150 (baseline) → Level 151: percentages increase by 100%

**Edge Cases Handled**:

- Level decreases (de-leveling): No adjustment needed
- Missing level data: Use previous known level
- Non-sequential data: Calculate based on level differences

### 4. Data Flow and Dependencies

**Decision**: Leverage existing progressData prop structure without changes

**Rationale**: Current data flow from API → components works well. No need to modify data sources or intermediate processing.

**Data Structure Analysis**:

```javascript
// Expected progressData format
[
  {
    date: '2025-10-26',
    level: 150,
    percentage: 75.5,
    // other fields...
  },
];
```

**Integration Points**:

- ProgressChart.js receives progressData from parent component
- No changes needed to data fetching or parent components
- Maintains compatibility with existing Recharts integration

## Technical Recommendations

1. **Component Modification**: Update ProgressChart.js useMemo to include level-aware calculations
2. **Testing Strategy**: Add unit tests for level adjustment logic in ProgressChart.test.js
3. **Documentation**: Update component JSDoc to reflect new level handling behavior
4. **Performance**: Ensure calculations don't impact chart rendering performance

## Risks Identified

- Complex level transition scenarios (multiple levels in short time)
- Large datasets with many level changes
- Potential visual confusion with adjusted percentages > 100%

## Next Steps

Proceed to Phase 1 design with updated component contracts and implementation details.
