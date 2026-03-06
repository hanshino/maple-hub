# Cash Item Equipment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add cash item equipment display with ability stat focus to the existing equipment dialog via tab switching.

**Architecture:** New API route proxies Nexon cashitem-equipment endpoint. Data is normalized to match existing EquipmentSlot shape. EquipmentDialog gains Tabs for switching between regular and cash equipment. New CashItemGrid, CashItemList, and CashItemDetailDrawer handle display.

**Tech Stack:** Next.js App Router, MUI 7, axios, Jest 30

---

### Task 1: Add nexonApi method

**Files:**

- Modify: `lib/nexonApi.js` (append new export)
- Test: `__tests__/lib/nexonApi.test.js`

**Step 1: Write the failing test**

Add to the end of `__tests__/lib/nexonApi.test.js` (inside the outer `describe`):

```js
describe('getCharacterCashItemEquipment', () => {
  it('should return cash item equipment on success', async () => {
    const mockData = { cash_item_equipment_base: [] };
    mockGet.mockResolvedValue({ data: mockData });

    const result = await getCharacterCashItemEquipment('test-ocid');

    expect(mockGet).toHaveBeenCalledWith(
      '/character/cashitem-equipment?ocid=test-ocid'
    );
    expect(result).toEqual(mockData);
  });

  it('should throw an error on failure', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));

    await expect(getCharacterCashItemEquipment('test-ocid')).rejects.toThrow(
      'Failed to fetch cash item equipment: Network Error'
    );
  });
});
```

Also add `getCharacterCashItemEquipment` to the `beforeAll` destructuring:

```js
beforeAll(async () => {
  const mod = await import('../../lib/nexonApi');
  getCharacterBasicInfo = mod.getCharacterBasicInfo;
  getCharacterStats = mod.getCharacterStats;
  getCharacterEquipment = mod.getCharacterEquipment;
  getCharacterCashItemEquipment = mod.getCharacterCashItemEquipment;
});
```

And declare the variable at top of `describe`:

```js
let getCharacterCashItemEquipment;
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/lib/nexonApi"`
Expected: FAIL — `getCharacterCashItemEquipment` is undefined

**Step 3: Write minimal implementation**

Append to `lib/nexonApi.js`:

```js
export const getCharacterCashItemEquipment = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/cashitem-equipment?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch cash item equipment: ${error.message}`);
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/lib/nexonApi"`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/nexonApi.js __tests__/lib/nexonApi.test.js
git commit -m "feat: add getCharacterCashItemEquipment to nexonApi"
```

---

### Task 2: Add API route

**Files:**

- Create: `app/api/character/cashitem-equipment/route.js`
- Test: `__tests__/api/cashitem-equipment.test.js`

**Step 1: Write the failing test**

Create `__tests__/api/cashitem-equipment.test.js`:

```js
/**
 * @jest-environment node
 */

import { GET } from '../../app/api/character/cashitem-equipment/route';

jest.mock('../../lib/nexonApi', () => ({
  getCharacterCashItemEquipment: jest.fn(),
}));

jest.mock('../../lib/cache', () => ({
  getCachedData: jest.fn(() => null),
  setCachedData: jest.fn(),
}));

import { getCharacterCashItemEquipment } from '../../lib/nexonApi';

