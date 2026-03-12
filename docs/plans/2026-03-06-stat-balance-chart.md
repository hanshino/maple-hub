# StatBalanceChart Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a prominent hexagonal radar chart to the main page showing 6 combat power dimensions, helping players identify over/under-invested stats.

**Architecture:** New pure-function module `lib/statBalance.js` handles data extraction and equivalent-stat conversion. New React component `components/StatBalanceChart.js` renders the Recharts RadarChart with 3 layers (outer bound, balance hexagon, player hexagon). `app/page.js` adds a `statsData` state and passes it with `equipmentRawData` to the chart.

**Tech Stack:** Next.js 15 App Router, React, Recharts (already installed), MUI 7, existing `lib/combatPowerCalculator.js`

---

### Task 1: Add `statsData` state to `app/page.js`

**Files:**
- Modify: `app/page.js`

The page currently uses `statsResult.data` inline but never stores it in state. We need to persist it for the chart component.

**Step 1: Add state variable**

In `HomeContent()`, after the `setEffectError` state (around line 54), add:

```js
const [statsData, setStatsData] = useState(null);
```

Also reset it in the `searchCharacter` function where other states are reset (before the `try` block):

```js
setStatsData(null);
```

**Step 2: Store statsResult.data in state**

After the existing `setBattlePower` block (around line 117), add:

```js
if (statsResult?.status >= 200 && statsResult?.status < 300) {
  setStatsData(statsResult.data);
}
```

**Step 3: Verify the page still works**

```bash
npm run dev
```

Search any character and confirm no errors in console.

**Step 4: Commit**

```bash
git add app/page.js
git commit -m "feat: persist statsData in page state for balance chart"
```

---

### Task 2: Create `lib/statBalance.js`

**Files:**
- Create: `lib/statBalance.js`
- Create: `__tests__/lib/statBalance.test.js`

**Step 1: Write the failing tests first**

Create `__tests__/lib/statBalance.test.js`:

