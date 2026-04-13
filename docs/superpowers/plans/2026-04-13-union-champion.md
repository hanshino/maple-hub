# Union Champion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Union Champion data fetching, persistence, and display as a new tab in the character data panel.

**Architecture:** New Nexon API call → DB schema (2 tables) → sync service integration → new `UnionChampionPanel` component inside reordered `CharacterDataTabs`.

**Tech Stack:** Next.js 15, Drizzle ORM (MySQL), MUI 7, Jest + RTL

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/nexonApi.js` | Add `getUnionChampion(ocid)` |
| Modify | `lib/db/schema.js` | Add 2 new tables |
| Create | `drizzle/0008_union_champion.sql` | Migration SQL |
| Modify | `lib/db/queries.js` | Add upsert/read, extend `getFullCharacterData()` |
| Modify | `lib/characterSyncService.js` | Add API call + upsert to sync flow |
| Create | `components/UnionChampionPanel.js` | New panel component |
| Modify | `components/CharacterDataTabs.js` | Add tab, reorder tabs |
| Modify | `app/page.js` | Pass `unionChampionData` prop |
| Create | `__tests__/lib/nexonApi-champion.test.js` | API client test |
| Create | `__tests__/components/UnionChampionPanel.test.js` | Component tests |

---

### Task 1: Nexon API Client — `getUnionChampion`

**Files:**
- Modify: `lib/nexonApi.js:166-173`
- Create: `__tests__/lib/nexonApi-champion.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/nexonApi-champion.test.js`:

```js
import { getUnionChampion } from '../../lib/nexonApi';

let mockGet;

jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
  };
  return {
    create: jest.fn(() => mockInstance),
    __mockInstance: mockInstance,
  };
});

beforeEach(() => {
  const axios = require('axios');
  mockGet = axios.__mockInstance.get;
  mockGet.mockReset();
});

