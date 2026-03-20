# Guild Exp Growth Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add experience growth tracking (7-day and 30-day) for guild members, with daily snapshots stored in DB and background backfill for historical data.

**Architecture:** New `guild_exp_snapshots` table stores daily (oguildId, ocid, date, level, expRate) records. Guild sync writes today's snapshot at zero extra API cost. A background service backfills missing historical snapshots (7d/30d ago) via Nexon API with rate limiting. Frontend shows a sortable exp growth leaderboard.

**Tech Stack:** Drizzle ORM (MySQL), Next.js API routes, Recharts, node-cron cleanup

---

### File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `lib/db/guildExpSnapshotSchema.js` | Drizzle schema for `guild_exp_snapshots` table |
| Modify | `lib/db/guildQueries.js` | Add snapshot CRUD queries |
| Modify | `lib/guildSyncService.js` | Write today's snapshot during member sync |
| Modify | `lib/nexonApi.js` | Add `date` param to `getCharacterBasicInfo` |
| Create | `lib/guildExpBackfillService.js` | Background backfill service for historical snapshots |
| Create | `app/api/guild/[oguildId]/exp-growth/route.js` | API endpoint returning exp growth data + triggering backfill |
| Create | `components/GuildExpGrowth.js` | Frontend component: exp growth leaderboard |
| Modify | `app/guild/[server]/[guildName]/GuildDetailClient.js` | Add GuildExpGrowth to guild page |
| Modify | `lib/cron.js` | Add daily cleanup of snapshots older than 30 days |

---

### Task 1: DB Schema — guild_exp_snapshots table

**Files:**
- Create: `lib/db/guildExpSnapshotSchema.js`

- [ ] **Step 1: Create the Drizzle schema file**

```js
// lib/db/guildExpSnapshotSchema.js
import {
  mysqlTable,
  bigint,
  varchar,
  int,
  date,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { guilds } from './guildSchema.js';
import { characters } from './schema.js';

export const guildExpSnapshots = mysqlTable(
  'guild_exp_snapshots',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    oguildId: varchar('oguild_id', { length: 64 })
      .notNull()
      .references(() => guilds.oguildId, { onDelete: 'cascade' }),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    snapshotDate: date('snapshot_date').notNull(),
    characterLevel: int('character_level'),
    characterExpRate: varchar('character_exp_rate', { length: 20 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => [
    uniqueIndex('idx_snapshot_unique').on(
      table.oguildId,
      table.ocid,
      table.snapshotDate
    ),
    index('idx_snapshot_oguild_date').on(table.oguildId, table.snapshotDate),
  ]
);
```

- [ ] **Step 2: Generate migration with drizzle-kit**

Run: `npx drizzle-kit generate`

Verify a new `drizzle/0007_*.sql` file is created with the `guild_exp_snapshots` table DDL.

- [ ] **Step 3: Commit**

```bash
git add lib/db/guildExpSnapshotSchema.js drizzle/
git commit -m "feat: add guild_exp_snapshots schema and migration"
```

---

### Task 2: Snapshot query functions

**Files:**
- Modify: `lib/db/guildQueries.js`

- [ ] **Step 1: Add snapshot query functions to guildQueries.js**

Add these imports at the top of `lib/db/guildQueries.js`:

```js
import { guildExpSnapshots } from './guildExpSnapshotSchema.js';
```

Add these functions at the end of the file:

```js
/**
 * Upsert a single exp snapshot (INSERT IGNORE style via ON DUPLICATE KEY).
 */
export async function upsertExpSnapshot({ oguildId, ocid, snapshotDate, characterLevel, characterExpRate }) {
  const db = getDb();
  await db
    .insert(guildExpSnapshots)
    .values({ oguildId, ocid, snapshotDate, characterLevel, characterExpRate })
    .onDuplicateKeyUpdate({
      set: { characterLevel, characterExpRate },
    });
}

/**
 * Batch upsert snapshots for multiple members on a single date.
 */
export async function batchUpsertExpSnapshots(snapshots) {
  if (snapshots.length === 0) return;
  const db = getDb();
  await db
    .insert(guildExpSnapshots)
    .values(snapshots)
    .onDuplicateKeyUpdate({
      set: {
        characterLevel: sql`VALUES(character_level)`,
        characterExpRate: sql`VALUES(character_exp_rate)`,
      },
    });
}

/**
 * Get snapshots for a guild on specific dates.
 * Returns { [ocid]: { [date]: { characterLevel, characterExpRate } } }
 */
export async function getExpSnapshots(oguildId, dates) {
  const db = getDb();
  const rows = await db
    .select({
      ocid: guildExpSnapshots.ocid,
      snapshotDate: guildExpSnapshots.snapshotDate,
      characterLevel: guildExpSnapshots.characterLevel,
      characterExpRate: guildExpSnapshots.characterExpRate,
    })
    .from(guildExpSnapshots)
    .where(
      and(
        eq(guildExpSnapshots.oguildId, oguildId),
        inArray(guildExpSnapshots.snapshotDate, dates)
      )
    );

  const result = {};
  for (const row of rows) {
    if (!result[row.ocid]) result[row.ocid] = {};
    result[row.ocid][row.snapshotDate] = {
      characterLevel: row.characterLevel,
      characterExpRate: row.characterExpRate,
    };
  }
  return result;
}

/**
 * Get guild member ocids that are missing snapshots for a given date.
 */
export async function getMembersWithoutSnapshot(oguildId, snapshotDate) {
  const db = getDb();
  const members = await db
    .select({
      ocid: guildMembers.ocid,
      characterName: guildMembers.characterName,
    })
    .from(guildMembers)
    .leftJoin(
      guildExpSnapshots,
      and(
        eq(guildMembers.ocid, guildExpSnapshots.ocid),
        eq(guildExpSnapshots.oguildId, oguildId),
        eq(guildExpSnapshots.snapshotDate, snapshotDate)
      )
    )
    .where(
      and(
        eq(guildMembers.oguildId, oguildId),
        sql`${guildMembers.ocid} IS NOT NULL`,
        sql`${guildExpSnapshots.id} IS NULL`
      )
    );
  return members;
}

/**
 * Delete snapshots older than N days.
 */
export async function deleteOldExpSnapshots(days = 30) {
  const db = getDb();
  const result = await db
    .delete(guildExpSnapshots)
    .where(sql`${guildExpSnapshots.snapshotDate} < DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`);
  return result[0]?.affectedRows || 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/db/guildQueries.js
git commit -m "feat: add exp snapshot query functions"
```

---

### Task 3: Add date param to Nexon API client

**Files:**
- Modify: `lib/nexonApi.js`

- [ ] **Step 1: Add optional `date` parameter to `getCharacterBasicInfo`**

In `lib/nexonApi.js`, change the function signature:

```js
export const getCharacterBasicInfo = async (ocid, date) => {
  try {
    let url = `/character/basic?ocid=${ocid}`;
    if (date) url += `&date=${date}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch character basic info: ${error.message}`);
  }
};
```

This is backward compatible — existing callers pass no date and get current data.

- [ ] **Step 2: Commit**

```bash
git add lib/nexonApi.js
git commit -m "feat: add date param to getCharacterBasicInfo"
```

---

### Task 4: Write today's snapshot during guild sync

**Files:**
- Modify: `lib/guildSyncService.js`

- [ ] **Step 1: Add snapshot write to `syncGuildMemberBasic`**

Add import at top of `lib/guildSyncService.js`:

```js
import { upsertExpSnapshot } from './db/guildQueries.js';
```

(Note: `upsertExpSnapshot` needs to be added to the existing import from `'./db/guildQueries.js'`. Merge with the existing import.)

In `syncGuildMemberBasic`, after the `await updateGuildMemberOcid(...)` line and before the `return { success: true, ... }` line, add:

```js
    // Write today's exp snapshot (zero extra API cost)
    const today = new Date().toISOString().slice(0, 10);
    await upsertExpSnapshot({
      oguildId,
      ocid,
      snapshotDate: today,
      characterLevel: basicInfo.character_level,
      characterExpRate: basicInfo.character_exp_rate,
    }).catch(err =>
      console.error(`Exp snapshot failed for "${characterName}":`, err.message)
    );
```