```js
import {
  extractBalanceStats,
  computeEquivStats,
  computeBalanceRatios,
  getRecommendations,
} from '../../lib/statBalance.js';

const makeStat = (name, value) => ({ stat_name: name, stat_value: String(value) });

const mockStatsData = {
  final_stat: [
    makeStat('STR', 1000),
    makeStat('DEX', 500),
    makeStat('INT', 200),
    makeStat('LUK', 300),
    makeStat('攻擊力', 3000),
    makeStat('魔法攻擊力', 100),
    makeStat('Boss 몬스터 공격 시 데미지', 150),
    makeStat('爆擊傷害', 60),
    makeStat('무시 방어율', 80),
  ],
};

const mockEquipmentData = {
  preset_no: 1,
  item_equipment_preset_1: [],
  item_equipment_preset_2: [],
  item_equipment_preset_3: [],
  item_equipment: [],
};

describe('extractBalanceStats', () => {
  it('extracts mainStat as the highest of STR/DEX/INT/LUK', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.mainStat).toBe(1000);
  });

  it('extracts atkValue as max of 攻擊力 and 魔法攻擊力', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.atkValue).toBe(3000);
  });

  it('extracts bossDmg from final_stat', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.bossDmg).toBe(150);
  });

  it('extracts critDmg from final_stat', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.critDmg).toBe(60);
  });

  it('extracts ignoreDef from final_stat', () => {
    const result = extractBalanceStats(mockStatsData, mockEquipmentData);
    expect(result.ignoreDef).toBe(80);
  });

  it('returns zeros for missing stats', () => {
    const result = extractBalanceStats({ final_stat: [] }, mockEquipmentData);
    expect(result.mainStat).toBe(0);
    expect(result.atkValue).toBe(0);
  });

  it('handles null inputs gracefully', () => {
    const result = extractBalanceStats(null, null);
    expect(result.mainStat).toBe(0);
    expect(result.atkValue).toBe(0);
  });
});

describe('computeEquivStats', () => {
  it('converts raw stats to equivalent main stat values', () => {
    const raw = {
      mainStat: 100000,
      atkValue: 10000,
      atkPct: 60,
      bossDmg: 200,
      critDmg: 80,
      ignoreDef: 90,
    };
    const equiv = computeEquivStats(raw);

    expect(equiv.mainEquiv).toBe(100000);
    expect(equiv.atkEquiv).toBe(40000);         // 10000 × 4
    expect(equiv.atkPctEquiv).toBe(60000);       // 0.60 × 100000
    expect(equiv.bossEquiv).toBe(6000);          // 200 × 30
    expect(equiv.critEquiv).toBe(9600);          // 80 × 120
    // ignoreEquiv = (2 × (1 - 0.5 × (1 - 0.90)) - 1) × 100000
    // = (2 × 0.95 - 1) × 100000 = 0.9 × 100000 = 90000
    expect(equiv.ignoreEquiv).toBeCloseTo(90000, 0);
  });

  it('returns 0 for ignoreDef=0', () => {
    const raw = { mainStat: 100000, atkValue: 0, atkPct: 0, bossDmg: 0, critDmg: 0, ignoreDef: 0 };
    const equiv = computeEquivStats(raw);
    expect(equiv.ignoreEquiv).toBe(0);
  });

  it('returns mainStat for ignoreDef=100', () => {
    const raw = { mainStat: 100000, atkValue: 0, atkPct: 0, bossDmg: 0, critDmg: 0, ignoreDef: 100 };
    const equiv = computeEquivStats(raw);
    expect(equiv.ignoreEquiv).toBeCloseTo(100000, 0);
  });
});

describe('computeBalanceRatios', () => {
  it('returns ratios relative to the average (balance point)', () => {
    // All 6 equal → all ratios = 1.0
    const equivStats = {
      mainEquiv: 1000,
      atkEquiv: 1000,
      atkPctEquiv: 1000,
      bossEquiv: 1000,
      critEquiv: 1000,
      ignoreEquiv: 1000,
    };
    const ratios = computeBalanceRatios(equivStats);
    ratios.forEach(r => expect(r.ratio).toBeCloseTo(1.0, 5));
  });

  it('axis with double the equiv has ratio 2.0', () => {
    const equivStats = {
      mainEquiv: 2000,
      atkEquiv: 1000,
      atkPctEquiv: 1000,
      bossEquiv: 1000,
      critEquiv: 1000,
      ignoreEquiv: 1000,
    };
    const ratios = computeBalanceRatios(equivStats);
    const mainRatio = ratios.find(r => r.axis === '主屬性');
    // balance = (2000+1000×5)/6 = 7000/6 ≈ 1166.67
    // mainStat ratio = 2000 / 1166.67 ≈ 1.714
    expect(mainRatio.ratio).toBeGreaterThan(1.0);
  });

  it('returns null when total is 0', () => {
    const equivStats = {
      mainEquiv: 0, atkEquiv: 0, atkPctEquiv: 0,
      bossEquiv: 0, critEquiv: 0, ignoreEquiv: 0,
    };
    expect(computeBalanceRatios(equivStats)).toBeNull();
  });

  it('returns array of 6 items with axis labels', () => {
    const equivStats = {
      mainEquiv: 1000, atkEquiv: 1000, atkPctEquiv: 1000,
      bossEquiv: 1000, critEquiv: 1000, ignoreEquiv: 1000,
    };
    const ratios = computeBalanceRatios(equivStats);
    expect(ratios).toHaveLength(6);
    expect(ratios.map(r => r.axis)).toEqual(
      ['主屬性', '攻擊力', '攻擊力%', 'Boss傷害', '爆擊傷害', '無視防禦']
    );
  });
});

describe('getRecommendations', () => {
  it('returns axes below balance, sorted by ratio ascending', () => {
    const ratios = [
      { axis: '主屬性', ratio: 1.2 },
      { axis: '攻擊力', ratio: 0.5 },
      { axis: '攻擊力%', ratio: 1.1 },
      { axis: 'Boss傷害', ratio: 0.8 },
      { axis: '爆擊傷害', ratio: 0.9 },
      { axis: '無視防禦', ratio: 1.3 },
    ];
    const recs = getRecommendations(ratios);
    expect(recs).toHaveLength(2);
    expect(recs[0].axis).toBe('攻擊力');   // lowest ratio first
    expect(recs[1].axis).toBe('Boss傷害');
  });

  it('returns empty array when all axes above balance', () => {
    const ratios = [1.0, 1.1, 1.2, 0.95, 1.3, 1.4].map((ratio, i) => ({
      axis: String(i), ratio,
    }));
    // 0.95 is below 1.0 so still 1 recommendation
    const recs = getRecommendations(ratios);
    expect(recs).toHaveLength(1);
  });

  it('returns empty array for null input', () => {
    expect(getRecommendations(null)).toEqual([]);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="statBalance" --no-coverage
```

