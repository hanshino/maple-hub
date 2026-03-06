# Character Data Tabs UI/UX Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign CharacterDataTabs and all 6 child panels for consistent UX, responsive layout, and accessible interaction patterns.

**Architecture:** Create 3 shared state components (PanelSkeleton, PanelError, PanelEmpty), restyle tab bar as pill tray, then update each panel component individually. Each panel gets the section header motif, shared state components, and panel-specific layout improvements.

**Tech Stack:** Next.js 15, React 19, MUI 7 (sx props only), Jest 30 + React Testing Library

---

### Task 1: Create shared panel state components

**Files:**

- Create: `components/panel/PanelSkeleton.js`
- Create: `components/panel/PanelError.js`
- Create: `components/panel/PanelEmpty.js`
- Create: `components/panel/SectionHeader.js`
- Create: `__tests__/components/panel/PanelComponents.test.js`

**Context:** These 4 components are used by ALL 6 panels. They must be built first because every subsequent task depends on them.

**Step 1: Write the tests**

```javascript
// __tests__/components/panel/PanelComponents.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PanelSkeleton from '../../../components/panel/PanelSkeleton';
import PanelError from '../../../components/panel/PanelError';
import PanelEmpty from '../../../components/panel/PanelEmpty';
import SectionHeader from '../../../components/panel/SectionHeader';

describe('PanelSkeleton', () => {
  it('renders default 4 skeleton rows', () => {
    const { container } = render(<PanelSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBe(4);
  });

  it('renders custom row count', () => {
    const { container } = render(<PanelSkeleton rows={6} />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBe(6);
  });

  it('has aria-busy attribute on container', () => {
    const { container } = render(<PanelSkeleton />);
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
  });
});

describe('PanelError', () => {
  it('renders error message', () => {
    render(<PanelError message="無法載入能力值，請稍後再試" />);
    expect(screen.getByText('無法載入能力值，請稍後再試')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = jest.fn();
    render(<PanelError message="Error" onRetry={onRetry} />);
    expect(screen.getByText('重新載入')).toBeInTheDocument();
  });

  it('calls onRetry when button clicked', async () => {
    const onRetry = jest.fn();
    render(<PanelError message="Error" onRetry={onRetry} />);
    await userEvent.click(screen.getByText('重新載入'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is null', () => {
    render(<PanelError message="Error" />);
    expect(screen.queryByText('重新載入')).not.toBeInTheDocument();
  });
});

describe('PanelEmpty', () => {
  it('renders empty message', () => {
    render(<PanelEmpty message="尚無能力值資料" />);
    expect(screen.getByText('尚無能力值資料')).toBeInTheDocument();
  });
});

describe('SectionHeader', () => {
  it('renders description text', () => {
    render(<SectionHeader description="角色最終能力值，包含所有加成來源" />);
    expect(
      screen.getByText('角色最終能力值，包含所有加成來源')
    ).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="__tests__/components/panel/PanelComponents" --no-coverage`
Expected: FAIL — modules not found

**Step 3: Implement the 4 components**

```javascript
// components/panel/PanelSkeleton.js
'use client';

import { Box, Skeleton } from '@mui/material';

const PanelSkeleton = ({ rows = 4 }) => (
  <Box
    sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1 }}
    aria-busy="true"
  >
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton
        key={i}
        variant="rectangular"
        height={44}
        sx={{ borderRadius: 1 }}
      />
    ))}
  </Box>
);

export default PanelSkeleton;
```

```javascript
// components/panel/PanelError.js
'use client';

import { Box, Typography, Button } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const PanelError = ({ message, onRetry }) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <WarningAmberIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
    {onRetry && (
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={onRetry}
        sx={{ mt: 2 }}
      >
        重新載入
      </Button>
    )}
  </Box>
);

export default PanelError;
```

```javascript
// components/panel/PanelEmpty.js
'use client';

import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

const PanelEmpty = ({ message }) => (
  <Box sx={{ py: 6, textAlign: 'center' }}>
    <InboxIcon
      sx={{
        fontSize: 48,
        color: theme => theme.palette.text.secondary,
        opacity: 0.4,
        mb: 1.5,
      }}
    />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

export default PanelEmpty;
```