- [ ] **Step 2: Commit**

```bash
git add lib/guildSyncService.js
git commit -m "feat: write today's exp snapshot during guild member sync"
```

---

### Task 5: Background backfill service

**Files:**
- Create: `lib/guildExpBackfillService.js`

- [ ] **Step 1: Create the backfill service**

```js
// lib/guildExpBackfillService.js
import { getCharacterBasicInfo } from './nexonApi.js';
import {
  getMembersWithoutSnapshot,
  batchUpsertExpSnapshots,
} from './db/guildQueries.js';
import { getRedis, KEY_PREFIX } from './redis.js';
import { getGlobalRateLimiter } from './rateLimiter.js';

const BACKFILL_STATUS_TTL = 600; // 10 minutes

function backfillStatusKey(oguildId) {
  return `${KEY_PREFIX}guild:exp-backfill:${oguildId}`;
}

export async function getBackfillStatus(oguildId) {
  const redis = getRedis();
  const status = await redis.hgetall(backfillStatusKey(oguildId));
  if (!status || !status.total) return null;
  return {
    total: parseInt(status.total, 10),
    done: parseInt(status.done || '0', 10),
    failed: parseInt(status.failed || '0', 10),
    inProgress: status.inProgress === 'true',
  };
}

async function setBackfillStatus(oguildId, data) {
  const redis = getRedis();
  const key = backfillStatusKey(oguildId);
  await redis.hmset(key, {
    total: String(data.total),
    done: String(data.done),
    failed: String(data.failed),
    inProgress: String(data.inProgress),
  });
  await redis.expire(key, BACKFILL_STATUS_TTL);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Start background backfill for missing historical snapshots.
 * Fetches data for dates 7 and 30 days ago.
 */
export async function startExpBackfill(oguildId) {
  const existing = await getBackfillStatus(oguildId);
  if (existing?.inProgress) return existing;

  const now = new Date();
  const date7 = formatDate(new Date(now - 7 * 86400000));
  const date30 = formatDate(new Date(now - 30 * 86400000));

  // Find members missing snapshots for each date
  const [missing7, missing30] = await Promise.all([
    getMembersWithoutSnapshot(oguildId, date7),
    getMembersWithoutSnapshot(oguildId, date30),
  ]);

  // Deduplicate: build a map of { ocid: [dates to fetch] }
  const tasks = new Map();
  for (const m of missing7) {
    if (!tasks.has(m.ocid)) tasks.set(m.ocid, { ocid: m.ocid, dates: [] });
    tasks.get(m.ocid).dates.push(date7);
  }
  for (const m of missing30) {
    if (!tasks.has(m.ocid)) tasks.set(m.ocid, { ocid: m.ocid, dates: [] });
    tasks.get(m.ocid).dates.push(date30);
  }

  const totalCalls = [...tasks.values()].reduce(
    (sum, t) => sum + t.dates.length,
    0
  );

  if (totalCalls === 0) {
    return { total: 0, done: 0, failed: 0, inProgress: false };
  }

  const status = { total: totalCalls, done: 0, failed: 0, inProgress: true };
  await setBackfillStatus(oguildId, status);

  backfillInBackground(oguildId, tasks).catch(err =>
    console.error(`Exp backfill error for ${oguildId}:`, err)
  );

  return status;
}

async function backfillInBackground(oguildId, tasks) {
  const limiter = getGlobalRateLimiter();
  let done = 0;
  let failed = 0;
  const batch = [];

  for (const { ocid, dates } of tasks.values()) {
    for (const date of dates) {
      try {
        const info = await limiter.execute(() =>
          getCharacterBasicInfo(ocid, date)
        );
        batch.push({
          oguildId,
          ocid,
          snapshotDate: date,
          characterLevel: info.character_level,
          characterExpRate: info.character_exp_rate,
        });
        done++;
      } catch {
        failed++;
      }

      // Batch write every 20 snapshots
      if (batch.length >= 20) {
        await batchUpsertExpSnapshots(batch.splice(0));
      }

      // Update status every 10 calls
      if ((done + failed) % 10 === 0) {
        await setBackfillStatus(oguildId, {
          total: [...tasks.values()].reduce(
            (sum, t) => sum + t.dates.length,
            0
          ),
          done,
          failed,
          inProgress: true,
        });
      }
    }
  }

  // Flush remaining batch
  if (batch.length > 0) {
    await batchUpsertExpSnapshots(batch);
  }

  const total = [...tasks.values()].reduce(
    (sum, t) => sum + t.dates.length,
    0
  );
  await setBackfillStatus(oguildId, {
    total,
    done,
    failed,
    inProgress: false,
  });

  console.log(
    `Exp backfill complete for ${oguildId}: ${done} done, ${failed} failed`
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/guildExpBackfillService.js
git commit -m "feat: add background exp backfill service"
```

