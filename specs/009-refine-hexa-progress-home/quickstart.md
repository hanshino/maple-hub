# Quickstart: Refine Hexa Progress Data and Home Display

**Feature**: 009-refine-hexa-progress-home  
**Date**: 2025-10-19

## Overview

This guide helps developers quickly understand and implement the hexa progress refinement feature.

## What This Feature Does

1. **Filters hexa skill cores** to show only skills relevant to the character's current class
2. **Integrates hexa stat cores** (attribute enhancements) into progress tracking
3. **Displays refined data** on the home page with clear tabular format

## Quick Start (5 minutes)

### Prerequisites

```bash
# Ensure you're on the feature branch
git checkout 009-refine-hexa-progress-home

# Install dependencies (if not already)
npm install

# Run development server
npm run dev
```

### Key Files to Know

| File                               | Purpose              | Your Action                        |
| ---------------------------------- | -------------------- | ---------------------------------- |
| `lib/hexaMatrixUtils.js`           | Add filtering logic  | Implement `filterHexaCoreSkills()` |
| `lib/hexaMatrixApi.js`             | Add API call         | Implement `fetchHexaStatCores()`   |
| `lib/progressUtils.js`             | Extend progress calc | Add stat core progress calculation |
| `components/HexaMatrixProgress.js` | Update UI            | Add stat core table display        |
| `app/page.js`                      | Home page            | Integrate new data flow            |

### Implementation Order

**Phase 1: Data Layer (lib/)**

1. Add filtering function to `hexaMatrixUtils.js`
2. Add API call to `hexaMatrixApi.js`
3. Extend progress calculation in `progressUtils.js`

**Phase 2: UI Layer (components/)**

4. Create/update stat core display in `HexaMatrixProgress.js`
5. Update home page data flow in `app/page.js`

**Phase 3: Testing (**tests**/)**

6. Add unit tests for filtering logic
7. Add integration tests for data flow
8. Add component tests for UI rendering

## Core Implementation Patterns

### 1. Filtering Hexa Cores

```javascript
// lib/hexaMatrixUtils.js
export function filterHexaCoreSkills(hexaCoreData) {
  const masteryCount = hexaCoreData.filter(
    c => c.hexa_core_type === '精通核心'
  ).length;

  const enhanceCount = hexaCoreData.filter(
    c => c.hexa_core_type === '強化核心'
  ).length;

  // Special case: cross-class data detected
  if (masteryCount > 4 || enhanceCount > 4) {
    return hexaCoreData.filter(c => c.hexa_core_level > 0);
  }

  // Normal case: all data is valid
  return hexaCoreData;
}
```

**Why this works**: Game mechanics limit each core type to 4 skills. More than 4 indicates API returned cross-class data. Skills with level 0 are invalid in this case.

### 2. Fetching Hexa Stat Cores

```javascript
// lib/hexaMatrixApi.js
export async function fetchHexaStatCores(ocid) {
  try {
    const response = await axios.get(
      `https://open.api.nexon.com/maplestorytw/v1/character/hexamatrix-stat`,
      {
        params: { ocid },
        headers: {
          'x-nxopen-api-key': process.env.NEXT_PUBLIC_NEXON_API_KEY,
        },
      }
    );

    return {
      class: response.data.character_class,
      cores: response.data.character_hexa_stat_core || [],
    };
  } catch (error) {
    console.error('Failed to fetch hexa stat cores:', error);
    throw error;
  }
}
```

**Cache key**: `hexa-stat-${ocid}`

### 3. Calculating Stat Core Progress

```javascript
// lib/progressUtils.js
export function calculateStatCoreProgress(statCores) {
  const activatedCores = statCores.filter(c => c.stat_grade > 0);

  let materialUsed = {
    soulElda: 0,
    soulEldaFragments: 0,
  };

  statCores.forEach((core, index) => {
    if (core.stat_grade === 0) {
      // Unactivated: add activation cost
      const costs = [
        { elda: 5, fragments: 10 }, // Core I
        { elda: 10, fragments: 200 }, // Core II
        { elda: 15, fragments: 350 }, // Core III
      ];
      materialUsed.soulElda += costs[index]?.elda || 0;
      materialUsed.soulEldaFragments += costs[index]?.fragments || 0;
    } else if (core.stat_grade === 20) {
      // Fully maxed: calculate actual usage
      // (Implementation: see research.md for upgrade cost table)
      materialUsed.soulEldaFragments += calculateUpgradeCosts(core);
    }
    // Partial activations: deferred
  });

  return {
    activatedCount: activatedCores.length,
    totalAvailable: 3,
    materialUsed,
    averageGrade:
      activatedCores.length > 0
        ? activatedCores.reduce((sum, c) => sum + c.stat_grade, 0) /
          activatedCores.length
        : 0,
  };
}
```

### 4. Displaying Stat Cores

```jsx
// components/HexaMatrixProgress.js (simplified)
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