describe('GET /api/character/cashitem-equipment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if ocid is missing', async () => {
    const request = new Request(
      'http://localhost/api/character/cashitem-equipment'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('OCID parameter is required');
  });

  it('should return cash item equipment data', async () => {
    const mockData = { cash_item_equipment_base: [{ cash_item_name: 'Test' }] };
    getCharacterCashItemEquipment.mockResolvedValue(mockData);

    const request = new Request(
      'http://localhost/api/character/cashitem-equipment?ocid=test-ocid'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockData);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/api/cashitem-equipment"`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `app/api/character/cashitem-equipment/route.js`:

```js
import { NextResponse } from 'next/server';
import { getCharacterCashItemEquipment } from '../../../../lib/nexonApi';
import { getCachedData, setCachedData } from '../../../../lib/cache';
import { handleApiError } from '../../../../lib/apiErrorHandler';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ocid = searchParams.get('ocid');

    if (!ocid) {
      return NextResponse.json(
        { error: 'OCID parameter is required' },
        { status: 400 }
      );
    }

    const cacheKey = `cashitem_equipment_${ocid}`;
    let data = getCachedData(cacheKey);

    if (!data) {
      data = await getCharacterCashItemEquipment(ocid);
      setCachedData(cacheKey, data);
    }

    return NextResponse.json(data);
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status || 500 }
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/api/cashitem-equipment"`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/character/cashitem-equipment/route.js __tests__/api/cashitem-equipment.test.js
git commit -m "feat: add cashitem-equipment API route"
```

---

### Task 3: Add data processing utility

**Files:**

- Modify: `lib/equipmentUtils.js` (append new export)
- Test: `__tests__/lib/equipmentUtils.test.js`

**Step 1: Write the failing test**

Add to `__tests__/lib/equipmentUtils.test.js`:

```js
describe('processCashItemEquipmentData', () => {
  it('should normalize cash items from base array to keyed object', () => {
    const data = {
      cash_item_equipment_base: [
        {
          cash_item_equipment_part: '帽子',
          cash_item_equipment_slot: '帽子',
          cash_item_name: '帽子內襯',
          cash_item_icon: 'https://example.com/hat.png',
          cash_item_option: [
            { option_type: 'LUK', option_value: '15' },
            { option_type: '攻擊力', option_value: '35' },
          ],
        },
        {
          cash_item_equipment_part: '套服',
          cash_item_equipment_slot: '上衣',
          cash_item_name: '套服內襯',
          cash_item_icon: 'https://example.com/top.png',
          cash_item_option: [{ option_type: '攻擊力', option_value: '20' }],
        },
        {
          cash_item_equipment_part: '戒指',
          cash_item_equipment_slot: '戒指1',
          cash_item_name: '凝聚的戒指',
          cash_item_icon: 'https://example.com/ring.png',
          cash_item_option: [],
        },
      ],
    };

    const result = processCashItemEquipmentData(data);

    expect(result.hat).toEqual({
      item_name: '帽子內襯',
      item_icon: 'https://example.com/hat.png',
      item_equipment_slot: '帽子',
      cash_item_equipment_part: '帽子',
      cash_item_option: [
        { option_type: 'LUK', option_value: '15' },
        { option_type: '攻擊力', option_value: '35' },
      ],
    });
    expect(result.top.item_name).toBe('套服內襯');
    expect(result.ring.item_name).toBe('凝聚的戒指');
  });

  it('should return empty object when base is empty', () => {
    const data = { cash_item_equipment_base: [] };
    const result = processCashItemEquipmentData(data);
    expect(result).toEqual({});
  });

  it('should return empty object when data is null', () => {
    const result = processCashItemEquipmentData(null);
    expect(result).toEqual({});
  });
});
```

Import `processCashItemEquipmentData` at the top of the test file.

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/lib/equipmentUtils"`
Expected: FAIL — `processCashItemEquipmentData` is not a function

**Step 3: Write minimal implementation**

Append to `lib/equipmentUtils.js`:

```js
export const processCashItemEquipmentData = data => {
  if (!data?.cash_item_equipment_base) return {};

  const result = {};
  data.cash_item_equipment_base.forEach(item => {
    const position = getEquipmentPosition(item.cash_item_equipment_slot);
    if (position === 'unknown') return;
    result[position] = {
      item_name: item.cash_item_name,
      item_icon: item.cash_item_icon,
      item_equipment_slot: item.cash_item_equipment_slot,
      cash_item_equipment_part: item.cash_item_equipment_part,
      cash_item_option: item.cash_item_option || [],
    };
  });
  return result;
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/lib/equipmentUtils"`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/equipmentUtils.js __tests__/lib/equipmentUtils.test.js
git commit -m "feat: add processCashItemEquipmentData utility"
```

---

### Task 4: Create CashItemGrid component

**Files:**

- Create: `components/CashItemGrid.js`

**Step 1: Create the component**

```js
'use client';

import { Box, Avatar } from '@mui/material';
import EquipmentSlot from './EquipmentSlot';

const SLOT_NAMES = {
  hat: '帽子',
  top: '套服',
  shoes: '鞋子',
  gloves: '手套',
  cape: '披風',
  ring: '戒指',
  ring2: '戒指',
  ring3: '戒指',
  ring4: '戒指',
  earring: '耳環',
  'face-accessory': '臉飾',
  'eye-accessory': '眼飾',
  weapon: '武器',
};

const GRID_LAYOUT = [
  ['ring', 'eye-accessory', 'avatar', 'hat', 'cape'],
  ['ring2', 'face-accessory', null, 'top', 'gloves'],
  ['ring3', 'earring', null, 'shoes', null],
  ['ring4', null, 'weapon', null, null],
];

const CashItemGrid = ({
  equipment,
  characterImage,
  selectedSlot,
  onSlotClick,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 80px)',
        gap: '8px',
        justifyContent: 'center',
        mx: 'auto',
      }}
    >
      {GRID_LAYOUT.flat().map((cell, i) => {
        if (cell === 'avatar') {
          return (
            <Box
              key={`avatar-${i}`}
              sx={{
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar
                src={characterImage}
                alt="角色"
                sx={{ width: 72, height: 72 }}
              />
            </Box>
          );
        }
        if (cell === null) {
          return <Box key={`empty-${i}`} sx={{ width: 80, height: 80 }} />;
        }
        return (
          <EquipmentSlot
            key={cell}
            item={equipment?.[cell] || null}
            slotKey={cell}
            slotName={SLOT_NAMES[cell]}
            variant="grid"
            selected={selectedSlot === cell}
            onClick={onSlotClick}
          />
        );
      })}
    </Box>
  );
};

export default CashItemGrid;
```

**Step 2: Commit**

```bash
git add components/CashItemGrid.js
git commit -m "feat: add CashItemGrid component"
```

---

### Task 5: Create CashItemDetailDrawer component

**Files:**

- Create: `components/CashItemDetailDrawer.js`

**Step 1: Create the component**

```js
'use client';

import { Drawer, Box, Typography, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const CashItemDetailDrawer = ({ item, open, onClose, isMobile }) => {
  const hasOptions = item?.cash_item_option?.length > 0;

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open && !!item}
      onClose={onClose}
      sx={{ zIndex: 1400 }}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 360,
          height: isMobile ? '60vh' : '100%',
          borderRadius: isMobile ? '16px 16px 0 0' : 0,
          overflowY: 'auto',
        },
      }}
      transitionDuration={250}
    >
      {item && (
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <IconButton onClick={onClose} aria-label="關閉" size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2,
            }}
          >
            {item.item_icon && (
              <img
                src={item.item_icon}
                alt={item.item_name}
                style={{
                  width: 80,
                  height: 80,
                  objectFit: 'contain',
                }}
              />
            )}
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, lineHeight: 1.3 }}
              >
                {item.item_name}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mt: 0.5 }}
              >
                {item.cash_item_equipment_part}
              </Typography>
            </Box>
          </Box>

          {hasOptions && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                能力值
              </Typography>
              {item.cash_item_option.map((opt, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 0.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {opt.option_type}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    +{opt.option_value}
                  </Typography>
                </Box>
              ))}
            </>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default CashItemDetailDrawer;
```

**Step 2: Commit**

```bash
git add components/CashItemDetailDrawer.js
git commit -m "feat: add CashItemDetailDrawer component"
```

---

### Task 6: Add Tabs to EquipmentDialog and integrate cash item flow

**Files:**

- Modify: `components/EquipmentDialog.js`

**Step 1: Update EquipmentDialog**

Changes needed:

1. Import `Tabs`, `Tab` from MUI, plus new components
2. Add `tabIndex` state, `cashItemEquipment` state, loading/error for cash items
3. Lazy-load cash item data when tab switches to 1
4. Render Tabs below DialogTitle
5. Conditionally render regular or cash item content based on tab
6. Use `CashItemDetailDrawer` for cash item tab

The modified `EquipmentDialog.js` should:

```js
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  CircularProgress,
  Alert,
  Button,
  useMediaQuery,
  Tabs,
  Tab,
} from '@mui/material';
import {
  processEquipmentData,
  processCashItemEquipmentData,
} from '../lib/equipmentUtils';
import { getCachedData, setCachedData } from '../lib/cache';
import EquipmentGrid from './EquipmentGrid';
import EquipmentList from './EquipmentList';
import EquipmentDetailDrawer from './EquipmentDetailDrawer';
import CashItemGrid from './CashItemGrid';
import CashItemDetailDrawer from './CashItemDetailDrawer';