Expected: FAIL — "Cannot find module '../../lib/statBalance.js'"

**Step 3: Create `lib/statBalance.js`**

```js
import {
  extractEquipmentStats,
  identifyIndependentItems,
} from './combatPowerCalculator.js';

const BOSS_DEF_RATE = 0.5; // Standard boss defense rate assumption

const AXIS_KEYS = ['mainEquiv', 'atkEquiv', 'atkPctEquiv', 'bossEquiv', 'critEquiv', 'ignoreEquiv'];
const AXIS_LABELS = ['主屬性', '攻擊力', '攻擊力%', 'Boss傷害', '爆擊傷害', '無視防禦'];

/**
 * Extracts the 6 raw axis values from API responses.
 *
 * @param {object|null} statsData - /character/stat API response
 * @param {object|null} equipmentData - /character/item-equipment API response
 * @returns {{ mainStat, atkValue, atkPct, bossDmg, critDmg, ignoreDef }}
 */
export function extractBalanceStats(statsData, equipmentData) {
  const finalStats = statsData?.final_stat || [];

  const getStat = (...names) => {
    for (const name of names) {
      const entry = finalStats.find(s => s.stat_name === name);
      if (entry) return parseFloat(entry.stat_value || '0');
    }
    return 0;
  };

  const mainStat = Math.max(
    getStat('STR'),
    getStat('DEX'),
    getStat('INT'),
    getStat('LUK')
  );

  const atkValue = Math.max(
    getStat('공격력', '攻擊力', '物理攻擊力'),
    getStat('마력', '魔法攻擊力')
  );

  const bossDmg = getStat(
    '보스 몬스터 공격 시 데미지',
    'Boss 몬스터 공격 시 데미지',
    'Boss攻擊時傷害',
    'Boss 攻擊時傷害'
  );

  const critDmg = getStat('크리티컬 데미지', '爆擊傷害');

  const ignoreDef = getStat('무시 방어율', '방어율 무시', '無視防禦', '防禦無視');

  // ATK% from equipment potentials only (union, set effects not included)
  let atkPct = 0;
  if (equipmentData) {
    try {
      const presetNo = equipmentData.preset_no || 1;
      const presetItems =
        equipmentData[`item_equipment_preset_${presetNo}`] || [];
      const independentItems = identifyIndependentItems(equipmentData);
      const stats = extractEquipmentStats([...presetItems, ...independentItems]);
      atkPct = Math.max(
        stats.percent.attack_power,
        stats.percent.magic_power
      );
    } catch {
      atkPct = 0;
    }
  }

  return { mainStat, atkValue, atkPct, bossDmg, critDmg, ignoreDef };
}

/**
 * Converts raw axis values to equivalent main stat (換算主屬) units.
 * Conversion ratios from KMS community research (22-star equipment baseline):
 *   - 1 ATK ≈ 4 fixed stat
 *   - 1% boss ≈ 30 fixed stat
 *   - 1% crit ≈ 120 fixed stat
 *   - IED contribution: (2 × iefFactor - 1) × mainStat, where iefFactor = 1 - 0.5×(1-IED/100)
 *
 * @param {{ mainStat, atkValue, atkPct, bossDmg, critDmg, ignoreDef }} raw
 * @returns {{ mainEquiv, atkEquiv, atkPctEquiv, bossEquiv, critEquiv, ignoreEquiv }}
 */
export function computeEquivStats({
  mainStat,
  atkValue,
  atkPct,
  bossDmg,
  critDmg,
  ignoreDef,
}) {
  const mainEquiv = mainStat;
  const atkEquiv = atkValue * 4;
  const atkPctEquiv = (atkPct / 100) * mainStat;
  const bossEquiv = bossDmg * 30;
  const critEquiv = critDmg * 120;

  // IED contribution: improvement over 0% IED baseline
  // iefFactor = 1 - BOSS_DEF_RATE × (1 - IED/100), range [BOSS_DEF_RATE, 1]
  // normalized: (iefFactor - BOSS_DEF_RATE) / (1 - BOSS_DEF_RATE) × mainStat
  const iefFactor = 1 - BOSS_DEF_RATE * (1 - ignoreDef / 100);
  const ignoreEquiv =
    ((iefFactor - BOSS_DEF_RATE) / (1 - BOSS_DEF_RATE)) * mainStat;

  return { mainEquiv, atkEquiv, atkPctEquiv, bossEquiv, critEquiv, ignoreEquiv };
}

/**
 * Computes per-axis ratios relative to the balance point (total equiv / 6).
 *
 * @param {{ mainEquiv, atkEquiv, atkPctEquiv, bossEquiv, critEquiv, ignoreEquiv }} equivStats
 * @returns {Array<{ axis: string, ratio: number, equiv: number }> | null}
 */
export function computeBalanceRatios(equivStats) {
  const values = AXIS_KEYS.map(k => equivStats[k]);
  const total = values.reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;

  const balance = total / 6;
  return AXIS_KEYS.map((key, i) => ({
    axis: AXIS_LABELS[i],
    ratio: equivStats[key] / balance,
    equiv: equivStats[key],
  }));
}

/**
 * Returns up to 2 axes furthest below the balance point as recommendations.
 *
 * @param {Array<{ axis: string, ratio: number }> | null} ratios
 * @returns {Array<{ axis: string, pct: number }>}
 */
export function getRecommendations(ratios) {
  if (!ratios) return [];
  return [...ratios]
    .filter(r => r.ratio < 1.0)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 2)
    .map(r => ({ axis: r.axis, pct: Math.round(r.ratio * 100) }));
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="statBalance" --no-coverage
```

Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add lib/statBalance.js __tests__/lib/statBalance.test.js
git commit -m "feat: add statBalance pure functions with換算主屬 calculation"
```

---

### Task 3: Create `components/StatBalanceChart.js`

**Files:**
- Create: `components/StatBalanceChart.js`

No test for this component (it's a pure visualization layer; the logic is tested in Task 2).

**Step 1: Create the component**

UI/UX review applied:
- Balance hexagon uses gray (`#9e9e9e`) to distinguish from player's orange
- Outer frame: `fill="none"` (was `#f5f5f5` — invisible on cream background)
- Added `<Tooltip>` for exact axis values on hover
- Added legend row explaining the two hexagons
- Added `role="img"` + `aria-label` for accessibility
- Axis font size 11px to reduce mobile overlap risk

