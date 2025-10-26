# Quickstart: Adjust Experience Progress Component Considering Level

**Date**: 2025-10-26
**Feature**: 012-fix-exp-progress-level

## Overview

This guide provides step-by-step instructions to implement level-aware percentage adjustments in the ProgressChart.js component for proper cross-level experience progress visualization.

## Prerequisites

- Next.js 14 project with React 18
- Existing ProgressChart.js component using Recharts
- Jest testing framework
- progressData prop containing level and percentage fields

## Implementation Steps

### Step 1: Locate ProgressChart.js Component

Find the component at `components/ProgressChart.js` and identify the data processing logic:

```javascript
// Current implementation supports both legacy and new formats
const chartData = useMemo(() => {
  // Supports both 'progress' (0-1) and 'percentage' (0-100) + 'level' formats
  // Automatically detects level data and applies 100*n adjustments
}, [progressData]);
```

### Step 2: Component Already Updated ✅

The ProgressChart.js component has been updated to:

- **Support dual data formats**: Accepts both legacy `progress` (0-1) and new `percentage` (0-100) + `level` fields
- **Automatic level detection**: Detects when `level` data is present and enables level-aware calculations
- **Baseline level establishment**: Uses first data point's level as baseline (level 0 adjustment)
- **100\*n adjustment logic**: Adds 100% for each level gained above baseline
- **Backward compatibility**: Maintains support for existing data without level information

### Step 3: Data Format Support

The component now accepts data in these formats:

```javascript
// Legacy format (still supported)
const legacyData = [
  { date: '2025-10-20', progress: 0.75 },
  { date: '2025-10-21', progress: 0.9 },
];

// New format with level support
const levelData = [
  { date: '2025-10-20', level: 150, percentage: 75 },
  { date: '2025-10-21', level: 151, percentage: 10 }, // Shows as 110% in chart
];
```

### Step 4: Level Adjustment Examples

**Level Progression Visualization:**

- Level 150: 75% → Displays as 75%
- Level 151: 10% → Displays as 110% (10% + 100% level adjustment)
- Level 152: 25% → Displays as 225% (25% + 200% level adjustment)

**Level Decrease Handling:**

- Level 152: 25% → Displays as 225%
- Level 151: 80% → Displays as 80% (no adjustment for level decrease)

### Step 4: Add Unit Tests

Update or create `components/ProgressChart.test.js`:

```javascript
import { render } from '@testing-library/react';
import ProgressChart from './ProgressChart';

describe('ProgressChart Level Adjustments', () => {
  test('applies 100% adjustment for each level gained', () => {
    const mockData = [
      { date: '2025-10-20', level: 150, percentage: 75 },
      { date: '2025-10-21', level: 150, percentage: 90 },
      { date: '2025-10-22', level: 151, percentage: 10 }, // Should show 110%
      { date: '2025-10-23', level: 152, percentage: 25 }, // Should show 225%
    ];

    const { container } = render(<ProgressChart progressData={mockData} />);

    // Verify chart renders with adjusted percentages
    // (Specific assertions depend on your chart testing setup)
  });

  test('no adjustment for level decreases', () => {
    const mockData = [
      { date: '2025-10-20', level: 152, percentage: 25 }, // Shows 225%
      { date: '2025-10-21', level: 151, percentage: 80 }, // Shows 80% (no adjustment)
    ];

    const { container } = render(<ProgressChart progressData={mockData} />);

    // Verify level down shows raw percentage
  });

  test('handles empty data gracefully', () => {
    const { container } = render(<ProgressChart progressData={[]} />);

    // Should render without errors
  });
});
```

## Testing the Implementation

### Manual Testing Steps

1. **Prepare Test Data**: Create progressData with level transitions
2. **Render Component**: Mount ProgressChart with test data
3. **Inspect Chart**: Verify line chart shows continuous growth across levels
4. **Check Edge Cases**: Test level decreases and empty data

### Automated Testing

Execute the test suite:

```bash
npm test -- --testPathPattern=ProgressChart
```

### Expected Visual Results

**Before Implementation:**

- Day 1 (Level 150): 75%
- Day 2 (Level 151): 10% ← Chart shows incorrect drop

**After Implementation:**

- Day 1 (Level 150): 75%
- Day 2 (Level 151): 110% ← Chart shows continuous growth

## Troubleshooting Guide

### Common Issues

**Chart not updating with new logic:**

- Verify `progressData` prop includes `level` field
- Check that useMemo dependencies are correct
- Ensure component re-renders when props change

**Incorrect percentage calculations:**

- Confirm baseline level is first data point's level
- Verify levelDiff calculation: `Math.max(0, current - baseline)`
- Check that raw percentages are preserved in `rawPercentage` field

**Performance concerns:**

- Ensure calculations only run when `progressData` changes
- Avoid adding console.log statements in production
- Consider memoizing expensive chart operations

### Debug Verification

Add temporary logging to verify calculations:

```javascript
const chartData = useMemo(() => {
  if (!progressData || progressData.length === 0) return [];

  const baselineLevel = progressData[0].level;
  console.log('Baseline level:', baselineLevel);

  return progressData.map(item => {
    const levelDiff = Math.max(0, item.level - baselineLevel);
    const levelAdjustment = levelDiff * 100;
    const adjustedPercentage = item.percentage + levelAdjustment;

    console.log(
      `Date: ${item.date}, Level: ${item.level}, Raw: ${item.percentage}%, Adjusted: ${adjustedPercentage}%`
    );

    return {
      // ... return object
    };
  });
}, [progressData]);
```

## Validation Checklist

- [ ] ProgressChart.js contains level adjustment logic in useMemo
- [ ] Baseline level correctly set from first data point
- [ ] Level adjustments applied only for level gains (not decreases)
- [ ] Unit tests cover level transition scenarios
- [ ] Manual testing shows continuous chart visualization
- [ ] No breaking changes to existing chart functionality
- [ ] Performance remains acceptable with large datasets

## Integration Notes

- **Parent Components**: No changes required - same `progressData` prop interface
- **Data Sources**: Ensure data includes `level` field alongside existing fields
- **Chart Library**: Compatible with existing Recharts LineChart/PieChart usage
- **Styling**: No changes needed to existing Material-UI styling

## Next Steps

After successful implementation:

- Consider adding visual level transition indicators
- Implement configurable adjustment percentage (currently fixed at 100%)
- Add more comprehensive edge case testing
- Consider tooltip enhancements to show raw vs adjusted percentages