---

### Task 6: API endpoint — exp-growth

**Files:**
- Create: `app/api/guild/[oguildId]/exp-growth/route.js`

- [ ] **Step 1: Create the API route**

```js
// app/api/guild/[oguildId]/exp-growth/route.js
import { NextResponse } from 'next/server';
import { getExpSnapshots } from '@/lib/db/guildQueries.js';
import { getGuildWithMembers } from '@/lib/db/guildQueries.js';
import {
  startExpBackfill,
  getBackfillStatus,
} from '@/lib/guildExpBackfillService.js';

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Calculate exp growth between two snapshots.
 * Accounts for level-ups: each level-up = 100% exp.
 */
function calcExpGrowth(current, past) {
  if (!current || !past) return null;
  const curRate = parseFloat(current.characterExpRate) || 0;
  const pastRate = parseFloat(past.characterExpRate) || 0;
  const levelDiff = (current.characterLevel || 0) - (past.characterLevel || 0);
  return levelDiff * 100 + (curRate - pastRate);
}

export async function GET(request, { params }) {
  const { oguildId } = await params;

  try {
    const guild = await getGuildWithMembers(oguildId);
    if (!guild) {
      return NextResponse.json({ error: '工會不存在' }, { status: 404 });
    }

    const now = new Date();
    const today = formatDate(now);
    const date7 = formatDate(new Date(now - 7 * 86400000));
    const date30 = formatDate(new Date(now - 30 * 86400000));

    // Fetch snapshots for the 3 dates we need
    const snapshots = await getExpSnapshots(oguildId, [today, date7, date30]);

    // Build growth data per member
    const members = guild.members
      .filter(m => m.ocid)
      .map(m => {
        const s = snapshots[m.ocid] || {};
        return {
          characterName: m.characterName,
          characterClass: m.characterClass,
          characterLevel: m.characterLevel,
          characterImage: m.characterImage,
          growth7: calcExpGrowth(s[today], s[date7]),
          growth30: calcExpGrowth(s[today], s[date30]),
        };
      });

    // Trigger backfill for missing snapshots (non-blocking)
    const backfillStatus = await startExpBackfill(oguildId);

    return NextResponse.json({
      members,
      backfillStatus,
      dates: { today, date7, date30 },
    });
  } catch (error) {
    console.error('Exp growth error:', error);
    return NextResponse.json(
      { error: '取得經驗成長資料時發生錯誤' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/guild/\[oguildId\]/exp-growth/route.js
git commit -m "feat: add guild exp-growth API endpoint"
```

---

### Task 7: Frontend component — GuildExpGrowth

**Files:**
- Create: `components/GuildExpGrowth.js`

- [ ] **Step 1: Create the GuildExpGrowth component**

A sortable table showing 7-day and 30-day exp growth per member. Follows existing glassmorphism style and ranking visual language (gold/silver/bronze for top 3) from `GuildMemberTable`.

**UX best practices applied:**
- Skeleton table (5 rows) when data is loading instead of blank screen
- `TableContainer` with `overflowX: 'auto'` for mobile horizontal scroll
- Top 3 ranking with gold/silver/bronze colors + left border (consistent with GuildMemberTable)
- `prefers-reduced-motion` on row transitions
- Chip `minWidth: 96` to fit values like `+1234.56%`
- Three visual states for growth Chips: green (positive), default (zero), outlined dashed (no data)
- Tooltip on growth Chips explaining level-ups (e.g. "升了 2 級又 35.5% 經驗")