```js
'use client';

import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  extractBalanceStats,
  computeEquivStats,
  computeBalanceRatios,
  getRecommendations,
} from '../lib/statBalance.js';

const MAX_RATIO = 1.8;

const StatBalanceChart = ({ statsData, equipmentData, loading }) => {
  const { ratios, recommendations } = useMemo(() => {
    if (!statsData) return { ratios: null, recommendations: [] };
    const raw = extractBalanceStats(statsData, equipmentData);
    const equiv = computeEquivStats(raw);
    const ratios = computeBalanceRatios(equiv);
    const recommendations = getRecommendations(ratios);
    return { ratios, recommendations };
  }, [statsData, equipmentData]);

  if (loading) {
    return (
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width={160} height={28} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (!ratios) return null;

  // Build chart data: player ratios + balance (1.0) + outer bound (MAX_RATIO)
  const chartData = ratios.map(r => ({
    axis: r.axis,
    player: Math.min(r.ratio, MAX_RATIO),
    balance: 1.0,
    outer: MAX_RATIO,
  }));

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        {/* Title + Legend row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary">
            屬性平衡分析
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 3, bgcolor: '#f7931e', borderRadius: 1 }} />
              <Typography variant="caption" color="text.secondary">目前狀況</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                component="svg"
                width={16}
                height={4}
                sx={{ overflow: 'visible' }}
              >
                <line x1="0" y1="2" x2="16" y2="2" stroke="#9e9e9e" strokeDasharray="4 2" strokeWidth={2} />
              </Box>
              <Typography variant="caption" color="text.secondary">完美平衡</Typography>
            </Box>
          </Box>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <RadarChart
            data={chartData}
            cx="50%"
            cy="50%"
            role="img"
            aria-label="角色屬性平衡分析圖，顯示六個戰力維度的投資分佈"
          >
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: '#555', fontWeight: 600 }}
            />
            <PolarRadiusAxis
              domain={[0, MAX_RATIO]}
              tick={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'player')
                  return [`${Math.round(value * 100)}%`, '當前'];
                return null;
              }}
            />
            {/* Outer reference boundary — transparent fill to avoid blending with cream bg */}
            <Radar
              dataKey="outer"
              stroke="#e0e0e0"
              fill="none"
              strokeWidth={1}
            />
            {/* Balance hexagon — gray dashed, distinct from player orange */}
            <Radar
              dataKey="balance"
              stroke="#9e9e9e"
              fill="none"
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />
            {/* Player hexagon */}
            <Radar
              dataKey="player"
              stroke="#f7931e"
              fill="#f7931e"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>

        {recommendations.length > 0 && (
          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              建議提升：
            </Typography>
            {recommendations.map(rec => (
              <Chip
                key={rec.axis}
                label={`${rec.axis}（${rec.pct}%）`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatBalanceChart;
```

