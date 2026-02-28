# Leaderboard Filter & Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add name search, server filter, and class filter to the leaderboard page with backend filtering.

**Architecture:** API route reads all CombatPower + CharacterInfo data (already happens), merges and applies JS filters in memory, then paginates. A new `/api/leaderboard/filters` endpoint returns available filter options. Frontend adds search field + two Select dropdowns above the card list.

**Tech Stack:** Next.js API routes, Google Sheets API, MUI components (TextField, Select, MenuItem), React hooks

---

### Task 1: Add `getFilterOptions()` to GoogleSheetsClient

**Files:**
- Modify: `lib/googleSheets.js` (add method before the closing `}` of the class, around line 975)
- Test: `__tests__/lib/googleSheets.combatPower.test.js`

**Step 1: Write the failing test**

Add to `__tests__/lib/googleSheets.combatPower.test.js` at the end, before the closing `});`:

```javascript
describe('getFilterOptions', () => {
  it('should return deduplicated and sorted worlds and classes', async () => {
    mockSheets.spreadsheets.values.get.mockResolvedValue({
      data: {
        values: [
          ['ocid', 'character_name', 'character_level', 'character_image', 'world_name', 'character_class', 'cached_at'],
          ['ocid1', 'Player1', '275', 'img1', '殺人鯨', '冒險家 - 乘風破浪', '2026-01-01'],
          ['ocid2', 'Player2', '280', 'img2', '青橡', '冒險家 - 乘風破浪', '2026-01-01'],
          ['ocid3', 'Player3', '270', 'img3', '殺人鯨', '冒險家 - 乘風破浪', '2026-01-01'],
          ['ocid4', 'Player4', '260', 'img4', '青橡', '冒險家 - 乘風破浪', '2026-01-01'],
        ],
      },
    });

    // Mock getOrCreateCharacterInfoSheet
    jest.spyOn(client, 'getOrCreateCharacterInfoSheet').mockResolvedValue({
      sheetId: 1,
      sheetName: 'CharacterInfo',
    });

    const result = await client.getFilterOptions();

    expect(result.worlds).toEqual(['殺人鯨', '青橡']);
    expect(result.classes).toEqual(['冒險家 - 乘風破浪', '冒險家 - 乘風破浪']);
    // Should be deduplicated
    expect(result.worlds.length).toBe(2);
  });

  it('should return empty arrays when no data exists', async () => {
    mockSheets.spreadsheets.values.get.mockResolvedValue({
      data: { values: [['ocid', 'character_name', 'character_level', 'character_image', 'world_name', 'character_class', 'cached_at']] },
    });

    jest.spyOn(client, 'getOrCreateCharacterInfoSheet').mockResolvedValue({
      sheetId: 1,
      sheetName: 'CharacterInfo',
    });

    const result = await client.getFilterOptions();

    expect(result.worlds).toEqual([]);
    expect(result.classes).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="googleSheets.combatPower" --verbose`
Expected: FAIL — `client.getFilterOptions is not a function`

**Step 3: Write minimal implementation**

Add to `lib/googleSheets.js` before the closing `}` of the class (before line 975):