```javascript
// components/panel/SectionHeader.js
'use client';

import { Box, Typography } from '@mui/material';

const SectionHeader = ({ description }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
    <Box
      sx={{
        width: 3,
        height: 20,
        bgcolor: 'primary.main',
        borderRadius: 1,
        flexShrink: 0,
      }}
    />
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ fontStyle: 'italic' }}
    >
      {description}
    </Typography>
  </Box>
);

export default SectionHeader;
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="__tests__/components/panel/PanelComponents" --no-coverage`
Expected: PASS — all 8 tests

**Step 5: Commit**

```bash
git add components/panel/ __tests__/components/panel/
git commit -m "feat: add shared panel state components (PanelSkeleton, PanelError, PanelEmpty, SectionHeader)"
```

---

### Task 2: Restyle CharacterDataTabs tab bar + add retry wiring

**Files:**

- Modify: `components/CharacterDataTabs.js`
- Modify: `__tests__/components/CharacterDataTabs.test.js`

**Context:** The tab bar currently uses plain MUI Tabs. This task adds the pill-tray styling, ARIA attributes, and wires retry callbacks for 3 panels that currently lack them (UnionRaider, HyperStat, UnionArtifact).

**Step 1: Update the test file**

Add these tests to the existing `describe('CharacterDataTabs')` block in `__tests__/components/CharacterDataTabs.test.js`:

```javascript
it('should have tabpanel role on content area', () => {
  render(<CharacterDataTabs {...defaultProps} />);
  const panel = screen.getByRole('tabpanel');
  expect(panel).toBeInTheDocument();
  expect(panel).toHaveAttribute('id', 'char-tabpanel-0');
});

it('should have correct aria-controls on tabs', () => {
  render(<CharacterDataTabs {...defaultProps} />);
  const tabs = screen.getAllByRole('tab');
  expect(tabs[0]).toHaveAttribute('aria-controls', 'char-tabpanel-0');
});
```

**Step 2: Run tests to verify new tests fail**

Run: `npm test -- --testPathPattern="__tests__/components/CharacterDataTabs" --no-coverage`
Expected: 2 new tests FAIL

**Step 3: Implement tab bar redesign**

In `components/CharacterDataTabs.js`, make these changes:

1. Add `import { alpha } from '@mui/material/styles';` at top

2. Replace the `<Tabs>` block (lines ~163-176) with pill-tray styling:

```javascript
<Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 0.5, mb: 2 }}>
  <Tabs
    value={activeTab}
    onChange={handleTabChange}
    variant="scrollable"
    scrollButtons="auto"
    aria-label="角色資料分頁"
    sx={{
      '& .MuiTabs-indicator': { display: 'none' },
      '& .MuiTab-root': {
        fontWeight: 600,
        minHeight: 40,
        py: 0.75,
        px: 2,
        borderRadius: '20px',
        transition: 'background-color 150ms ease',
        '&:hover:not(.Mui-selected)': {
          bgcolor: theme => alpha(theme.palette.primary.main, 0.06),
        },
      },
      '& .MuiTab-root.Mui-selected': {
        bgcolor: theme => alpha(theme.palette.primary.main, 0.12),
        borderRadius: '20px',
        color: 'primary.main',
        fontWeight: 700,
      },
    }}
  >
    <Tab label="能力值" id="char-tab-0" aria-controls="char-tabpanel-0" />
    <Tab label="聯盟戰地" id="char-tab-1" aria-controls="char-tabpanel-1" />
    <Tab label="極限屬性" id="char-tab-2" aria-controls="char-tabpanel-2" />
    <Tab label="套裝效果" id="char-tab-3" aria-controls="char-tabpanel-3" />
    <Tab label="聯盟神器" id="char-tab-4" aria-controls="char-tabpanel-4" />
    <Tab label="符文系統" id="char-tab-5" aria-controls="char-tabpanel-5" />
  </Tabs>
</Box>
```