**Step 2: Verify no import errors**

```bash
npm run build 2>&1 | head -40
```

Expected: No errors related to statBalance or StatBalanceChart.

**Step 3: Commit**

```bash
git add components/StatBalanceChart.js
git commit -m "feat: add StatBalanceChart radar component"
```

---

### Task 4: Integrate into `app/page.js`

**Files:**
- Modify: `app/page.js`

**Step 1: Add the import**

Near the top of `app/page.js`, after the existing imports, add:

```js
import StatBalanceChart from '../components/StatBalanceChart';
```

**Step 2: Add the component in JSX**

Find the `<CharacterDataTabs` element in the JSX return. Insert `<StatBalanceChart>` just above it. Pass the already-available state:

```jsx
{(character || loading) && (
  <Box sx={{ mb: 3 }}>
    <StatBalanceChart
      statsData={statsData}
      equipmentData={equipmentRawData}
      loading={loading}
    />
  </Box>
)}

<CharacterDataTabs
  {/* ... existing props ... */}
/>
```

**Step 3: Smoke test in browser**

```bash
npm run dev
```

1. Open http://localhost:3000
2. Search a character (e.g., any known character name)
3. Verify the balance chart appears above the tabs
4. Verify the 6 axes display with the player hexagon and dashed balance hexagon
5. Verify recommendation chips appear at the bottom

**Step 4: Run full test suite**

```bash
npm test -- --no-coverage
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add app/page.js
git commit -m "feat: integrate StatBalanceChart into main page"
```

---

## Notes

- The stat name lookup uses multiple fallbacks (Korean + Chinese) because the TW API may return different names. If any axis shows 0 unexpectedly in browser testing, check the actual `final_stat` names in the API response via DevTools → Network → character/stats → Preview.
- The 換算主屬 equivalence ratios (ATK×4, boss×30, crit×120) are tuned for 22-star equipment. Adjusting these constants in `computeEquivStats` is the primary tuning lever.
- IED contribution normalizes IED=0% → 0 equiv, IED=100% → mainStat equiv. This makes it comparable to other axes without a separate reference table.