function HexaStatCoresTable({ cores }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Slot</TableCell>
          <TableCell>Main Stat</TableCell>
          <TableCell>Sub Stat 1</TableCell>
          <TableCell>Sub Stat 2</TableCell>
          <TableCell>Grade</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cores.map(core => (
          <TableRow key={core.slot_id}>
            <TableCell>{core.slot_id}</TableCell>
            <TableCell>
              {core.main_stat_name} (Lv {core.main_stat_level})
            </TableCell>
            <TableCell>
              {core.sub_stat_name_1} (Lv {core.sub_stat_level_1})
            </TableCell>
            <TableCell>
              {core.sub_stat_name_2} (Lv {core.sub_stat_level_2})
            </TableCell>
            <TableCell>{core.stat_grade}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Testing Strategy

### Unit Tests

```javascript
// __tests__/lib/hexaMatrixUtils.test.js
describe('filterHexaCoreSkills', () => {
  it('should filter level 0 cores when mastery count exceeds 4', () => {
    const data = [
      { hexa_core_type: '精通核心', hexa_core_level: 5 },
      { hexa_core_type: '精通核心', hexa_core_level: 0 },
      // ... 4+ mastery cores
    ];

    const filtered = filterHexaCoreSkills(data);

    expect(filtered.every(c => c.hexa_core_level > 0)).toBe(true);
  });

  it('should not filter when counts are valid', () => {
    const data = [
      { hexa_core_type: '精通核心', hexa_core_level: 0 },
      // ... only 3 mastery cores total
    ];

    const filtered = filterHexaCoreSkills(data);

    expect(filtered).toEqual(data);
  });
});
```

### Integration Tests

```javascript
// __tests__/integration/hexa-stat-integration.test.js
describe('Hexa Stat Integration', () => {
  it('should fetch, filter, and calculate progress', async () => {
    const ocid = 'test-ocid';

    // Fetch data
    const statCores = await fetchHexaStatCores(ocid);
    const hexaCores = await fetchHexaMatrix(ocid);

    // Filter
    const filteredCores = filterHexaCoreSkills(hexaCores);

    // Calculate
    const progress = calculateStatCoreProgress(statCores.cores);

    expect(progress.activatedCount).toBeGreaterThanOrEqual(0);
    expect(progress.totalAvailable).toBe(3);
  });
});
```

## Common Issues & Solutions

### Issue 1: CORS Error

**Problem**: API calls fail with CORS error in development

**Solution**: Next.js API routes handle CORS automatically. If calling directly from client, use `/api/hexa-matrix/` route instead.

### Issue 2: Null Stat Names

**Problem**: Unactivated cores have null stat names

**Solution**: Always check for null before displaying:

```javascript
{
  core.main_stat_name
    ? `${core.main_stat_name} (Lv ${core.main_stat_level})`
    : 'Unactivated';
}
```

### Issue 3: Cache Not Updating

**Problem**: Changes don't reflect after API update

**Solution**: Clear localStorage cache for testing:

```javascript
localStorage.removeItem(`hexa-stat-${ocid}`);
```

## Performance Tips

1. **Batch API calls**: Fetch skill and stat cores in parallel with `Promise.all()`
2. **Memoize calculations**: Use `useMemo` for expensive progress calculations
3. **Lazy render tables**: Only render stat cores when tab/section is visible

## Next Steps

1. Read [data-model.md](./data-model.md) for complete entity definitions
2. Check [contracts/hexa-matrix-stat-api.md](./contracts/hexa-matrix-stat-api.md) for API details
3. Review [research.md](./research.md) for detailed rationale

## Getting Help

- Check existing tests for usage examples
- Review Material-UI table documentation for styling
- See previous hexa matrix implementation for patterns

---

**Ready to implement?** Start with Phase 1 (Data Layer) and write tests as you go!