3. Update the panel output Box:

```javascript
<Box
  role="tabpanel"
  id={`char-tabpanel-${activeTab}`}
  aria-labelledby={`char-tab-${activeTab}`}
  aria-live="polite"
  sx={{ mt: 2 }}
>
  {renderTabContent()}
</Box>
```

4. Add retry callbacks — add these 3 functions before `handleTabChange`:

```javascript
const retryUnionRaider = useCallback(() => {
  setUnionRaiderLoaded(false);
  fetchTabData(
    'union-raider',
    'union_raider',
    setUnionRaiderData,
    setUnionRaiderLoading,
    setUnionRaiderError,
    setUnionRaiderLoaded
  );
}, [fetchTabData]);

const retryHyperStat = useCallback(() => {
  setHyperStatLoaded(false);
  fetchTabData(
    'hyper-stat',
    'hyper_stat',
    setHyperStatData,
    setHyperStatLoading,
    setHyperStatError,
    setHyperStatLoaded
  );
}, [fetchTabData]);

const retryUnionArtifact = useCallback(() => {
  setUnionArtifactLoaded(false);
  fetchTabData(
    'union-artifact',
    'union_artifact',
    setUnionArtifactData,
    setUnionArtifactLoading,
    setUnionArtifactError,
    setUnionArtifactLoaded
  );
}, [fetchTabData]);
```

5. Pass `onRetry` to each panel in `renderTabContent`:

- `<UnionRaiderPanel ... onRetry={retryUnionRaider} />`
- `<HyperStatPanel ... onRetry={retryHyperStat} />`
- `<UnionArtifactPanel ... onRetry={retryUnionArtifact} />`

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="__tests__/components/CharacterDataTabs" --no-coverage`
Expected: PASS — all 6 tests

**Step 5: Commit**

```bash
git add components/CharacterDataTabs.js __tests__/components/CharacterDataTabs.test.js
git commit -m "feat: restyle tab bar as pill tray with ARIA attributes and retry wiring"
```

---

### Task 3: Redesign CharacterStats — responsive Grid + error/empty states

**Files:**

- Modify: `components/CharacterStats.js`
- Create: `__tests__/components/CharacterStats.test.js`

**Context:** CharacterStats currently uses a hard-coded 2-column `Table` layout that breaks on narrow screens and fails silently on errors. Replace with responsive `Grid` layout, add `PanelError`/`PanelEmpty`/`PanelSkeleton` usage, and add the section header.

**Step 1: Write the tests**

```javascript
// __tests__/components/CharacterStats.test.js
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock the fetch and cache
jest.mock('../../lib/cache', () => ({
  getCachedData: jest.fn(() => null),
  setCachedData: jest.fn(),
}));

// Mock panel components
jest.mock('../../components/panel/PanelSkeleton', () => {
  return function MockSkeleton() {
    return <div data-testid="panel-skeleton">Loading</div>;
  };
});
jest.mock('../../components/panel/PanelError', () => {
  return function MockError({ message }) {
    return <div data-testid="panel-error">{message}</div>;
  };
});
jest.mock('../../components/panel/PanelEmpty', () => {
  return function MockEmpty({ message }) {
    return <div data-testid="panel-empty">{message}</div>;
  };
});
jest.mock('../../components/panel/SectionHeader', () => {
  return function MockHeader({ description }) {
    return <div data-testid="section-header">{description}</div>;
  };
});

import CharacterStats from '../../components/CharacterStats';