```javascript
/**
 * Get available filter options from CharacterInfo sheet
 * @returns {Promise<{worlds: string[], classes: string[]}>}
 */
async getFilterOptions() {
  const sheetName = 'CharacterInfo';

  try {
    await this.getOrCreateCharacterInfoSheet();

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:G`,
    });

    const values = response.data.values || [];
    const worldsSet = new Set();
    const classesSet = new Set();

    for (let i = 1; i < values.length; i++) {
      const worldName = values[i]?.[4];
      const characterClass = values[i]?.[5];
      if (worldName && worldName.trim()) worldsSet.add(worldName.trim());
      if (characterClass && characterClass.trim()) classesSet.add(characterClass.trim());
    }

    return {
      worlds: [...worldsSet].sort(),
      classes: [...classesSet].sort(),
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return { worlds: [], classes: [] };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="googleSheets.combatPower" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/googleSheets.js __tests__/lib/googleSheets.combatPower.test.js
git commit -m "feat: add getFilterOptions() to GoogleSheetsClient"
```

---

### Task 2: Update `getLeaderboardData()` to support filters

**Files:**
- Modify: `lib/googleSheets.js:683-736` — change `getLeaderboardData` signature
- Test: `__tests__/lib/googleSheets.combatPower.test.js`

**Step 1: Write the failing tests**

Add to `__tests__/lib/googleSheets.combatPower.test.js` inside the `getLeaderboardData` describe block:

```javascript
it('should filter by worldName when characterInfo is provided', async () => {
  mockSheets.spreadsheets.values.get.mockResolvedValue({
    data: {
      values: [
        ['ocid', 'combat_power', 'updated_at', 'status'],
        ['ocid1', '50000', '2026-01-01', 'success'],
        ['ocid2', '40000', '2026-01-01', 'success'],
        ['ocid3', '30000', '2026-01-01', 'success'],
      ],
    },
  });

  const characterInfoMap = new Map([
    ['ocid1', { character_name: 'A', world_name: '殺人鯨', character_class: '冒險家' }],
    ['ocid2', { character_name: 'B', world_name: '青橡', character_class: '冒險家' }],
    ['ocid3', { character_name: 'C', world_name: '殺人鯨', character_class: '騎士' }],
  ]);

  const result = await client.getLeaderboardData(0, 20, {
    worldName: '殺人鯨',
    characterInfoMap,
  });

  expect(result.entries.length).toBe(2);
  expect(result.totalCount).toBe(2);
  expect(result.entries[0].ocid).toBe('ocid1');
  expect(result.entries[1].ocid).toBe('ocid3');
});

it('should filter by search (character name) case-insensitively', async () => {
  mockSheets.spreadsheets.values.get.mockResolvedValue({
    data: {
      values: [
        ['ocid', 'combat_power', 'updated_at', 'status'],
        ['ocid1', '50000', '2026-01-01', 'success'],
        ['ocid2', '40000', '2026-01-01', 'success'],
      ],
    },
  });

  const characterInfoMap = new Map([
    ['ocid1', { character_name: 'HelloWorld', world_name: '殺人鯨', character_class: '冒險家' }],
    ['ocid2', { character_name: 'GoodBye', world_name: '青橡', character_class: '冒險家' }],
  ]);

  const result = await client.getLeaderboardData(0, 20, {
    search: 'hello',
    characterInfoMap,
  });

  expect(result.entries.length).toBe(1);
  expect(result.entries[0].ocid).toBe('ocid1');
});

it('should filter by characterClass with substring match', async () => {
  mockSheets.spreadsheets.values.get.mockResolvedValue({
    data: {
      values: [
        ['ocid', 'combat_power', 'updated_at', 'status'],
        ['ocid1', '50000', '2026-01-01', 'success'],
        ['ocid2', '40000', '2026-01-01', 'success'],
      ],
    },
  });

  const characterInfoMap = new Map([
    ['ocid1', { character_name: 'A', world_name: '殺人鯨', character_class: '冒險家 - 乘風破浪' }],
    ['ocid2', { character_name: 'B', world_name: '青橡', character_class: '冒險家 - 乘風破浪' }],
  ]);

  const result = await client.getLeaderboardData(0, 20, {
    characterClass: '乘風破浪',
    characterInfoMap,
  });

  expect(result.entries.length).toBe(1);
  expect(result.entries[0].ocid).toBe('ocid1');
});

it('should combine multiple filters', async () => {
  mockSheets.spreadsheets.values.get.mockResolvedValue({
    data: {
      values: [
        ['ocid', 'combat_power', 'updated_at', 'status'],
        ['ocid1', '50000', '2026-01-01', 'success'],
        ['ocid2', '40000', '2026-01-01', 'success'],
        ['ocid3', '30000', '2026-01-01', 'success'],
      ],
    },
  });

  const characterInfoMap = new Map([
    ['ocid1', { character_name: 'A', world_name: '殺人鯨', character_class: '冒險家 - 乘風破浪' }],
    ['ocid2', { character_name: 'B', world_name: '殺人鯨', character_class: '冒險家 - 乘風破浪' }],
    ['ocid3', { character_name: 'C', world_name: '青橡', character_class: '冒險家 - 乘風破浪' }],
  ]);

  const result = await client.getLeaderboardData(0, 20, {
    worldName: '殺人鯨',
    characterClass: '乘風破浪',
    characterInfoMap,
  });

  expect(result.entries.length).toBe(1);
  expect(result.entries[0].ocid).toBe('ocid1');
});

it('should work without filters (backward compatible)', async () => {
  mockSheets.spreadsheets.values.get.mockResolvedValue({
    data: {
      values: [
        ['ocid', 'combat_power', 'updated_at', 'status'],
        ['ocid1', '50000', '2026-01-01', 'success'],
        ['ocid2', '40000', '2026-01-01', 'success'],
      ],
    },
  });

  const result = await client.getLeaderboardData(0, 20);

  expect(result.entries.length).toBe(2);
  expect(result.totalCount).toBe(2);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="googleSheets.combatPower" --verbose`
Expected: FAIL — filter tests fail (filters not applied)

**Step 3: Write implementation**

Replace `getLeaderboardData` in `lib/googleSheets.js` (lines 683-736):

```javascript
/**
 * Get leaderboard data from CombatPower sheet, sorted by combat power descending
 * @param {number} offset - Starting position (0-based)
 * @param {number} limit - Maximum number of entries to return
 * @param {Object} [filters] - Optional filter criteria
 * @param {string} [filters.search] - Character name substring match (case-insensitive)
 * @param {string} [filters.worldName] - Exact match on world_name
 * @param {string} [filters.characterClass] - Substring match on character_class
 * @param {Map} [filters.characterInfoMap] - Pre-fetched character info map for filtering
 * @returns {Promise<{entries: Array<{ocid: string, combat_power: number, updated_at: string}>, totalCount: number, hasMore: boolean}>}
 */
async getLeaderboardData(offset = 0, limit = 20, filters = {}) {
  const sheetName = 'CombatPower';

  try {
    console.log(
      `📥 Fetching leaderboard data (offset=${offset}, limit=${limit})...`
    );

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:D`,
    });

    const values = response.data.values || [];

    // Skip header row and filter valid entries with successful status
    const entries = [];
    for (let i = 1; i < values.length; i++) {
      const [ocid, combat_power, updated_at, status] = values[i];
      if (ocid && combat_power && status === 'success') {
        entries.push({
          ocid,
          combat_power: parseInt(combat_power, 10) || 0,
          updated_at: updated_at || '',
        });
      }
    }

    // Sort by combat_power descending, then by ocid ascending for stable sort
    entries.sort((a, b) => {
      if (b.combat_power !== a.combat_power) {
        return b.combat_power - a.combat_power;
      }
      return a.ocid.localeCompare(b.ocid);
    });

    // Apply filters if characterInfoMap is provided
    const { search, worldName, characterClass, characterInfoMap } = filters;
    let filteredEntries = entries;

    if (characterInfoMap && (search || worldName || characterClass)) {
      filteredEntries = entries.filter(entry => {
        const info = characterInfoMap.get(entry.ocid);
        if (!info) return false;

        if (search) {
          const name = (info.character_name || '').toLowerCase();
          if (!name.includes(search.toLowerCase())) return false;
        }

        if (worldName) {
          if (info.world_name !== worldName) return false;
        }

        if (characterClass) {
          const cls = (info.character_class || '').toLowerCase();
          if (!cls.includes(characterClass.toLowerCase())) return false;
        }

        return true;
      });
    }

    const totalCount = filteredEntries.length;
    const paginatedEntries = filteredEntries.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    console.log(
      `✅ Fetched ${paginatedEntries.length} leaderboard entries (total: ${totalCount}, hasMore: ${hasMore})`
    );

    return {
      entries: paginatedEntries,
      totalCount,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw error;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="googleSheets.combatPower" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/googleSheets.js __tests__/lib/googleSheets.combatPower.test.js
git commit -m "feat: add filter support to getLeaderboardData()"
```

---

### Task 3: Update leaderboard API route to accept filter params

**Files:**
- Modify: `app/api/leaderboard/route.js`
- Test: `__tests__/api/leaderboard.test.js` (new file)

**Step 1: Write the failing test**

Create `__tests__/api/leaderboard.test.js`:

```javascript
/**
 * @jest-environment node
 */

import { GET } from '../../app/api/leaderboard/route';

// Mock GoogleSheetsClient
const mockGetLeaderboardData = jest.fn();
const mockGetCharacterInfoCache = jest.fn();
const mockUpsertCharacterInfoCache = jest.fn();

jest.mock('../../lib/googleSheets', () => {
  return jest.fn().mockImplementation(() => ({
    getLeaderboardData: mockGetLeaderboardData,
    getCharacterInfoCache: mockGetCharacterInfoCache,
    upsertCharacterInfoCache: mockUpsertCharacterInfoCache,
  }));
});

// Mock characterInfoService
jest.mock('../../lib/characterInfoService', () => ({
  fetchCharacterInfo: jest.fn(),
}));

describe('GET /api/leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass filter params to getLeaderboardData', async () => {
    const characterInfoMap = new Map([
      ['ocid1', {
        character_name: 'TestPlayer',
        character_level: 275,
        character_image: 'img1',
        world_name: '殺人鯨',
        character_class: '冒險家 - 乘風破浪',
        cached_at: '2026-01-01',
      }],
    ]);

    mockGetCharacterInfoCache.mockResolvedValue(characterInfoMap);
    mockGetLeaderboardData.mockResolvedValue({
      entries: [{
        ocid: 'ocid1',
        combat_power: 50000,
        updated_at: '2026-01-01',
      }],
      totalCount: 1,
      hasMore: false,
    });

    const url = 'http://localhost/api/leaderboard?search=Test&worldName=殺人鯨&characterClass=乘風破浪';
    const request = new Request(url);
    const response = await GET(request);
    const data = await response.json();

    // Verify getLeaderboardData was called with filters
    expect(mockGetLeaderboardData).toHaveBeenCalledWith(
      0,
      20,
      expect.objectContaining({
        search: 'Test',
        worldName: '殺人鯨',
        characterClass: '乘風破浪',
      })
    );

    expect(data.entries.length).toBe(1);
    expect(data.totalCount).toBe(1);
  });

  it('should work without filter params (backward compatible)', async () => {
    mockGetCharacterInfoCache.mockResolvedValue(new Map());
    mockGetLeaderboardData.mockResolvedValue({
      entries: [],
      totalCount: 0,
      hasMore: false,
    });

    const url = 'http://localhost/api/leaderboard';
    const request = new Request(url);
    await GET(request);

    expect(mockGetLeaderboardData).toHaveBeenCalledWith(
      0,
      20,
      expect.objectContaining({
        search: null,
        worldName: null,
        characterClass: null,
      })
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/api/leaderboard" --verbose`
Expected: FAIL

**Step 3: Write implementation**

Rewrite `app/api/leaderboard/route.js` — the key change is:
1. Parse `search`, `worldName`, `characterClass` from query params
2. Fetch ALL character info first (not just for the paginated page)
3. Pass characterInfoMap + filters to `getLeaderboardData()`
4. Merge character info into results after pagination

```javascript
import { NextResponse } from 'next/server';
import GoogleSheetsClient from '../../../lib/googleSheets';
import { fetchCharacterInfo } from '../../../lib/characterInfoService';

const API_DELAY_MS = 300;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    let offset = parseInt(searchParams.get('offset') || '0', 10);
    let limit = parseInt(searchParams.get('limit') || '20', 10);

    if (isNaN(offset) || offset < 0) offset = 0;
    if (isNaN(limit) || limit < 1) limit = 20;
    else if (limit > 100) limit = 100;

    // Parse filter params
    const search = searchParams.get('search') || null;
    const worldName = searchParams.get('worldName') || null;
    const characterClass = searchParams.get('characterClass') || null;
    const hasFilters = search || worldName || characterClass;

    console.log(
      `📊 Leaderboard API: offset=${offset}, limit=${limit}, search=${search}, worldName=${worldName}, characterClass=${characterClass}`
    );

    const sheetsClient = new GoogleSheetsClient();

    // When filters are active, we need character info BEFORE pagination
    // so getLeaderboardData can filter correctly
    let characterInfoMap = new Map();

    if (hasFilters) {
      // Get all combat power OCIDs first for character info lookup
      const allData = await sheetsClient.getLeaderboardData(0, Infinity);
      const allOcids = allData.entries.map(e => e.ocid);
      characterInfoMap = await sheetsClient.getCharacterInfoCache(allOcids);
    }

    // Get leaderboard data with filters
    const {
      entries: combatPowerEntries,
      totalCount,
      hasMore,
    } = await sheetsClient.getLeaderboardData(offset, limit, {
      search,
      worldName,
      characterClass,
      characterInfoMap: hasFilters ? characterInfoMap : undefined,
    });

    if (combatPowerEntries.length === 0) {
      return NextResponse.json({
        entries: [],
        totalCount: hasFilters ? totalCount : 0,
        hasMore: false,
        offset,
        limit,
      });
    }

    // For non-filtered requests, fetch character info for this page only
    if (!hasFilters) {
      const ocids = combatPowerEntries.map(entry => entry.ocid);
      characterInfoMap = await sheetsClient.getCharacterInfoCache(ocids);

      // Fetch missing character info from Nexon API
      const missingOcids = ocids.filter(ocid => !characterInfoMap.has(ocid));

      if (missingOcids.length > 0) {
        console.log(
          `🔄 Fetching ${missingOcids.length} missing character info from Nexon API...`
        );

        const newRecords = [];

        for (const ocid of missingOcids) {
          try {
            const characterInfo = await fetchCharacterInfo(ocid);
            if (characterInfo) {
              characterInfoMap.set(ocid, {
                character_name: characterInfo.character_name,
                character_level: characterInfo.character_level,
                character_image: characterInfo.character_image,
                world_name: characterInfo.world_name,
                character_class: characterInfo.character_class,
                cached_at: new Date().toISOString(),
              });
              newRecords.push({
                ocid,
                ...characterInfo,
                cached_at: new Date().toISOString(),
              });
              console.log(`✅ Fetched: ${characterInfo.character_name}`);
            }
            await sleep(API_DELAY_MS);
          } catch (error) {
            console.error(`❌ Failed to fetch ${ocid}:`, error.message);
          }
        }

        if (newRecords.length > 0) {
          sheetsClient.upsertCharacterInfoCache(newRecords).catch(err => {
            console.error('Failed to cache character info:', err.message);
          });
        }
      }
    }

    // Merge combat power data with character info
    const entries = combatPowerEntries.map((entry, index) => {
      const characterInfo = characterInfoMap.get(entry.ocid);
      return {
        rank: offset + index + 1,
        ocid: entry.ocid,
        combat_power: entry.combat_power,
        updated_at: entry.updated_at,
        character_name: characterInfo?.character_name || null,
        character_level: characterInfo?.character_level || null,
        character_image: characterInfo?.character_image || null,
        world_name: characterInfo?.world_name || null,
        character_class: characterInfo?.character_class || null,
      };
    });

    return NextResponse.json({
      entries,
      totalCount,
      hasMore,
      offset,
      limit,
    });
  } catch (error) {
    console.error('❌ Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/api/leaderboard" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/leaderboard/route.js __tests__/api/leaderboard.test.js
git commit -m "feat: add filter params to leaderboard API route"
```

---

### Task 4: Create `/api/leaderboard/filters` endpoint

**Files:**
- Create: `app/api/leaderboard/filters/route.js`
- Test: `__tests__/api/leaderboard-filters.test.js` (new file)

**Step 1: Write the failing test**

Create `__tests__/api/leaderboard-filters.test.js`:

```javascript
/**
 * @jest-environment node
 */

import { GET } from '../../app/api/leaderboard/filters/route';

const mockGetFilterOptions = jest.fn();

jest.mock('../../lib/googleSheets', () => {
  return jest.fn().mockImplementation(() => ({
    getFilterOptions: mockGetFilterOptions,
  }));
});

describe('GET /api/leaderboard/filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return filter options', async () => {
    mockGetFilterOptions.mockResolvedValue({
      worlds: ['殺人鯨', '青橡'],
      classes: ['冒險家 - 乘風破浪', '冒險家 - 乘風破浪'],
    });

    const response = await GET();
    const data = await response.json();

    expect(data.worlds).toEqual(['殺人鯨', '青橡']);
    expect(data.classes).toEqual(['冒險家 - 乘風破浪', '冒險家 - 乘風破浪']);
  });

  it('should return 500 on error', async () => {
    mockGetFilterOptions.mockRejectedValue(new Error('Sheet error'));

    const response = await GET();

    expect(response.status).toBe(500);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="leaderboard-filters" --verbose`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `app/api/leaderboard/filters/route.js`:

```javascript
import { NextResponse } from 'next/server';
import GoogleSheetsClient from '../../../../lib/googleSheets';

/**
 * GET /api/leaderboard/filters
 * Returns available filter options (worlds and classes) for the leaderboard
 */
export async function GET() {
  try {
    const sheetsClient = new GoogleSheetsClient();
    const filters = await sheetsClient.getFilterOptions();

    return NextResponse.json(filters);
  } catch (error) {
    console.error('❌ Leaderboard filters API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="leaderboard-filters" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/leaderboard/filters/route.js __tests__/api/leaderboard-filters.test.js
git commit -m "feat: add /api/leaderboard/filters endpoint"
```

---

### Task 5: Add filter UI to LeaderboardList component

**Files:**
- Modify: `components/LeaderboardList.js`

**Step 1: Add filter state and fetch filter options**

Add imports at top of `components/LeaderboardList.js`:

```javascript
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
```

Add filter state after the existing useState declarations:

```javascript
// Filter state
const [searchText, setSearchText] = useState('');
const [searchQuery, setSearchQuery] = useState(''); // debounced search
const [worldName, setWorldName] = useState('');
const [characterClass, setCharacterClass] = useState('');
const [filterOptions, setFilterOptions] = useState({ worlds: [], classes: [] });

const searchTimerRef = useRef(null);
```

Add filter options fetch in a useEffect:

```javascript
// Fetch filter options
useEffect(() => {
  fetch('/api/leaderboard/filters')
    .then(res => res.json())
    .then(data => setFilterOptions(data))
    .catch(err => console.error('Failed to fetch filter options:', err));
}, []);
```

**Step 2: Update fetchLeaderboard to include filter params**

Update the `fetchLeaderboard` function to accept and pass filters:

```javascript
const fetchLeaderboard = useCallback(
  async (offset = 0, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(ITEMS_PER_PAGE),
      });

      if (searchQuery) params.set('search', searchQuery);
      if (worldName) params.set('worldName', worldName);
      if (characterClass) params.set('characterClass', characterClass);

      const response = await fetch(`/api/leaderboard?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const data = await response.json();

      if (append) {
        setEntries(prev => [...prev, ...data.entries]);
      } else {
        setEntries(data.entries);
      }

      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  },
  [searchQuery, worldName, characterClass]
);
```

**Step 3: Add filter change handlers**

```javascript
// Debounced search handler
const handleSearchChange = useCallback((e) => {
  const value = e.target.value;
  setSearchText(value);

  if (searchTimerRef.current) {
    clearTimeout(searchTimerRef.current);
  }

  searchTimerRef.current = setTimeout(() => {
    setSearchQuery(value);
  }, 500);
}, []);

const handleWorldChange = useCallback((e) => {
  setWorldName(e.target.value);
}, []);

const handleClassChange = useCallback((e) => {
  setCharacterClass(e.target.value);
}, []);

const handleClearFilters = useCallback(() => {
  setSearchText('');
  setSearchQuery('');
  setWorldName('');
  setCharacterClass('');
}, []);

const hasActiveFilters = searchQuery || worldName || characterClass;
```

**Step 4: Re-fetch when filters change**

Update the initial load useEffect to depend on filters:

```javascript
// Fetch when filters change
useEffect(() => {
  fetchLeaderboard(0, false);
}, [fetchLeaderboard]);
```

(This already exists and will re-trigger because `fetchLeaderboard` depends on the filter values.)

**Step 5: Add filter UI JSX**

Add the filter bar right before the `{/* Counter */}` comment inside the return statement:

```jsx
{/* Filter bar */}
<Paper
  sx={{
    p: 2,
    mb: 2,
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    gap: 1.5,
    alignItems: { sm: 'center' },
  }}
>
  <TextField
    size="small"
    placeholder="搜尋角色名稱..."
    value={searchText}
    onChange={handleSearchChange}
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      },
    }}
    sx={{ flex: { sm: 1 }, minWidth: { sm: 200 } }}
  />
  <Box
    sx={{
      display: 'flex',
      gap: 1.5,
      flex: { sm: '0 0 auto' },
    }}
  >
    <FormControl size="small" sx={{ minWidth: 120, flex: { xs: 1, sm: 'none' } }}>
      <InputLabel>伺服器</InputLabel>
      <Select
        value={worldName}
        onChange={handleWorldChange}
        label="伺服器"
      >
        <MenuItem value="">全部</MenuItem>
        {filterOptions.worlds.map(world => (
          <MenuItem key={world} value={world}>
            {world}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    <FormControl size="small" sx={{ minWidth: 120, flex: { xs: 1, sm: 'none' } }}>
      <InputLabel>職業</InputLabel>
      <Select
        value={characterClass}
        onChange={handleClassChange}
        label="職業"
      >
        <MenuItem value="">全部</MenuItem>
        {filterOptions.classes.map(cls => (
          <MenuItem key={cls} value={cls}>
            {cls}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
</Paper>
```

**Step 6: Update empty state to show clear filters button**

Update the empty state (around line 174) to distinguish between "no data" and "no results from filter":

```jsx
if (!isLoading && entries.length === 0) {
  return (
    <Box>
      {/* Keep filter bar visible */}
      {/* ... same filter bar JSX as above ... */}
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        {hasActiveFilters ? (
          <>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              找不到符合條件的角色
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FilterListOffIcon />}
              onClick={handleClearFilters}
              sx={{ mt: 1 }}
            >
              清除篩選條件
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              目前沒有排行榜資料
            </Typography>
            <Typography variant="body2" color="text.secondary">
              請先透過首頁搜尋角色，系統會自動記錄戰力資訊
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}
```

**Step 7: Cleanup search timer on unmount**

Add to the IntersectionObserver cleanup return:

```javascript
return () => {
  if (observerRef.current) observerRef.current.disconnect();
  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
};
```

**Step 8: Run build and dev server to verify**

Run: `npm run build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add components/LeaderboardList.js
git commit -m "feat: add filter UI to leaderboard (search, server, class)"
```

---

### Task 6: Manual testing and polish

**Step 1: Run all tests**

Run: `npm test -- --verbose`
Expected: All tests pass

**Step 2: Run dev server and test manually**

Run: `npm run dev`
Test:
- Visit `/leaderboard` — filter bar renders above cards
- Type a name in search — debounces 500ms, results update
- Select a server — results filter immediately
- Select a class — results filter
- Combine multiple filters — only matching results show
- Clear filters — full list returns
- Empty results show "找不到符合條件的角色" + clear button
- Infinite scroll still works with filters active
- Mobile: search bar full width, selects side by side below

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit any polish fixes**

```bash
git add -A
git commit -m "chore: polish leaderboard filter UI"
```
