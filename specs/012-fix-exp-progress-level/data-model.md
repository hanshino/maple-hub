# Data Model: Adjust Experience Progress Component Considering Level

**Date**: 2025-10-26
**Feature**: 012-fix-exp-progress-level

## Overview

This feature modifies the ProgressChart.js component to handle level transitions in experience progress visualization. The data model focuses on the existing progressData structure with level-aware calculations for chart display.

## Core Data Structures

### ProgressData Item (Input)

```javascript
interface ProgressDataItem {
  date: string;        // ISO date string (e.g., "2025-10-26")
  level: number;       // Character level (e.g., 150)
  percentage: number;  // Raw percentage within current level (0-100)
  // ... other existing fields from parent component
}
```

### ChartData Item (Output - Modified for Chart)

```javascript
interface ChartDataItem {
  date: string;           // ISO date string
  percentage: number;     // Level-adjusted percentage (can exceed 100%)
  level: number;          // Character level
  rawPercentage: number;  // Original percentage for reference
  levelAdjustment: number; // Applied adjustment (100 * level_diff)
  // ... other chart-specific fields
}
```

## Data Flow

### Input Processing Pipeline

1. **Raw Data Reception**: `progressData` array passed as prop to ProgressChart.js
2. **Baseline Establishment**: First data point's level becomes the baseline (level 0 adjustment)
3. **Level Difference Calculation**: For each point: `levelDiff = currentLevel - baselineLevel`
4. **Percentage Adjustment**: `adjustedPercentage = rawPercentage + 100 * levelDiff`
5. **Chart Data Generation**: Transform to Recharts-compatible format

### Calculation Examples

```javascript
// Example data progression
const progressData = [
  { date: '2025-10-20', level: 150, percentage: 75 }, // Baseline level 150
  { date: '2025-10-21', level: 150, percentage: 90 }, // Same level: 90%
  { date: '2025-10-22', level: 151, percentage: 10 }, // Level up: 10% + 100% = 110%
  { date: '2025-10-23', level: 152, percentage: 25 }, // Another level: 25% + 200% = 225%
];

// Resulting chartData
const chartData = [
  { date: '2025-10-20', percentage: 75, levelAdjustment: 0 },
  { date: '2025-10-21', percentage: 90, levelAdjustment: 0 },
  { date: '2025-10-22', percentage: 110, levelAdjustment: 100 },
  { date: '2025-10-23', percentage: 225, levelAdjustment: 200 },
];
```

## Data Validation

### Input Validation Rules

- `progressData`: Must be non-empty array
- Each item requires: `date`, `level`, `percentage`
- `level`: Positive integer (1-300 typical for MapleStory)
- `percentage`: Number between 0-100
- `date`: Valid ISO date string
- Array should be sorted chronologically

### Output Validation Rules

- `adjustedPercentage`: Can exceed 100% (no upper limit)
- Maintains chronological order from input
- Preserves all original data fields
- `levelAdjustment`: Non-negative integer (0 or positive)

## Edge Cases Handling

### Level Transitions

- **Level Increase**: Apply 100% per level gained
- **Level Decrease**: No adjustment (use raw percentage)
- **Same Level**: No adjustment applied
- **Missing Level Data**: Use previous valid level or skip point

### Data Quality Issues

- **Non-sequential Dates**: Process in array order (not chronological sort)
- **Invalid Percentages**: Clamp to 0-100 range or skip invalid points
- **Empty Dataset**: Return empty chart data (handled by existing component logic)
- **Single Data Point**: No adjustment needed (baseline = current level)

## Performance Characteristics

- **Time Complexity**: O(n) where n = number of data points
- **Space Complexity**: O(n) for transformed chart data
- **Execution Context**: Runs in React useMemo hook (cached until dependencies change)
- **Memory Impact**: Minimal - reuses existing data structures
- **Re-render Triggers**: Only when progressData prop changes

## Testing Scenarios

### Standard Progression

```javascript
// Happy path with level progression
const standardData = [
  { date: '2025-10-20', level: 150, percentage: 75 },
  { date: '2025-10-21', level: 151, percentage: 10 },
  { date: '2025-10-22', level: 151, percentage: 45 },
  { date: '2025-10-23', level: 152, percentage: 5 },
];
// Expected: 75% → 110% → 145% → 205%
```

### Edge Cases

```javascript
// Level decrease scenario
const levelDownData = [
  { date: '2025-10-20', level: 152, percentage: 25 },
  { date: '2025-10-21', level: 151, percentage: 80 }, // Level down: show 80%
];
// Expected: 225% → 80% (no adjustment for decrease)
```

### Boundary Conditions

```javascript
// Min/max values
const boundaryData = [
  { date: '2025-10-20', level: 1, percentage: 0 },
  { date: '2025-10-21', level: 300, percentage: 100 },
];
// Expected: 0% → 29900% (100 + 100*299)
```
