# Component Contract: ProgressChart.js

**Date**: 2025-10-26
**Feature**: 012-fix-exp-progress-level

## Component Overview

ProgressChart.js is a React component that displays experience progress data using Recharts. This contract defines the interface for the level-aware percentage adjustments.

## Props Interface

```javascript
interface ProgressChartProps {
  progressData: ProgressDataItem[];
  // ... other existing props
}

interface ProgressDataItem {
  date: string;        // ISO date string (required)
  level: number;       // Character level (required)
  percentage: number;  // Raw percentage 0-100 (required)
  // ... other optional fields
}
```

## Output Interface

```javascript
interface ChartDataItem {
  date: string;           // ISO date string
  percentage: number;     // Adjusted percentage (can exceed 100%)
  level: number;          // Character level
  rawPercentage: number;  // Original percentage
  levelAdjustment: number; // Applied adjustment
  // ... other chart fields
}
```

## Behavior Contracts

### Primary Behavior: Level Adjustment Calculation

**Preconditions**:

- `progressData` is non-empty array
- First item has valid `level` and `percentage`
- All items have required fields

**Postconditions**:

- Returns array with same length as input
- Each item has `levelAdjustment` calculated as `100 * (currentLevel - baselineLevel)`
- `percentage` = `rawPercentage + levelAdjustment`
- Baseline level is first item's level

**Invariants**:

- Chronological order preserved
- No data loss from input to output
- Level adjustments are non-negative

### Edge Case: Level Decrease

**Preconditions**:

- Current level < previous level

**Postconditions**:

- `levelAdjustment` = 0 (no bonus applied)
- `percentage` = `rawPercentage`

### Edge Case: Empty Data

**Preconditions**:

- `progressData` is empty array

**Postconditions**:

- Returns empty array
- No errors thrown

## Error Handling

### Invalid Input Data

**Triggers**:

- Missing required fields (`date`, `level`, `percentage`)
- Invalid data types
- `percentage` outside 0-100 range

**Behavior**:

- Skip invalid data points
- Log warning to console
- Continue processing valid points

### Level Data Missing

**Triggers**:

- `level` field missing or invalid

**Behavior**:

- Use previous valid level
- If no previous level available, skip point

## Performance Contracts

### Time Complexity

- O(n) where n = progressData.length
- Executed in useMemo (cached until props change)

### Memory Usage

- O(n) additional space for transformed data
- No external allocations

## Testing Contracts

### Unit Test Requirements

**Happy Path**:

```javascript
// Input
const input = [
  { date: '2025-10-20', level: 150, percentage: 75 },
  { date: '2025-10-21', level: 151, percentage: 10 },
];

// Expected output
const output = [
  { date: '2025-10-20', percentage: 75, levelAdjustment: 0 },
  { date: '2025-10-21', percentage: 110, levelAdjustment: 100 },
];
```

**Edge Cases**:

- Level decrease: No adjustment applied
- Invalid data: Points skipped gracefully
- Empty array: Empty result returned

## Dependencies

### External Dependencies

- React (useMemo hook)
- Recharts (chart rendering)

### Internal Dependencies

- None (self-contained calculation logic)

## Future Compatibility

### Backward Compatibility

- Existing props interface unchanged
- Output maintains chart compatibility
- No breaking changes to parent components

### Extension Points

- Additional calculation logic can be added
- New chart types can use same data structure
- Level adjustment formula can be parameterized