```js
// components/GuildExpGrowth.js
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Skeleton,
  Tooltip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';
import { track } from '@/lib/analytics';

const POLL_INTERVAL = 8000;

const RANK_COLORS = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

function formatGrowth(value) {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function growthTooltip(value) {
  if (value == null) return '尚無資料';
  const levels = Math.floor(Math.abs(value) / 100);
  const remainder = Math.abs(value) % 100;
  if (levels === 0) {
    return `經驗成長 ${value >= 0 ? '+' : '-'}${remainder.toFixed(2)}%`;
  }
  return `升了 ${levels} 級又 ${remainder.toFixed(2)}% 經驗`;
}

function GrowthChip({ value, mode }) {
  const isPositive = value > 0;
  const isZero = value != null && value === 0;
  const noData = value == null;

  return (
    <Tooltip title={growthTooltip(value)} arrow placement="top">
      <Chip
        label={formatGrowth(value)}
        size="small"
        color={isPositive ? 'success' : 'default'}
        variant={noData ? 'outlined' : 'filled'}
        sx={{
          px: 1.5,
          minWidth: 96,
          ...(noData && {
            borderStyle: 'dashed',
            borderColor:
              mode === 'dark'
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(0,0,0,0.12)',
          }),
          ...(isZero && {
            bgcolor:
              mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
          }),
        }}
      />
    </Tooltip>
  );
}

function SkeletonTable() {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 48 }}>#</TableCell>
          <TableCell>角色</TableCell>
          <TableCell>等級</TableCell>
          <TableCell>7 天成長</TableCell>
          <TableCell>30 天成長</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton width={20} />
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box>
                  <Skeleton width={80} />
                  <Skeleton width={50} height={14} />
                </Box>
              </Box>
            </TableCell>
            <TableCell>
              <Skeleton width={30} />
            </TableCell>
            <TableCell>
              <Skeleton
                variant="rounded"
                width={96}
                height={24}
                sx={{ borderRadius: 3 }}
              />
            </TableCell>
            <TableCell>
              <Skeleton
                variant="rounded"
                width={96}
                height={24}
                sx={{ borderRadius: 3 }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function GuildExpGrowth({ oguildId }) {
  const { mode } = useColorMode();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState('growth7');
  const [order, setOrder] = useState('desc');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/guild/${oguildId}/exp-growth`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [oguildId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll while backfill is in progress
  useEffect(() => {
    if (!data?.backfillStatus?.inProgress) return;
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [data?.backfillStatus?.inProgress, fetchData]);

  const sortedMembers = useMemo(() => {
    if (!data?.members) return [];
    return [...data.members].sort((a, b) => {
      const aVal = a[orderBy] ?? -Infinity;
      const bVal = b[orderBy] ?? -Infinity;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [data, orderBy, order]);

  const handleSort = field => {
    if (orderBy === field) {
      setOrder(o => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setOrderBy(field);
      setOrder('desc');
    }
    track('guild_exp_sort', { sortBy: field });
  };

  const hasAnyData = sortedMembers.some(
    m => m.growth7 != null || m.growth30 != null
  );

  const glassCardSx = { ...getGlassCardSx(mode), p: 3, mb: 3 };

  return (
    <Box sx={glassCardSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TrendingUpIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
          經驗成長排行
        </Typography>
      </Box>

      {data?.backfillStatus?.inProgress && (
        <Box sx={{ mb: 2 }}>
          <Alert
            severity="info"
            icon={<HourglassEmptyIcon />}
            sx={{ mb: 1 }}
          >
            正在收集歷史資料 ({data.backfillStatus.done}/
            {data.backfillStatus.total})，數據會逐漸完整
          </Alert>
          <LinearProgress
            variant="determinate"
            value={
              data.backfillStatus.total > 0
                ? (data.backfillStatus.done / data.backfillStatus.total) * 100
                : 0
            }
          />
        </Box>
      )}

      <TableContainer sx={{ overflowX: 'auto' }}>
        {loading ? (
          <SkeletonTable />
        ) : !hasAnyData ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              經驗成長資料收集中，請稍後再查看
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }}>#</TableCell>
                <TableCell>角色</TableCell>
                <TableCell>等級</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'growth7'}
                    direction={orderBy === 'growth7' ? order : 'desc'}
                    onClick={() => handleSort('growth7')}
                  >
                    7 天成長
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'growth30'}
                    direction={orderBy === 'growth30' ? order : 'desc'}
                    onClick={() => handleSort('growth30')}
                  >
                    30 天成長
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedMembers.map((member, idx) => {
                const rank = idx + 1;
                const rankColor = RANK_COLORS[rank];
                const isTopThree = rank <= 3;

                return (
                  <TableRow
                    key={member.characterName}
                    sx={{
                      transition: 'background-color 0.15s ease',
                      '@media (prefers-reduced-motion: reduce)': {
                        transition: 'none',
                      },
                      '&:hover': {
                        bgcolor:
                          mode === 'dark'
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(0,0,0,0.04)',
                      },
                      ...(isTopThree && {
                        borderLeft: `4px solid ${rankColor}`,
                      }),
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isTopThree ? 700 : 400,
                          color: rankColor || 'text.secondary',
                        }}
                      >
                        {rank}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                        }}
                      >
                        <Avatar
                          src={member.characterImage || undefined}
                          alt={member.characterName}
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: member.characterImage
                              ? 'transparent'
                              : 'primary.main',
                            ...(isTopThree && {
                              border: `2px solid ${rankColor}`,
                            }),
                          }}
                        >
                          {!member.characterImage &&
                            (member.characterName?.[0] || '?')}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                          >
                            {member.characterName}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {member.characterClass}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{member.characterLevel ?? '—'}</TableCell>
                    <TableCell>
                      <GrowthChip value={member.growth7} mode={mode} />
                    </TableCell>
                    <TableCell>
                      <GrowthChip value={member.growth30} mode={mode} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/GuildExpGrowth.js
git commit -m "feat: add GuildExpGrowth component"
```

---

### Task 8: Integrate into guild detail page

**Files:**
- Modify: `app/guild/[server]/[guildName]/GuildDetailClient.js`

- [ ] **Step 1: Add GuildExpGrowth to GuildDetailClient**

Add import:

```js
import GuildExpGrowth from '../../../../components/GuildExpGrowth';
```

In the return JSX, add `<GuildExpGrowth oguildId={oguildId} />` between `GuildDistributions` and `GuildMemberTable`:

```jsx
<GuildDistributions members={guild.members || []} />
<GuildExpGrowth oguildId={oguildId} />
<GuildMemberTable members={guild.members || []} />
```

- [ ] **Step 2: Commit**

```bash
git add app/guild/\[server\]/\[guildName\]/GuildDetailClient.js
git commit -m "feat: integrate GuildExpGrowth into guild detail page"
```

---

### Task 9: Cron job — cleanup old snapshots

**Files:**
- Modify: `lib/cron.js`

- [ ] **Step 1: Add cleanup job for expired snapshots**

Add a new cron schedule in `initCronJobs()`, after the existing cleanup job:

```js
  // Cleanup old exp snapshots daily at 00:30
  cron.schedule('30 0 * * *', async () => {
    try {
      const { deleteOldExpSnapshots } = await import('./db/guildQueries.js');
      const deleted = await deleteOldExpSnapshots(30);
      console.log(`[Cron] Exp snapshot cleanup: removed ${deleted} old records`);
    } catch (error) {
      console.error('[Cron] Exp snapshot cleanup error:', error);
    }
  });
```

- [ ] **Step 2: Commit**

```bash
git add lib/cron.js
git commit -m "feat: add cron job to clean up old exp snapshots"
```

---

### Task 10: Run migration and verify

- [ ] **Step 1: Run the migration**

Run: `npm run db:migrate` (or the project's migration command)

- [ ] **Step 2: Start dev server and test**

Run: `npm run dev`

1. Navigate to a guild page
2. Verify GuildExpGrowth component appears with "資料收集中" message
3. After guild sync completes, verify today's snapshots are written
4. Check backfill triggers and progress bar appears
5. Once backfill completes, verify growth data appears in the table

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: guild exp growth analysis - complete feature"
```