const theme = createTheme();
const wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('CharacterStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows skeleton while loading', () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // never resolves
    render(<CharacterStats ocid="test" />, { wrapper });
    expect(screen.getByTestId('panel-skeleton')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500 }));
    render(<CharacterStats ocid="test" />, { wrapper });
    const error = await screen.findByTestId('panel-error');
    expect(error).toBeInTheDocument();
  });

  it('renders section header', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ final_stat: [] }),
      })
    );
    render(<CharacterStats ocid="test" />, { wrapper });
    const header = await screen.findByTestId('section-header');
    expect(header).toHaveTextContent('角色最終能力值，包含所有加成來源');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="__tests__/components/CharacterStats" --no-coverage`
Expected: FAIL — CharacterStats doesn't render PanelSkeleton/PanelError/SectionHeader yet

**Step 3: Rewrite CharacterStats**

Replace entire `components/CharacterStats.js`:

```javascript
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { processStatsData, formatStatValue } from '../lib/statsUtils';
import { getCachedData, setCachedData } from '../lib/cache';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const CharacterStats = ({ ocid }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cacheKey = `stats_${ocid}`;
      let data = getCachedData(cacheKey);

      if (!data) {
        const response = await fetch(`/api/character/stats?ocid=${ocid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats data');
        }
        data = await response.json();
        setCachedData(cacheKey, data);
      }

      const processed = processStatsData(data);
      setStats(processed);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError(err.message);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [ocid]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return <PanelSkeleton rows={6} />;
  }

  if (error) {
    return (
      <PanelError message="無法載入能力值，請稍後再試" onRetry={loadStats} />
    );
  }

  if (stats.length === 0) {
    return <PanelEmpty message="尚無能力值資料" />;
  }

  const coreStatsGroup1 = ['STR', 'DEX', 'INT', 'LUK', 'HP', 'MP'];
  const coreStatsGroup2 = [
    '星力',
    '神秘力量',
    '真實之力',
    '道具掉落率',
    '楓幣獲得量',
    '獲得額外經驗值',
  ];
  const hiddenStats = [
    '狀態異常耐性',
    '格擋',
    '防禦力',
    '移動速度',
    '跳躍力',
    '攻擊速度',
    '無視屬性耐性',
    '狀態異常追加傷害',
    '武器熟練度',
  ];

  const group1Data = stats.filter(s => coreStatsGroup1.includes(s.name));
  const group2Data = stats.filter(s => coreStatsGroup2.includes(s.name));
  const otherStats = stats.filter(
    s =>
      !coreStatsGroup1.includes(s.name) &&
      !coreStatsGroup2.includes(s.name) &&
      !hiddenStats.includes(s.name)
  );

  const renderStatGroup = (groupStats, key) => (
    <Box
      key={key}
      sx={{
        bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
        borderRadius: 2,
        p: 1.5,
        mb: 1.5,
      }}
    >
      <Grid container spacing={1}>
        {groupStats.map(stat => (
          <Grid key={stat.name} size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                px: 1.5,
                py: 0.75,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {stat.name}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: 'primary.main' }}
              >
                {formatStatValue(stat.value)}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="角色最終能力值，包含所有加成來源" />
      {group1Data.length > 0 && renderStatGroup(group1Data, 'group1')}
      {group2Data.length > 0 && renderStatGroup(group2Data, 'group2')}
      {otherStats.length > 0 && renderStatGroup(otherStats, 'group3')}
    </Box>
  );
};

export default CharacterStats;
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="__tests__/components/CharacterStats" --no-coverage`
Expected: PASS — all 3 tests

**Step 5: Commit**

```bash
git add components/CharacterStats.js __tests__/components/CharacterStats.test.js
git commit -m "refactor: CharacterStats responsive Grid layout with error/empty states"
```

---

### Task 4: Redesign HyperStatPanel — ToggleButtonGroup replaces nested Tabs

**Files:**

- Modify: `components/HyperStatPanel.js`
- Create: `__tests__/components/HyperStatPanel.test.js`

**Context:** HyperStatPanel currently has nested `Tabs` inside the outer CharacterDataTabs — a UX anti-pattern. Replace inner `Tabs` with `ToggleButtonGroup`. Add shared state components and section header.

**Step 1: Write the tests**

```javascript
// __tests__/components/HyperStatPanel.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HyperStatPanel from '../../components/HyperStatPanel';

jest.mock('../../components/panel/PanelSkeleton', () => {
  return function Mock() {
    return <div data-testid="panel-skeleton" />;
  };
});
jest.mock('../../components/panel/PanelError', () => {
  return function Mock({ message }) {
    return <div data-testid="panel-error">{message}</div>;
  };
});
jest.mock('../../components/panel/PanelEmpty', () => {
  return function Mock({ message }) {
    return <div data-testid="panel-empty">{message}</div>;
  };
});
jest.mock('../../components/panel/SectionHeader', () => {
  return function Mock() {
    return <div data-testid="section-header" />;
  };
});

const mockData = {
  use_preset_no: '2',
  hyper_stat_preset_1: [
    { stat_type: '力量', stat_level: 10, stat_increase: '+30,000' },
  ],
  hyper_stat_preset_2: [
    { stat_type: '敏捷', stat_level: 5, stat_increase: '+15,000' },
  ],
  hyper_stat_preset_3: [],
};

describe('HyperStatPanel', () => {
  it('shows skeleton when loading', () => {
    render(<HyperStatPanel loading={true} data={null} />);
    expect(screen.getByTestId('panel-skeleton')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<HyperStatPanel error="載入失敗" />);
    expect(screen.getByTestId('panel-error')).toBeInTheDocument();
  });

  it('renders ToggleButtonGroup instead of Tabs', () => {
    render(<HyperStatPanel data={mockData} />);
    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-label',
      '極限屬性預設選擇'
    );
  });

  it('shows 使用中 chip on active preset', () => {
    render(<HyperStatPanel data={mockData} />);
    expect(screen.getByText('使用中')).toBeInTheDocument();
  });

  it('switches preset on toggle button click', async () => {
    render(<HyperStatPanel data={mockData} />);
    await userEvent.click(screen.getByText('預設 1'));
    expect(screen.getByText('力量')).toBeInTheDocument();
  });

  it('shows empty message for preset with no stats', async () => {
    render(<HyperStatPanel data={mockData} />);
    await userEvent.click(screen.getByText('預設 3'));
    expect(screen.getByTestId('panel-empty')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="__tests__/components/HyperStatPanel" --no-coverage`
Expected: FAIL — HyperStatPanel still uses Tabs

**Step 3: Rewrite HyperStatPanel**

Replace entire `components/HyperStatPanel.js`:

```javascript
'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const HyperStatPanel = ({ loading, error, data, onRetry }) => {
  const [presetIndex, setPresetIndex] = useState(0);

  if (loading) return <PanelSkeleton rows={5} />;

  if (error) {
    return <PanelError message="無法載入極限屬性資料" onRetry={onRetry} />;
  }

  if (!data) return <PanelEmpty message="尚無極限屬性資料" />;

  const activePreset = data.use_preset_no ?? '1';
  const presets = [
    data.hyper_stat_preset_1 ?? [],
    data.hyper_stat_preset_2 ?? [],
    data.hyper_stat_preset_3 ?? [],
  ];

  const currentStats = (presets[presetIndex] ?? []).filter(
    s => s.stat_level > 0
  );

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="極限屬性各項目的等級與加成效果" />

      <ToggleButtonGroup
        value={presetIndex}
        exclusive
        onChange={(_, v) => v !== null && setPresetIndex(v)}
        size="small"
        sx={{ mb: 2 }}
        aria-label="極限屬性預設選擇"
      >
        {[0, 1, 2].map(i => (
          <ToggleButton
            key={i}
            value={i}
            sx={{ px: 2, borderRadius: '20px !important', gap: 0.5 }}
          >
            預設 {i + 1}
            {activePreset === String(i + 1) && (
              <Chip
                label="使用中"
                size="small"
                color="primary"
                sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {currentStats.length === 0 ? (
        <PanelEmpty message="此預設尚未設定極限屬性" />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table
            size="small"
            sx={{ '& .MuiTableCell-root': { border: 'none' } }}
          >
            <TableBody>
              {currentStats.map((stat, i) => (
                <TableRow
                  key={i}
                  sx={{
                    '&:hover': {
                      bgcolor: theme => `${theme.palette.primary.main}0a`,
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {stat.stat_type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`Lv.${stat.stat_level}`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: 'primary.main' }}
                    >
                      {stat.stat_increase}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default HyperStatPanel;
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="__tests__/components/HyperStatPanel" --no-coverage`
Expected: PASS — all 6 tests

**Step 5: Commit**

```bash
git add components/HyperStatPanel.js __tests__/components/HyperStatPanel.test.js
git commit -m "refactor: HyperStatPanel replace nested Tabs with ToggleButtonGroup"
```

---

### Task 5: Redesign UnionRaiderPanel — Chip flow layout

**Files:**

- Modify: `components/UnionRaiderPanel.js`

**Context:** Replace the vertical table list with a wrapping Chip flow. Add shared state components and section header.

**Step 1: Rewrite UnionRaiderPanel**

Replace entire `components/UnionRaiderPanel.js`:

```javascript
'use client';

import { Box, Chip } from '@mui/material';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const UnionRaiderPanel = ({ loading, error, data, onRetry }) => {
  if (loading) return <PanelSkeleton rows={4} />;

  if (error) {
    return <PanelError message="無法載入聯盟戰地資料" onRetry={onRetry} />;
  }

  const stats = data?.union_raider_stat ?? [];

  if (stats.length === 0) {
    return <PanelEmpty message="尚無聯盟戰地資料" />;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="聯盟戰地格子所提供的能力值加成" />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 1 }}>
        {stats.map((stat, i) => (
          <Chip
            key={i}
            label={stat}
            size="small"
            variant="outlined"
            sx={{
              borderColor: 'primary.light',
              color: 'text.primary',
              fontWeight: 600,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default UnionRaiderPanel;
```

**Step 2: Run existing tests + build**

Run: `npm test -- --testPathPattern="CharacterDataTabs" --no-coverage && npm run build`
Expected: PASS — existing integration tests still work

**Step 3: Commit**

```bash
git add components/UnionRaiderPanel.js
git commit -m "refactor: UnionRaiderPanel use Chip flow layout with shared state components"
```

---

### Task 6: Redesign SetEffectPanel — filled Chip + left-border accent effects

**Files:**

- Modify: `components/SetEffectPanel.js`

**Context:** Minor polish: change Chip from outlined to filled, add left-border accent on effects, sort by total_set_count descending, use shared components.

**Step 1: Rewrite SetEffectPanel**

Replace entire `components/SetEffectPanel.js`:

```javascript
'use client';

import {
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const SetEffectPanel = ({ loading, error, data, onRetry }) => {
  if (loading) return <PanelSkeleton rows={4} />;

  if (error) {
    return <PanelError message="無法載入套裝效果資料" onRetry={onRetry} />;
  }

  const sets = data?.set_effect ?? [];

  if (sets.length === 0) {
    return <PanelEmpty message="尚無套裝效果資料" />;
  }

  const sortedSets = [...sets].sort(
    (a, b) => b.total_set_count - a.total_set_count
  );

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="目前裝備的套裝組合與生效的套裝效果" />
      {sortedSets.map((set, i) => {
        const activeEffects = (set.set_effect_info ?? []).filter(
          e => e.set_count <= set.total_set_count
        );
        return (
          <Accordion key={i} defaultExpanded={false} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {set.set_name}
                </Typography>
                <Chip
                  label={`${set.total_set_count}件`}
                  size="small"
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {activeEffects.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  此套裝目前無生效的效果
                </Typography>
              ) : (
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}
                >
                  {activeEffects.map((effect, j) => (
                    <Box
                      key={j}
                      sx={{
                        pl: 1.5,
                        borderLeft: '2px solid',
                        borderColor: 'primary.light',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: 'text.secondary' }}
                      >
                        {effect.set_count}件
                      </Typography>
                      <Typography variant="body2">
                        {effect.set_option}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default SetEffectPanel;
```

**Step 2: Run build to verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/SetEffectPanel.js
git commit -m "refactor: SetEffectPanel filled Chip, left-border accent, descending sort"
```

---

### Task 7: Redesign UnionArtifactPanel — crystal card grid + all 3 options

**Files:**

- Modify: `components/UnionArtifactPanel.js`

**Context:** Replace the flat table with a responsive card grid for crystals, showing all 3 crystal options. Effects section uses a flex list. Add shared components.

**Step 1: Rewrite UnionArtifactPanel**

Replace entire `components/UnionArtifactPanel.js`:

```javascript
'use client';

import { Box, Typography, Chip, Grid, Paper } from '@mui/material';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const SectionTitle = ({ children }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 1 }}>
    <Box
      sx={{
        width: 3,
        height: 16,
        bgcolor: 'primary.main',
        borderRadius: 1,
        flexShrink: 0,
      }}
    />
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
      {children}
    </Typography>
  </Box>
);

const UnionArtifactPanel = ({ loading, error, data, onRetry }) => {
  if (loading) return <PanelSkeleton rows={4} />;

  if (error) {
    return <PanelError message="無法載入聯盟神器資料" onRetry={onRetry} />;
  }

  const crystals = data?.union_artifact_crystal ?? [];
  const effects = data?.union_artifact_effect ?? [];

  if (crystals.length === 0 && effects.length === 0) {
    return <PanelEmpty message="尚無聯盟神器資料" />;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="聯盟神器水晶與效果等級" />

      {crystals.length > 0 && (
        <>
          <SectionTitle>水晶</SectionTitle>
          <Grid container spacing={1.5}>
            {crystals.map((crystal, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {crystal.name}
                    </Typography>
                    <Chip
                      label={`Lv.${crystal.level}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  </Box>
                  {crystal.crystal_option_name_1 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {crystal.crystal_option_name_1}
                    </Typography>
                  )}
                  {crystal.crystal_option_name_2 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {crystal.crystal_option_name_2}
                    </Typography>
                  )}
                  {crystal.crystal_option_name_3 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {crystal.crystal_option_name_3}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {crystals.length > 0 && effects.length > 0 && <Box sx={{ height: 8 }} />}

      {effects.length > 0 && (
        <>
          <SectionTitle>效果</SectionTitle>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {effects.map((effect, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  px: 1,
                  py: 0.5,
                  '&:hover': {
                    bgcolor: theme => `${theme.palette.primary.main}0a`,
                  },
                }}
              >
                <Typography variant="body2">{effect.name}</Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: 'primary.main' }}
                >
                  Lv.{effect.level}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default UnionArtifactPanel;
```

**Step 2: Run build to verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/UnionArtifactPanel.js
git commit -m "refactor: UnionArtifactPanel crystal card grid with all 3 options"
```

---

### Task 8: Redesign RuneSystems — ToggleButtonGroup + RuneCard horizontal layout

**Files:**

- Modify: `components/runes/RuneSystems.js`
- Modify: `components/runes/RuneCard.js`

**Context:** Replace nested Tabs with ToggleButtonGroup. Fix empty state to Chinese. Restyle RuneCard to horizontal layout. Replace dumb grey skeleton boxes with shaped skeletons.

**Step 1: Rewrite RuneSystems**

Replace entire `components/runes/RuneSystems.js`:

```javascript
import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';
import RuneCard from './RuneCard';
import { filterRunesByType } from '../../lib/runeUtils';
import PanelEmpty from '../panel/PanelEmpty';
import SectionHeader from '../panel/SectionHeader';

const RUNE_TYPES = [
  { key: 'secret', label: '祕法符文' },
  { key: 'true', label: '真實符文' },
  { key: 'luxury', label: '豪華真實符文' },
];

const RuneCardSkeleton = () => (
  <Card sx={{ borderRadius: 2 }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
        <Skeleton variant="rounded" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
        </Box>
      </Box>
      <Skeleton variant="rounded" height={6} sx={{ borderRadius: 3 }} />
    </CardContent>
  </Card>
);

export default function RuneSystems({ runes }) {
  const filteredRunes = useMemo(
    () => ({
      secret: filterRunesByType(runes, 'secret'),
      true: filterRunesByType(runes, 'true'),
      luxury: filterRunesByType(runes, 'luxury'),
    }),
    [runes]
  );

  const availableTypes = useMemo(
    () => RUNE_TYPES.filter(({ key }) => filteredRunes[key].length > 0),
    [filteredRunes]
  );

  const [activeTypeKey, setActiveTypeKey] = useState(
    availableTypes[0]?.key ?? 'secret'
  );

  if (availableTypes.length === 0) {
    return <PanelEmpty message="尚無符文系統資料" />;
  }

  const currentRunes = filteredRunes[activeTypeKey] ?? [];

  return (
    <Box sx={{ mt: 1 }} role="region" aria-label="符文系統">
      <SectionHeader description="各地區符文目前等級與升級所需經驗" />

      {availableTypes.length > 1 && (
        <ToggleButtonGroup
          value={activeTypeKey}
          exclusive
          onChange={(_, v) => v !== null && setActiveTypeKey(v)}
          size="small"
          sx={{ mb: 2, flexWrap: 'wrap' }}
          aria-label="符文類型選擇"
        >
          {availableTypes.map(({ key, label }) => (
            <ToggleButton
              key={key}
              value={key}
              sx={{ px: 2, borderRadius: '20px !important' }}
            >
              {label} ({filteredRunes[key].length})
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}

      <Grid container spacing={1.5}>
        {currentRunes.map(rune => (
          <Grid key={rune.symbol_name} size={{ xs: 12, sm: 6, md: 4 }}>
            <RuneCard rune={rune} />
          </Grid>
        ))}
        {Array.from({ length: Math.max(0, 6 - currentRunes.length) }).map(
          (_, i) => (
            <Grid key={`skeleton-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
              <RuneCardSkeleton />
            </Grid>
          )
        )}
      </Grid>
    </Box>
  );
}
```

**Step 2: Rewrite RuneCard to horizontal layout**

Replace entire `components/runes/RuneCard.js`:

```javascript
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { calculateRuneProgress, getMaxLevel } from '../../lib/runeUtils';

export default function RuneCard({ rune }) {
  const progress = calculateRuneProgress(rune);

  return (
    <Card
      sx={{ borderRadius: 2, overflow: 'hidden' }}
      role="article"
      aria-label={`${rune.symbol_name} 符文卡片`}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={rune.symbol_icon}
              alt={rune.symbol_name}
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain',
              }}
              onError={e => {
                e.target.src = '/placeholder-rune.png';
              }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {rune.symbol_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lv.{rune.symbol_level} / {getMaxLevel(rune)} | 力量:{' '}
              {rune.symbol_force}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: theme => alpha(theme.palette.primary.main, 0.15),
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main',
              },
            }}
            aria-label={`升級進度: ${progress.toFixed(1)}%`}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'right', mt: 0.25 }}
          >
            {progress.toFixed(1)}%
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Run tests + build**

Run: `npm test -- --no-coverage && npm run build`
Expected: Tests pass, build succeeds

**Step 4: Commit**

```bash
git add components/runes/RuneSystems.js components/runes/RuneCard.js
git commit -m "refactor: RuneSystems ToggleButtonGroup + RuneCard horizontal layout"
```

---

### Task 9: Final verification and cleanup

**Files:**

- All modified files from Tasks 1-8

**Step 1: Run full test suite**

Run: `npm test -- --no-coverage`
Expected: No new test failures (pre-existing failures are acceptable)

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Run lint**

Run: `npm run lint`
Expected: No new lint errors

**Step 4: Visual spot check**

Run: `npm run dev`
Expected: Verify in browser at `http://localhost:3000`:

- Tab bar shows pill styling with orange highlight on active tab
- Each panel shows section header with orange left-border accent
- CharacterStats uses Grid layout (responsive on resize)
- HyperStatPanel has ToggleButtonGroup (not nested tabs)
- UnionRaider shows Chips
- SetEffect Accordion has filled orange Chip badges
- UnionArtifact crystals are in a card grid
- RuneSystems has ToggleButtonGroup, horizontal RuneCards