describe('getUnionChampion', () => {
  it('should fetch union champion data', async () => {
    const mockData = {
      date: '2026-04-12',
      union_champion: [
        {
          champion_name: '影之愛衣',
          champion_slot: 1,
          champion_grade: 'SSS',
          champion_class: '暗夜行者',
          champion_badge_info: [{ stat: '增加全屬性 20、最大HP/MP 1000' }],
        },
      ],
      champion_badge_total_info: [{ stat: '增加全屬性 20、最大HP/MP 1000' }],
    };
    mockGet.mockResolvedValue({ data: mockData });

    const result = await getUnionChampion('test-ocid');

    expect(mockGet).toHaveBeenCalledWith(
      '/user/union-champion?ocid=test-ocid'
    );
    expect(result).toEqual(mockData);
  });

  it('should throw on failure', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(getUnionChampion('test-ocid')).rejects.toThrow(
      'Failed to fetch union champion'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="nexonApi-champion"`
Expected: FAIL — `getUnionChampion` is not exported

- [ ] **Step 3: Write implementation**

Add to `lib/nexonApi.js` after `getCharacterUnion` (line ~173):

```js
export const getUnionChampion = async ocid => {
  try {
    const response = await apiClient.get(
      `/user/union-champion?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch union champion: ${error.message}`);
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="nexonApi-champion"`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/nexonApi.js __tests__/lib/nexonApi-champion.test.js
git commit -m "feat: add getUnionChampion API client"
```

---

### Task 2: Database Schema — 2 new tables

**Files:**
- Modify: `lib/db/schema.js:335`
- Create: `drizzle/0008_union_champion.sql`

- [ ] **Step 1: Add schema definitions**

Add to `lib/db/schema.js` after `characterUnionArtifactEffects` (after line 335):

```js
// 12c. character_union_champion
export const characterUnionChampion = mysqlTable(
  'character_union_champion',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    championSlot: int('champion_slot').notNull(),
    championName: varchar('champion_name', { length: 100 }),
    championGrade: varchar('champion_grade', { length: 10 }),
    championClass: varchar('champion_class', { length: 50 }),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);

// 12d. character_union_champion_badges
export const characterUnionChampionBadges = mysqlTable(
  'character_union_champion_badges',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    championSlot: int('champion_slot'),
    stat: varchar('stat', { length: 255 }).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);
```

- [ ] **Step 2: Create migration SQL**

Create `drizzle/0008_union_champion.sql`:

```sql
CREATE TABLE `character_union_champion` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`champion_slot` int NOT NULL,
	`champion_name` varchar(100),
	`champion_grade` varchar(10),
	`champion_class` varchar(50),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_union_champion_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `character_union_champion_badges` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`champion_slot` int,
	`stat` varchar(255) NOT NULL,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_union_champion_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `character_union_champion` ADD CONSTRAINT `character_union_champion_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_union_champion_badges` ADD CONSTRAINT `character_union_champion_badges_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_union_champion` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_union_champion_badges` (`ocid`);
```

- [ ] **Step 3: Update migration meta**

Run: `npx drizzle-kit generate` or manually add the journal entry in `drizzle/meta/_journal.json`.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.js drizzle/0008_union_champion.sql drizzle/meta/
git commit -m "feat: add union champion database schema and migration"
```

---

### Task 3: Database Queries — upsert + read

**Files:**
- Modify: `lib/db/queries.js:1-21` (imports)
- Modify: `lib/db/queries.js:136-200` (getFullCharacterData — Promise.all + mapping)
- Modify: `lib/db/queries.js:763` (after upsertUnionArtifactEffects — add new functions)

- [ ] **Step 1: Add schema imports**

In `lib/db/queries.js`, add to the import block (line ~18):

```js
  characterUnionChampion,
  characterUnionChampionBadges,
```

So the import becomes:

```js
import {
  characters,
  characterStats,
  characterEquipment,
  characterHyperStats,
  characterHyperStatPresets,
  characterLinkSkills,
  characterLinkSkillPresets,
  characterHexaCores,
  characterHexaStats,
  characterSymbols,
  characterSetEffects,
  characterUnion,
  characterUnionRaiderStats,
  characterUnionArtifacts,
  characterUnionArtifactEffects,
  characterUnionChampion,
  characterUnionChampionBadges,
  characterCashEquipment,
  characterPetEquipment,
} from './schema.js';
```

- [ ] **Step 2: Add upsert functions**

Add after `upsertUnionArtifactEffects` (after line ~769):

```js
export async function upsertUnionChampion(ocid, champions, totalBadgeInfo) {
  const db = getDb();

  // Delete old data
  await db
    .delete(characterUnionChampion)
    .where(eq(characterUnionChampion.ocid, ocid));
  await db
    .delete(characterUnionChampionBadges)
    .where(eq(characterUnionChampionBadges.ocid, ocid));

  if (!champions || champions.length === 0) return;

  // Insert champions
  await db.insert(characterUnionChampion).values(
    champions.map(c => ({
      ocid,
      championSlot: c.champion_slot,
      championName: c.champion_name || null,
      championGrade: c.champion_grade || null,
      championClass: c.champion_class || null,
    }))
  );

  // Insert per-champion badges
  const badgeRows = [];
  for (const c of champions) {
    if (c.champion_badge_info) {
      for (const badge of c.champion_badge_info) {
        badgeRows.push({
          ocid,
          championSlot: c.champion_slot,
          stat: badge.stat,
        });
      }
    }
  }

  // Insert total badges (championSlot = null)
  if (totalBadgeInfo) {
    for (const badge of totalBadgeInfo) {
      badgeRows.push({
        ocid,
        championSlot: null,
        stat: badge.stat,
      });
    }
  }

  if (badgeRows.length > 0) {
    await db.insert(characterUnionChampionBadges).values(badgeRows);
  }
}
```

- [ ] **Step 3: Extend `getFullCharacterData`**

In the `Promise.all` array inside `getFullCharacterData` (around line 136), add two new queries at the end (before the closing `]`):

```js
    db
      .select()
      .from(characterUnionChampion)
      .where(eq(characterUnionChampion.ocid, ocid)),
    db
      .select()
      .from(characterUnionChampionBadges)
      .where(eq(characterUnionChampionBadges.ocid, ocid)),
```

Add corresponding destructured names:

```js
  const [
    statsRow,
    equipRows,
    hyperStatRows,
    hyperPresetRow,
    linkSkillRows,
    linkPresetRow,
    hexaCoreRows,
    hexaStatRows,
    symbolRows,
    setEffectRows,
    unionRow,
    unionArtifactRows,
    unionArtifactEffectRows,
    unionRaiderStatRows,
    cashEquipRows,
    petEquipRows,
    unionChampionRows,
    unionChampionBadgeRows,
  ] = await Promise.all([
```

- [ ] **Step 4: Add mapping logic and return field**

Add before the `return` statement in `getFullCharacterData` (before line ~385):

```js
  // Map union champion to Nexon format
  const unionChampionData = {
    union_champion: unionChampionRows.map(row => ({
      champion_name: row.championName,
      champion_slot: row.championSlot,
      champion_grade: row.championGrade,
      champion_class: row.championClass,
      champion_badge_info: unionChampionBadgeRows
        .filter(b => b.championSlot === row.championSlot)
        .map(b => ({ stat: b.stat })),
    })),
    champion_badge_total_info: unionChampionBadgeRows
      .filter(b => b.championSlot === null)
      .map(b => ({ stat: b.stat })),
  };
```

Add to the return object (after `unionArtifacts: unionArtifactData,`):

```js
    unionChampion: unionChampionData,
```

- [ ] **Step 5: Commit**

```bash
git add lib/db/queries.js
git commit -m "feat: add union champion DB queries and extend getFullCharacterData"
```

---

### Task 4: Sync Service — integrate API call

**Files:**
- Modify: `lib/characterSyncService.js:1-16` (imports)
- Modify: `lib/characterSyncService.js:60-89` (Promise.allSettled)
- Modify: `lib/characterSyncService.js:260` (after artifact upsert)

- [ ] **Step 1: Add imports**

Add `getUnionChampion` to the nexonApi import (line 1):

```js
import {
  getCharacterBasicInfo,
  getCharacterStats,
  getCharacterEquipment,
  getCharacterCashItemEquipment,
  getCharacterPetEquipment,
  getCharacterHyperStat,
  getCharacterLinkSkill,
  getCharacterHexaMatrix,
  getCharacterHexaMatrixStat,
  getCharacterSetEffect,
  getCharacterSymbolEquipment,
  getUnionRaider,
  getUnionArtifact,
  getCharacterUnion,
  getUnionChampion,
} from './nexonApi.js';
```

Add `upsertUnionChampion` to the queries import (line 17):

```js
import {
  upsertCharacter,
  upsertCharacterStats,
  upsertEquipment,
  upsertHyperStats,
  upsertHyperStatPreset,
  upsertLinkSkills,
  upsertLinkSkillPreset,
  upsertHexaCores,
  upsertHexaStats,
  upsertSymbols,
  upsertSetEffects,
  upsertUnion,
  upsertUnionRaiderStats,
  upsertUnionArtifacts,
  upsertUnionArtifactEffects,
  upsertUnionChampion,
  upsertCashEquipment,
  upsertPetEquipment,
  incrementNotFoundCount,
} from './db/queries.js';
```

- [ ] **Step 2: Add API call to Promise.allSettled**

Add `getUnionChampion(ocid)` to the Promise.allSettled array (line ~88, before the closing `]`):

```js
    const [
      statData,
      equipData,
      cashData,
      petData,
      hyperData,
      linkData,
      hexaData,
      hexaStatData,
      setData,
      symbolData,
      _unionRaiderData,
      artifactData,
      unionBasicData,
      unionChampionData,
    ] = await Promise.allSettled([
      getCharacterStats(ocid),
      getCharacterEquipment(ocid),
      getCharacterCashItemEquipment(ocid),
      getCharacterPetEquipment(ocid),
      getCharacterHyperStat(ocid),
      getCharacterLinkSkill(ocid),
      getCharacterHexaMatrix(ocid),
      getCharacterHexaMatrixStat(ocid),
      getCharacterSetEffect(ocid),
      getCharacterSymbolEquipment(ocid),
      getUnionRaider(ocid),
      getUnionArtifact(ocid),
      getCharacterUnion(ocid),
      getUnionChampion(ocid),
    ]);
```

- [ ] **Step 3: Add upsert call**

Add after the union artifact effects upsert (after line ~261):

```js
    // 12. Upsert Union Champion
    const champion = val(unionChampionData);
    if (champion && champion.union_champion) {
      await upsertUnionChampion(
        ocid,
        champion.union_champion,
        champion.champion_badge_total_info
      );
    }
```

- [ ] **Step 4: Commit**

```bash
git add lib/characterSyncService.js
git commit -m "feat: integrate union champion into character sync flow"
```

---

### Task 5: UnionChampionPanel Component

**Files:**
- Create: `components/UnionChampionPanel.js`
- Create: `__tests__/components/UnionChampionPanel.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/UnionChampionPanel.test.js`:

```js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnionChampionPanel from '../../components/UnionChampionPanel';

const mockData = {
  union_champion: [
    {
      champion_name: '影之愛衣',
      champion_slot: 1,
      champion_grade: 'SSS',
      champion_class: '暗夜行者',
      champion_badge_info: [
        { stat: '增加全屬性 20、最大HP/MP 1000' },
        { stat: '攻擊力/魔力增加 10' },
      ],
    },
    {
      champion_name: '幻影愛衣',
      champion_slot: 2,
      champion_grade: 'A',
      champion_class: '幻影俠盜',
      champion_badge_info: [{ stat: '增加全屬性 20、最大HP/MP 1000' }],
    },
  ],
  champion_badge_total_info: [
    { stat: '增加全屬性 40、最大HP/MP 2000' },
    { stat: '攻擊力/魔力增加 10' },
  ],
};

describe('UnionChampionPanel', () => {
  it('renders loading state', () => {
    render(<UnionChampionPanel loading={true} error={null} data={null} />);
    expect(screen.getByRole('generic', { busy: true })).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <UnionChampionPanel
        loading={false}
        error="fail"
        data={null}
        onRetry={() => {}}
      />
    );
    expect(screen.getByText('無法載入聯盟冠軍資料')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <UnionChampionPanel
        loading={false}
        error={null}
        data={{ union_champion: [], champion_badge_total_info: [] }}
      />
    );
    expect(screen.getByText('尚無聯盟冠軍資料')).toBeInTheDocument();
  });

  it('renders champion cards with grade and name', () => {
    render(
      <UnionChampionPanel loading={false} error={null} data={mockData} />
    );
    expect(screen.getByText('影之愛衣')).toBeInTheDocument();
    expect(screen.getByText('暗夜行者')).toBeInTheDocument();
    expect(screen.getByText('SSS')).toBeInTheDocument();
    expect(screen.getByText('幻影愛衣')).toBeInTheDocument();
    expect(screen.getByText('幻影俠盜')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders total badge effects', () => {
    render(
      <UnionChampionPanel loading={false} error={null} data={mockData} />
    );
    expect(
      screen.getByText('增加全屬性 40、最大HP/MP 2000')
    ).toBeInTheDocument();
    expect(screen.getByText('攻擊力/魔力增加 10')).toBeInTheDocument();
  });

  it('renders empty slots up to 6', () => {
    render(
      <UnionChampionPanel loading={false} error={null} data={mockData} />
    );
    // 2 filled + 4 empty = 6 total grid items
    const lockIcons = screen.getAllByTestId('LockIcon');
    expect(lockIcons).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="UnionChampionPanel"`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the component**

Create `components/UnionChampionPanel.js`:

```js
'use client';

import { Box, Typography, Chip, Grid, Paper, Tooltip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const TOTAL_SLOTS = 6;

const GRADE_COLORS = {
  SSS: {
    bg: 'linear-gradient(135deg, #ffd700, #ff8c00)',
    border: '#ffd700',
    text: '#000',
  },
  SS: { bg: '#9c27b0', border: '#9c27b0', text: '#fff' },
  S: { bg: '#2196f3', border: '#2196f3', text: '#fff' },
  A: { bg: '#4caf50', border: '#4caf50', text: '#000' },
  B: { bg: '#9e9e9e', border: '#9e9e9e', text: '#000' },
  C: { bg: '#616161', border: '#616161', text: '#fff' },
};

const getGradeStyle = grade => GRADE_COLORS[grade] || GRADE_COLORS.C;

const SectionTitle = ({ children }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 2 }}>
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

const ChampionCard = ({ champion }) => {
  const gradeStyle = getGradeStyle(champion.champion_grade);
  const badgeCount = champion.champion_badge_info?.length || 0;
  const tooltipContent = (champion.champion_badge_info || [])
    .map(b => b.stat)
    .join('\n');

  return (
    <Tooltip
      title={
        <Box>
          {(champion.champion_badge_info || []).map((b, i) => (
            <Typography key={i} variant="caption" display="block">
              {b.stat}
            </Typography>
          ))}
        </Box>
      }
      arrow
      placement="top"
    >
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2,
          borderColor: gradeStyle.border,
          borderWidth: 1.5,
          textAlign: 'center',
          cursor: 'default',
          transition: 'box-shadow 150ms ease',
          '&:hover': {
            boxShadow: `0 0 12px ${gradeStyle.border}40`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Chip
            label={champion.champion_grade}
            size="small"
            sx={{
              background: gradeStyle.bg,
              color: gradeStyle.text,
              fontWeight: 900,
              fontSize: '0.7rem',
              height: 22,
              minWidth: 36,
            }}
          />
          <Typography variant="caption" color="text.disabled">
            Slot {champion.champion_slot}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {champion.champion_class}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {champion.champion_name}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            justifyContent: 'center',
            mt: 1,
          }}
        >
          {Array.from({ length: badgeCount }).map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 14,
                height: 14,
                borderRadius: 0.5,
                bgcolor: gradeStyle.border,
                opacity: 0.8,
              }}
            />
          ))}
        </Box>
      </Paper>
    </Tooltip>
  );
};

const EmptySlot = () => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      borderRadius: 2,
      borderStyle: 'dashed',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
    }}
  >
    <LockIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
  </Paper>
);

const UnionChampionPanel = ({ loading, error, data, onRetry }) => {
  if (loading) return <PanelSkeleton rows={4} />;

  if (error) {
    return <PanelError message="無法載入聯盟冠軍資料" onRetry={onRetry} />;
  }

  const champions = data?.union_champion ?? [];
  const totalInfo = data?.champion_badge_total_info ?? [];

  if (champions.length === 0 && totalInfo.length === 0) {
    return <PanelEmpty message="尚無聯盟冠軍資料" />;
  }

  // Fill empty slots up to TOTAL_SLOTS
  const filledSlots = champions.map(c => c.champion_slot);
  const emptySlotCount = TOTAL_SLOTS - champions.length;

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="聯盟冠軍角色與徽章加成" />

      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        {champions.map(champion => (
          <Grid key={champion.champion_slot} size={{ xs: 6, md: 4 }}>
            <ChampionCard champion={champion} />
          </Grid>
        ))}
        {Array.from({ length: emptySlotCount }).map((_, i) => (
          <Grid key={`empty-${i}`} size={{ xs: 6, md: 4 }}>
            <EmptySlot />
          </Grid>
        ))}
      </Grid>

      {totalInfo.length > 0 && (
        <>
          <SectionTitle>總效果</SectionTitle>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {totalInfo.map((badge, i) => (
              <Chip
                key={i}
                label={badge.stat}
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
        </>
      )}
    </Box>
  );
};

export default UnionChampionPanel;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="UnionChampionPanel"`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add components/UnionChampionPanel.js __tests__/components/UnionChampionPanel.test.js
git commit -m "feat: add UnionChampionPanel component with tests"
```

---

### Task 6: Wire into CharacterDataTabs + page

**Files:**
- Modify: `components/CharacterDataTabs.js`
- Modify: `app/page.js:174,456-465`

- [ ] **Step 1: Update CharacterDataTabs**

Replace the entire `components/CharacterDataTabs.js`:

```js
'use client';

import { useState } from 'react';
import { Box, Card, CardContent, Tab, Tabs } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CharacterStats from './CharacterStats';
import RuneSystems from './runes/RuneSystems';
import UnionRaiderPanel from './UnionRaiderPanel';
import HyperStatPanel from './HyperStatPanel';
import SetEffectPanel from './SetEffectPanel';
import UnionArtifactPanel from './UnionArtifactPanel';
import UnionChampionPanel from './UnionChampionPanel';
import LinkSkillPanel from './LinkSkillPanel';
import { track } from '../lib/analytics';

const TAB_STATS = 0;
const TAB_HYPER_STAT = 1;
const TAB_SET_EFFECT = 2;
const TAB_UNION_RAIDER = 3;
const TAB_UNION_ARTIFACT = 4;
const TAB_UNION_CHAMPION = 5;
const TAB_RUNES = 6;
const TAB_LINK_SKILL = 7;

const CharacterDataTabs = ({
  ocid,
  runes,
  setEffectData,
  statsData,
  hyperStatData,
  linkSkillData,
  unionRaiderData,
  unionArtifactData,
  unionChampionData,
}) => {
  const [activeTab, setActiveTab] = useState(TAB_STATS);

  const tabNames = [
    '能力值',
    '極限屬性',
    '套裝效果',
    '聯盟戰地',
    '聯盟神器',
    '聯盟冠軍',
    '符文系統',
    '傳授技能',
  ];

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
    track('tab-switch', { tab: tabNames[newValue] });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case TAB_STATS:
        return <CharacterStats statsData={statsData} />;
      case TAB_HYPER_STAT:
        return (
          <HyperStatPanel data={hyperStatData} loading={false} error={null} />
        );
      case TAB_SET_EFFECT:
        return (
          <SetEffectPanel data={setEffectData} loading={false} error={null} />
        );
      case TAB_UNION_RAIDER:
        return (
          <UnionRaiderPanel
            data={unionRaiderData}
            loading={false}
            error={null}
          />
        );
      case TAB_UNION_ARTIFACT:
        return (
          <UnionArtifactPanel
            data={unionArtifactData}
            loading={false}
            error={null}
          />
        );
      case TAB_UNION_CHAMPION:
        return (
          <UnionChampionPanel
            data={unionChampionData}
            loading={false}
            error={null}
          />
        );
      case TAB_RUNES:
        return <RuneSystems runes={runes} ocid={ocid} />;
      case TAB_LINK_SKILL:
        return (
          <LinkSkillPanel data={linkSkillData} loading={false} error={null} />
        );
      default:
        return null;
    }
  };

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 0.5, mb: 2 }}
        >
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
            {tabNames.map((name, i) => (
              <Tab
                key={i}
                label={name}
                id={`char-tab-${i}`}
                aria-controls={`char-tabpanel-${i}`}
              />
            ))}
          </Tabs>
        </Box>
        <Box
          role="tabpanel"
          id={`char-tabpanel-${activeTab}`}
          aria-labelledby={`char-tab-${activeTab}`}
          aria-live="polite"
          sx={{ mt: 2 }}
        >
          {renderTabContent()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CharacterDataTabs;
```

- [ ] **Step 2: Update app/page.js — extract data**

In `app/page.js`, around line 174, add after `unionArtifactData`:

```js
  const unionChampionData = charData?.unionChampion || null;
```

- [ ] **Step 3: Update app/page.js — pass prop**

In `app/page.js`, around line 456-465, add `unionChampionData` prop to `CharacterDataTabs`:

```jsx
            <CharacterDataTabs
              ocid={character.ocid}
              runes={runes}
              setEffectData={setEffectData}
              statsData={statsData}
              hyperStatData={hyperStatData}
              linkSkillData={linkSkillData}
              unionRaiderData={unionRaiderData}
              unionArtifactData={unionArtifactData}
              unionChampionData={unionChampionData}
            />
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add components/CharacterDataTabs.js app/page.js
git commit -m "feat: wire union champion into tabs and page data flow"
```

---

### Task 7: Clean up test script + verify build

**Files:**
- Delete: `test-union-champion.mjs`

- [ ] **Step 1: Delete test script**

```bash
rm test-union-champion.mjs
```

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: clean up test script and verify build"
```