const EquipmentDialog = ({ ocid, character, open, onClose }) => {
  const [equipment, setEquipment] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [characterImage, setCharacterImage] = useState(
    '/character-placeholder.png'
  );
  const isDesktop = useMediaQuery('(min-width:768px)');

  const [tabIndex, setTabIndex] = useState(0);
  const [cashItemEquipment, setCashItemEquipment] = useState({});
  const [cashItemLoading, setCashItemLoading] = useState(false);
  const [cashItemError, setCashItemError] = useState(null);
  const [cashItemLoaded, setCashItemLoaded] = useState(false);

  const loadEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cacheKey = `equipment_${ocid}`;
      let data = getCachedData(cacheKey);

      if (!data) {
        const response = await fetch(`/api/character/equipment?ocid=${ocid}`);
        if (!response.ok) {
          throw new Error('載入裝備失敗');
        }
        data = await response.json();
        setCachedData(cacheKey, data);
      }

      const processed = processEquipmentData(data);
      setEquipment(processed);
    } catch (err) {
      console.error('Failed to load equipment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ocid]);

  const loadCashItemEquipment = useCallback(async () => {
    setCashItemLoading(true);
    setCashItemError(null);
    try {
      const cacheKey = `cashitem_equipment_${ocid}`;
      let data = getCachedData(cacheKey);

      if (!data) {
        const response = await fetch(
          `/api/character/cashitem-equipment?ocid=${ocid}`
        );
        if (!response.ok) {
          throw new Error('載入現金裝備失敗');
        }
        data = await response.json();
        setCachedData(cacheKey, data);
      }

      const processed = processCashItemEquipmentData(data);
      setCashItemEquipment(processed);
      setCashItemLoaded(true);
    } catch (err) {
      console.error('Failed to load cash item equipment:', err);
      setCashItemError(err.message);
    } finally {
      setCashItemLoading(false);
    }
  }, [ocid]);

  useEffect(() => {
    if (character?.character_image) {
      setCharacterImage(character.character_image);
    }
  }, [character]);

  useEffect(() => {
    if (open && ocid) {
      loadEquipment();
      setSelectedSlot(null);
      setTabIndex(0);
      setCashItemLoaded(false);
    }
  }, [open, ocid, loadEquipment]);

  useEffect(() => {
    if (tabIndex === 1 && !cashItemLoaded && ocid) {
      loadCashItemEquipment();
    }
  }, [tabIndex, cashItemLoaded, ocid, loadCashItemEquipment]);

  const handleSlotClick = slotKey => {
    const source = tabIndex === 0 ? equipment : cashItemEquipment;
    if (source?.[slotKey]) {
      setSelectedSlot(slotKey);
    }
  };

  const handleDrawerClose = () => {
    setSelectedSlot(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setSelectedSlot(null);
  };

  const renderRegularEquipment = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadEquipment}>
                重試
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      );
    }
    return (
      <Box sx={{ py: 1 }}>
        {isDesktop ? (
          <EquipmentGrid
            equipment={equipment}
            characterImage={characterImage}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
          />
        ) : (
          <EquipmentList
            equipment={equipment}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
          />
        )}
      </Box>
    );
  };

  const renderCashItemEquipment = () => {
    if (cashItemLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (cashItemError) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={loadCashItemEquipment}
              >
                重試
              </Button>
            }
          >
            {cashItemError}
          </Alert>
        </Box>
      );
    }
    return (
      <Box sx={{ py: 1 }}>
        {isDesktop ? (
          <CashItemGrid
            equipment={cashItemEquipment}
            characterImage={characterImage}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
          />
        ) : (
          <EquipmentList
            equipment={cashItemEquipment}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
          />
        )}
      </Box>
    );
  };

  return (
    <>
      <Dialog
        open={!!open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={!isDesktop}
        aria-labelledby="equipment-dialog-title"
      >
        <DialogTitle id="equipment-dialog-title">角色裝備</DialogTitle>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="裝備" />
          <Tab label="現金裝備" />
        </Tabs>
        <DialogContent>
          {tabIndex === 0
            ? renderRegularEquipment()
            : renderCashItemEquipment()}
        </DialogContent>
      </Dialog>

      {tabIndex === 0 ? (
        <EquipmentDetailDrawer
          item={selectedSlot ? equipment?.[selectedSlot] : null}
          open={!!selectedSlot}
          onClose={handleDrawerClose}
          isMobile={!isDesktop}
        />
      ) : (
        <CashItemDetailDrawer
          item={selectedSlot ? cashItemEquipment?.[selectedSlot] : null}
          open={!!selectedSlot}
          onClose={handleDrawerClose}
          isMobile={!isDesktop}
        />
      )}
    </>
  );
};

export default EquipmentDialog;
```

**Step 2: Run all tests**

Run: `npm test`
Expected: PASS (existing tests should not break)

**Step 3: Manual verification**

Run: `npm run dev`

- Search a character
- Open equipment dialog
- Verify "裝備" and "現金裝備" tabs appear
- Verify tab switching works
- Verify cash item grid shows items with icons
- Verify clicking an item opens the detail drawer with option stats

**Step 4: Commit**

```bash
git add components/EquipmentDialog.js components/CashItemGrid.js components/CashItemDetailDrawer.js
git commit -m "feat: add cash item equipment tab to equipment dialog"
```

---

### Task 7: Final verification and build check

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Final commit (if any lint fixes needed)**

```bash
git add -A
git commit -m "chore: lint fixes for cashitem equipment feature"
```
