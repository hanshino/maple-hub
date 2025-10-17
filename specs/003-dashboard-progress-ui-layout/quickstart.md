# Quickstart: Dashboard Progress UI Layout Adjustment

**Date**: 2025-10-18
**Feature**: specs/003-dashboard-progress-ui-layout/spec.md

## Overview

This feature modifies the dashboard-progress page to reorganize the UI into a two-row grid layout with improved Hexa Matrix visualization.

## Prerequisites

- Next.js 14 project with Material-UI and Recharts installed
- Existing dashboard-progress page at `app/dashboard-progress/page.js`
- Character and Hexa Matrix API integration

## Implementation Steps

### 1. Update Dashboard Progress Page Layout

Modify `app/dashboard-progress/page.js` to use Material-UI Grid:

```jsx
import Grid from '@mui/material/Grid';

// In your component:
<Grid container spacing={2}>
  {/* First row: Character info and experience */}
  <Grid item xs={12}>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <CharacterCard {...characterData} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ProgressBar {...experienceData} />
      </Grid>
    </Grid>
  </Grid>

  {/* Second row: Hexa Matrix (only for level 6+) */}
  {characterData.character_class_level === 6 && (
    <Grid item xs={12}>
      <HexaMatrixProgress hexaData={hexaMatrixData} />
    </Grid>
  )}
</Grid>;
```

### 2. Create HexaMatrixProgress Component

Create `components/HexaMatrixProgress.js`:

```jsx
import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, Typography } from '@mui/material';

const HexaMatrixProgress = ({ hexaData }) => {
  // Transform hexaData into chart format
  const chartData = hexaData.character_hexa_core_equipment.map(core => ({
    name: core.hexa_core_name,
    level: core.hexa_core_level,
    maxLevel: 30,
    fill: getColorForCoreType(core.hexa_core_type),
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          六轉進度
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <RadialBarChart data={chartData}>
            <RadialBar dataKey="level" />
            <Legend />
          </RadialBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default HexaMatrixProgress;
```

### 3. Add Lazy Loading

Implement lazy loading for performance:

```jsx
const HexaMatrixProgress = lazy(
  () => import('../components/HexaMatrixProgress')
);

// In your component:
<Suspense fallback={<div>Loading chart...</div>}>
  <HexaMatrixProgress hexaData={hexaMatrixData} />
</Suspense>;
```

## Testing

### Unit Tests

```bash
# Test the new component
npm test -- components/HexaMatrixProgress.test.js
```

### Integration Tests

```bash
# Test the updated dashboard page
npm test -- pages/dashboard-progress.test.js
```

## Deployment

1. Commit changes to feature branch
2. Test on development environment
3. Merge to main branch
4. Deploy to production

## Performance Verification

- Page load time: < 2 seconds
- Chart render time: < 3 seconds
- Responsive behavior on mobile/tablet/desktop
