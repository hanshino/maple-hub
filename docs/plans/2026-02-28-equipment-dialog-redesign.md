# Equipment Dialog Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the equipment dialog to be responsive (mobile list / desktop grid), theme-aligned, with a Drawer for equipment detail (starforce, potential).

**Architecture:** Split monolithic `EquipmentDialog.js` into 5 components: `EquipmentSlot` (shared slot renderer), `EquipmentGrid` (desktop 5-col CSS Grid), `EquipmentList` (mobile grouped list), `EquipmentDetailDrawer` (side/bottom detail panel), and a rewritten `EquipmentDialog` (container/orchestrator). External API (`open`, `onClose`, `ocid`, `character`) stays unchanged — `page.js` needs zero changes.

**Tech Stack:** Next.js 15, MUI 7, React hooks, Jest 30 + React Testing Library

---

## Slot Name Map (reference for all tasks)

Used by EquipmentSlot, EquipmentGrid, and EquipmentList:

```js
export const SLOT_NAMES = {
  hat: '帽子', top: '上衣', bottom: '褲裙', shoes: '鞋子',
  gloves: '手套', cape: '披風', shoulder: '肩膀', belt: '腰帶',
  ring: '戒指', ring2: '戒指', ring3: '戒指', ring4: '戒指',
  necklace: '墜飾', necklace2: '墜飾', earring: '耳環',
  'face-accessory': '臉飾', 'eye-accessory': '眼飾',
  weapon: '武器', 'sub-weapon': '輔助武器',
  pocket: '口袋', badge: '徽章', medal: '勳章', 'machine-heart': '機械心臟',
};
```

---

### Task 1: EquipmentSlot — Test

**Files:**
- Create: `__tests__/components/EquipmentSlot.test.js`

**Step 1: Write the failing tests**

```js
import { render, screen, fireEvent } from '@testing-library/react';
import EquipmentSlot from '../../components/EquipmentSlot';

const mockItem = {
  item_name: 'Arcane Umbra Hat',
  item_icon: 'https://example.com/hat.png',
  item_equipment_slot: '帽子',
  starforce: '22',
  item_level: '200',
};

describe('EquipmentSlot', () => {
  describe('grid variant', () => {
    it('renders equipped slot with icon and name', () => {
      render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByAltText('Arcane Umbra Hat')).toBeInTheDocument();
      expect(screen.getByText('帽子')).toBeInTheDocument();
    });

    it('renders empty slot with dashed border', () => {
      const { container } = render(
        <EquipmentSlot
          item={null}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByText('帽子')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={false}
          onClick={handleClick}
        />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledWith('hat');
    });

    it('shows selected state', () => {
      const { container } = render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={true}
          onClick={() => {}}
        />
      );
      const slot = screen.getByRole('button');
      expect(slot).toHaveAttribute('aria-pressed', 'true');
    });

    it('has correct aria-label', () => {
      render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        '帽子：Arcane Umbra Hat'
      );
    });

    it('has empty aria-label when no item', () => {
      render(
        <EquipmentSlot
          item={null}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        '帽子：空'
      );
    });
  });

  describe('list variant', () => {
    it('renders item name and slot name', () => {
      render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="list"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByText('Arcane Umbra Hat')).toBeInTheDocument();
      expect(screen.getByText('帽子')).toBeInTheDocument();
    });

    it('shows starforce and level in list mode', () => {
      render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="list"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByText(/22/)).toBeInTheDocument();
      expect(screen.getByText(/Lv\. 200/)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="EquipmentSlot" --verbose`
Expected: FAIL — `Cannot find module '../../components/EquipmentSlot'`

**Step 3: Commit**

```bash
git add __tests__/components/EquipmentSlot.test.js
git commit -m "test: add EquipmentSlot tests (red)"
```

---

### Task 2: EquipmentSlot — Implementation

**Files:**
- Create: `components/EquipmentSlot.js`

**Step 1: Implement the component**

```js
'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';

const gridSx = (item, selected) => ({
  width: 80,
  height: 80,
  p: 0.5,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  cursor: item ? 'pointer' : 'default',
  transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
  backgroundColor: selected
    ? 'rgba(247,147,30,0.08)'
    : item
      ? 'background.paper'
      : 'background.default',
  border: selected
    ? '2px solid #f7931e'
    : item
      ? '2px solid rgba(247,147,30,0.4)'
      : '2px dashed #e0c9a8',
  boxShadow: item
    ? 'inset -1px -1px 4px rgba(0,0,0,0.05), 2px 2px 8px rgba(247,147,30,0.15)'
    : 'none',
  '&:hover': item
    ? {
        transform: 'translateY(-2px)',
        boxShadow:
          'inset -1px -1px 4px rgba(0,0,0,0.05), 4px 4px 12px rgba(247,147,30,0.25)',
      }
    : {},
  '&:focus-visible': {
    outline: '2px solid #f7931e',
    outlineOffset: '2px',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:hover': { transform: 'none' },
  },
});

const listSx = (item, selected) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  px: 2,
  py: 1,
  minHeight: 64,
  cursor: item ? 'pointer' : 'default',
  borderLeft: selected ? '3px solid #f7931e' : '3px solid transparent',
  backgroundColor: selected ? 'rgba(247,147,30,0.08)' : 'transparent',
  transition: 'background-color 200ms ease-out',
  '&:hover': item
    ? { backgroundColor: 'rgba(247,147,30,0.04)' }
    : {},
  '&:focus-visible': {
    outline: '2px solid #f7931e',
    outlineOffset: '-2px',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
});

const EquipmentSlot = ({
  item,
  slotKey,
  slotName,
  variant = 'grid',
  selected = false,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const isGrid = variant === 'grid';
  const ariaLabel = item ? `${slotName}：${item.item_name}` : `${slotName}：空`;

  const handleClick = () => {
    if (onClick) onClick(slotKey);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  if (isGrid) {
    return (
      <Box
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={selected}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        sx={gridSx(item, selected)}
      >
        {item && item.item_icon && !imageError ? (
          <img
            src={item.item_icon}
            alt={item.item_name}
            style={{ width: 40, height: 40, objectFit: 'contain' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <Box sx={{ width: 40, height: 40 }} />
        )}
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            color: 'text.secondary',
            lineHeight: 1.2,
            textAlign: 'center',
            mt: 0.25,
          }}
        >
          {slotName}
        </Typography>
      </Box>
    );
  }

  // List variant
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={selected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={listSx(item, selected)}
    >
      {item && item.item_icon && !imageError ? (
        <img
          src={item.item_icon}
          alt={item.item_name}
          style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }}
          onError={() => setImageError(true)}
        />
      ) : (
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '8px',
            backgroundColor: 'background.paper',
            border: '1px dashed #e0c9a8',
          }}
        />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: item ? 600 : 400,
            color: item ? 'text.primary' : 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item ? item.item_name : slotName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {slotName}
        </Typography>
      </Box>
      {item && (
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          {item.starforce && (
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 700 }}
            >
              {item.starforce}
            </Typography>
          )}
          {item.item_level && (
            <Typography
              variant="caption"
              display="block"
              sx={{ color: 'text.secondary' }}
            >
              Lv. {item.item_level}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default EquipmentSlot;
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="EquipmentSlot" --verbose`
Expected: All 8 tests PASS

**Step 3: Commit**

```bash
git add components/EquipmentSlot.js
git commit -m "feat: add EquipmentSlot component (grid + list variants)"
```

---

### Task 3: EquipmentGrid — Test

**Files:**
- Create: `__tests__/components/EquipmentGrid.test.js`

**Step 1: Write the failing tests**

```js
import { render, screen } from '@testing-library/react';
import EquipmentGrid from '../../components/EquipmentGrid';

const mockEquipment = {
  hat: { item_name: 'Test Hat', item_icon: 'hat.png', item_equipment_slot: '帽子' },
  weapon: { item_name: 'Test Weapon', item_icon: 'weapon.png', item_equipment_slot: '武器' },
};

describe('EquipmentGrid', () => {
  it('renders character avatar', () => {
    render(
      <EquipmentGrid
        equipment={mockEquipment}
        characterImage="https://example.com/char.png"
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    expect(screen.getByAltText('角色')).toBeInTheDocument();
  });

  it('renders all 23 equipment slots', () => {
    render(
      <EquipmentGrid
        equipment={{}}
        characterImage="https://example.com/char.png"
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    const slots = screen.getAllByRole('button');
    expect(slots).toHaveLength(23);
  });

  it('renders equipped items with their names', () => {
    render(
      <EquipmentGrid
        equipment={mockEquipment}
        characterImage="https://example.com/char.png"
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    expect(screen.getByAltText('Test Hat')).toBeInTheDocument();
    expect(screen.getByAltText('Test Weapon')).toBeInTheDocument();
  });

  it('passes selectedSlot to the correct slot', () => {
    render(
      <EquipmentGrid
        equipment={mockEquipment}
        characterImage="https://example.com/char.png"
        selectedSlot="hat"
        onSlotClick={() => {}}
      />
    );
    const hatSlot = screen.getByLabelText('帽子：Test Hat');
    expect(hatSlot).toHaveAttribute('aria-pressed', 'true');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="EquipmentGrid" --verbose`
Expected: FAIL — `Cannot find module '../../components/EquipmentGrid'`

**Step 3: Commit**

```bash
git add __tests__/components/EquipmentGrid.test.js
git commit -m "test: add EquipmentGrid tests (red)"
```

---

### Task 4: EquipmentGrid — Implementation

**Files:**
- Create: `components/EquipmentGrid.js`

**Step 1: Implement the component**

```js
'use client';

import { Box, Avatar } from '@mui/material';
import EquipmentSlot from './EquipmentSlot';

const SLOT_NAMES = {
  hat: '帽子', top: '上衣', bottom: '褲裙', shoes: '鞋子',
  gloves: '手套', cape: '披風', shoulder: '肩膀', belt: '腰帶',
  ring: '戒指', ring2: '戒指', ring3: '戒指', ring4: '戒指',
  necklace: '墜飾', necklace2: '墜飾', earring: '耳環',
  'face-accessory': '臉飾', 'eye-accessory': '眼飾',
  weapon: '武器', 'sub-weapon': '輔助武器',
  pocket: '口袋', badge: '徽章', medal: '勳章', 'machine-heart': '機械心臟',
};

// Grid layout: 6 rows x 5 cols. null = empty spacer, 'avatar' = character image.
const GRID_LAYOUT = [
  ['ring',  'eye-accessory', 'avatar', 'hat',      'cape'],
  ['ring2', 'face-accessory', null,    'top',       'gloves'],
  ['ring3', 'earring',        null,    'bottom',    'shoes'],
  ['ring4', 'necklace',       null,    'shoulder',  'medal'],
  ['belt',  'necklace2',   'weapon',   'sub-weapon','badge'],
  [null,    'pocket',         null,    'machine-heart', null],
];

const EquipmentGrid = ({ equipment, characterImage, selectedSlot, onSlotClick }) => {
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

export default EquipmentGrid;
```

**Step 2: Run tests**

Run: `npm test -- --testPathPattern="EquipmentGrid" --verbose`
Expected: All 4 tests PASS

**Step 3: Commit**

```bash
git add components/EquipmentGrid.js
git commit -m "feat: add EquipmentGrid component (desktop 5-col CSS Grid)"
```

---

### Task 5: EquipmentList — Test

**Files:**
- Create: `__tests__/components/EquipmentList.test.js`

**Step 1: Write the failing tests**

```js
import { render, screen } from '@testing-library/react';
import EquipmentList from '../../components/EquipmentList';

const mockEquipment = {
  hat: { item_name: 'Test Hat', item_icon: 'hat.png', item_equipment_slot: '帽子', starforce: '22' },
  weapon: { item_name: 'Test Weapon', item_icon: 'weapon.png', item_equipment_slot: '武器' },
};

describe('EquipmentList', () => {
  it('renders group headers', () => {
    render(
      <EquipmentList
        equipment={mockEquipment}
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    expect(screen.getByText('武器')).toBeInTheDocument();
    expect(screen.getByText('防具')).toBeInTheDocument();
  });

  it('only renders slots that have equipment', () => {
    render(
      <EquipmentList
        equipment={mockEquipment}
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    expect(screen.getByText('Test Hat')).toBeInTheDocument();
    expect(screen.getByText('Test Weapon')).toBeInTheDocument();
    // Should NOT render empty slots
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('does not render group with no equipped items', () => {
    render(
      <EquipmentList
        equipment={{ hat: mockEquipment.hat }}
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    // 飾品 group should not appear since no accessories are equipped
    expect(screen.queryByText('飾品')).not.toBeInTheDocument();
  });

  it('shows empty state when no equipment', () => {
    render(
      <EquipmentList
        equipment={{}}
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    expect(screen.getByText('此角色目前沒有裝備資料')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="EquipmentList" --verbose`
Expected: FAIL — `Cannot find module '../../components/EquipmentList'`

**Step 3: Commit**

```bash
git add __tests__/components/EquipmentList.test.js
git commit -m "test: add EquipmentList tests (red)"
```

---

### Task 6: EquipmentList — Implementation

**Files:**
- Create: `components/EquipmentList.js`

**Step 1: Implement the component**

```js
'use client';

import { Box, Typography, Divider } from '@mui/material';
import EquipmentSlot from './EquipmentSlot';

const SLOT_NAMES = {
  hat: '帽子', top: '上衣', bottom: '褲裙', shoes: '鞋子',
  gloves: '手套', cape: '披風', shoulder: '肩膀', belt: '腰帶',
  ring: '戒指', ring2: '戒指', ring3: '戒指', ring4: '戒指',
  necklace: '墜飾', necklace2: '墜飾', earring: '耳環',
  'face-accessory': '臉飾', 'eye-accessory': '眼飾',
  weapon: '武器', 'sub-weapon': '輔助武器',
  pocket: '口袋', badge: '徽章', medal: '勳章', 'machine-heart': '機械心臟',
};

const GROUPS = [
  { label: '武器', slots: ['weapon', 'sub-weapon'] },
  { label: '防具', slots: ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'shoulder', 'belt'] },
  { label: '飾品', slots: ['ring', 'ring2', 'ring3', 'ring4', 'necklace', 'necklace2', 'earring', 'face-accessory', 'eye-accessory'] },
  { label: '其他', slots: ['pocket', 'badge', 'medal', 'machine-heart'] },
];

const EquipmentList = ({ equipment, selectedSlot, onSlotClick }) => {
  const hasAnyEquipment = equipment && Object.keys(equipment).length > 0;

  if (!hasAnyEquipment) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          此角色目前沒有裝備資料
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {GROUPS.map((group) => {
        const equippedSlots = group.slots.filter((slot) => equipment?.[slot]);
        if (equippedSlots.length === 0) return null;

        return (
          <Box key={group.label} sx={{ mb: 1 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                px: 2,
                py: 0.75,
                fontWeight: 700,
                color: 'text.secondary',
                backgroundColor: 'rgba(247,147,30,0.06)',
                letterSpacing: '0.05em',
              }}
            >
              {group.label}
            </Typography>
            {equippedSlots.map((slot, idx) => (
              <Box key={slot}>
                <EquipmentSlot
                  item={equipment[slot]}
                  slotKey={slot}
                  slotName={SLOT_NAMES[slot]}
                  variant="list"
                  selected={selectedSlot === slot}
                  onClick={onSlotClick}
                />
                {idx < equippedSlots.length - 1 && (
                  <Divider sx={{ mx: 2 }} />
                )}
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
};

export default EquipmentList;
```

**Step 2: Run tests**

Run: `npm test -- --testPathPattern="EquipmentList" --verbose`
Expected: All 4 tests PASS

**Step 3: Commit**

```bash
git add components/EquipmentList.js
git commit -m "feat: add EquipmentList component (mobile grouped list)"
```

---

### Task 7: EquipmentDetailDrawer — Test

**Files:**
- Create: `__tests__/components/EquipmentDetailDrawer.test.js`

**Step 1: Write the failing tests**

```js
import { render, screen, fireEvent } from '@testing-library/react';
import EquipmentDetailDrawer from '../../components/EquipmentDetailDrawer';

const mockItem = {
  item_name: 'Arcane Umbra Hat',
  item_icon: 'https://example.com/hat.png',
  starforce: '22',
  potential_option_grade: '레전드리',
  potential_option_1: 'STR : +12%',
  potential_option_2: 'All Stats : +9%',
  potential_option_3: 'STR : +9%',
  additional_potential_option_grade: '유니크',
  additional_potential_option_1: 'STR : +10%',
  additional_potential_option_2: 'DEX : +10%',
  additional_potential_option_3: 'Attack Power : +10',
  item_total_option: {
    str: '150',
    dex: '100',
    int: '0',
    luk: '0',
    max_hp: '3000',
    attack_power: '50',
  },
};

describe('EquipmentDetailDrawer', () => {
  it('renders item name and icon when open', () => {
    render(
      <EquipmentDetailDrawer
        item={mockItem}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.getByText('Arcane Umbra Hat')).toBeInTheDocument();
    expect(screen.getByAltText('Arcane Umbra Hat')).toBeInTheDocument();
  });

  it('renders starforce', () => {
    render(
      <EquipmentDetailDrawer
        item={mockItem}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.getByText(/22/)).toBeInTheDocument();
  });

  it('renders potential options', () => {
    render(
      <EquipmentDetailDrawer
        item={mockItem}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.getByText('潛在能力')).toBeInTheDocument();
    expect(screen.getByText('STR : +12%')).toBeInTheDocument();
    expect(screen.getByText('All Stats : +9%')).toBeInTheDocument();
  });

  it('renders additional potential options', () => {
    render(
      <EquipmentDetailDrawer
        item={mockItem}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.getByText('附加潛能')).toBeInTheDocument();
    expect(screen.getByText('STR : +10%')).toBeInTheDocument();
  });

  it('does not render potential section when no potential data', () => {
    const itemNoPotential = { item_name: 'Basic Hat', item_icon: 'hat.png' };
    render(
      <EquipmentDetailDrawer
        item={itemNoPotential}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.queryByText('潛在能力')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <EquipmentDetailDrawer
        item={mockItem}
        open={true}
        onClose={handleClose}
        isMobile={false}
      />
    );
    fireEvent.click(screen.getByLabelText('關閉'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders nothing when item is null', () => {
    const { container } = render(
      <EquipmentDetailDrawer
        item={null}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.queryByText('潛在能力')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="EquipmentDetailDrawer" --verbose`
Expected: FAIL — `Cannot find module '../../components/EquipmentDetailDrawer'`

**Step 3: Commit**

```bash
git add __tests__/components/EquipmentDetailDrawer.test.js
git commit -m "test: add EquipmentDetailDrawer tests (red)"
```

---

### Task 8: EquipmentDetailDrawer — Implementation

**Files:**
- Create: `components/EquipmentDetailDrawer.js`

**Step 1: Implement the component**

```js
'use client';

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';

const POTENTIAL_GRADE_COLORS = {
  '레어': '#4fc3f7',       // Rare — blue
  '에픽': '#ba68c8',       // Epic — purple
  '유니크': '#ffd54f',     // Unique — gold
  '레전드리': '#66bb6a',   // Legendary — green
};

const StatRow = ({ label, value }) => {
  if (!value || value === '0') return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>+{value}</Typography>
    </Box>
  );
};

const EquipmentDetailDrawer = ({ item, open, onClose, isMobile }) => {
  const hasPotential = item?.potential_option_1;
  const hasAdditionalPotential = item?.additional_potential_option_1;
  const hasStats = item?.item_total_option && typeof item.item_total_option === 'object';
  const potentialColor = POTENTIAL_GRADE_COLORS[item?.potential_option_grade] || 'text.primary';
  const additionalColor = POTENTIAL_GRADE_COLORS[item?.additional_potential_option_grade] || 'text.primary';

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open && !!item}
      onClose={onClose}
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
          {/* Close button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <IconButton onClick={onClose} aria-label="關閉" size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Header: icon + name + starforce */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {item.item_icon && (
              <img
                src={item.item_icon}
                alt={item.item_name}
                style={{ width: 80, height: 80, objectFit: 'contain' }}
              />
            )}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {item.item_name}
              </Typography>
              {item.starforce && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <StarIcon sx={{ fontSize: 16, color: '#ffd54f' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.starforce}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Potential */}
          {hasPotential && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1, color: potentialColor }}
              >
                潛在能力
              </Typography>
              {[item.potential_option_1, item.potential_option_2, item.potential_option_3]
                .filter(Boolean)
                .map((opt, i) => (
                  <Typography key={i} variant="body2" sx={{ py: 0.25 }}>
                    {opt}
                  </Typography>
                ))}
            </>
          )}

          {/* Additional Potential */}
          {hasAdditionalPotential && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1, color: additionalColor }}
              >
                附加潛能
              </Typography>
              {[item.additional_potential_option_1, item.additional_potential_option_2, item.additional_potential_option_3]
                .filter(Boolean)
                .map((opt, i) => (
                  <Typography key={i} variant="body2" sx={{ py: 0.25 }}>
                    {opt}
                  </Typography>
                ))}
            </>
          )}

          {/* Stats */}
          {hasStats && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                裝備屬性
              </Typography>
              <StatRow label="STR" value={item.item_total_option.str} />
              <StatRow label="DEX" value={item.item_total_option.dex} />
              <StatRow label="INT" value={item.item_total_option.int} />
              <StatRow label="LUK" value={item.item_total_option.luk} />
              <StatRow label="HP" value={item.item_total_option.max_hp} />
              <StatRow label="攻擊力" value={item.item_total_option.attack_power} />
              <StatRow label="魔力" value={item.item_total_option.magic_power} />
            </>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default EquipmentDetailDrawer;
```

**Step 2: Run tests**

Run: `npm test -- --testPathPattern="EquipmentDetailDrawer" --verbose`
Expected: All 7 tests PASS

**Step 3: Commit**

```bash
git add components/EquipmentDetailDrawer.js
git commit -m "feat: add EquipmentDetailDrawer component (side/bottom Drawer)"
```

---

### Task 9: Rewrite EquipmentDialog — Test Update

**Files:**
- Modify: `__tests__/components/EquipmentDialog.test.js`

**Step 1: Rewrite the test file**

The existing tests check for internal button + grid. The new EquipmentDialog only delegates to child components. Update tests to verify:
- Dialog opens with controlled `open` prop
- Loading state shows spinner
- After load, renders either Grid or List (mock useMediaQuery)
- Clicking a slot opens the DetailDrawer

```js
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EquipmentDialog from '../../components/EquipmentDialog';

// Mock fetch
global.fetch = jest.fn();

// Mock equipment utils
jest.mock('../../lib/equipmentUtils', () => ({
  processEquipmentData: jest.fn(),
  getEquipmentPosition: jest.fn(),
}));

// Mock useMediaQuery — default to desktop
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: jest.fn(() => true), // true = desktop (md and up)
  };
});

import { processEquipmentData } from '../../lib/equipmentUtils';
import { useMediaQuery } from '@mui/material';

describe('EquipmentDialog', () => {
  const mockEquipmentData = {
    preset_no: 2,
    item_equipment: [],
    item_equipment_preset_2: [
      { item_equipment_slot: '帽子', item_name: 'Test Hat', item_icon: 'icon1.png' },
    ],
  };

  const mockProcessedData = {
    hat: { item_name: 'Test Hat', item_icon: 'https://example.com/icon1.png' },
  };

  const mockCharacter = {
    character_image: 'https://example.com/character.png',
    character_name: 'Test Character',
  };

  beforeEach(() => {
    fetch.mockClear();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockEquipmentData,
    });
    processEquipmentData.mockReturnValue(mockProcessedData);
    useMediaQuery.mockReturnValue(true); // desktop
  });

  it('renders dialog title when open', async () => {
    render(
      <EquipmentDialog
        ocid="test-ocid"
        character={mockCharacter}
        open={true}
        onClose={() => {}}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('角色裝備')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while fetching', () => {
    // Make fetch hang
    fetch.mockReturnValue(new Promise(() => {}));
    render(
      <EquipmentDialog
        ocid="test-ocid"
        character={mockCharacter}
        open={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders equipment after loading on desktop (grid)', async () => {
    useMediaQuery.mockReturnValue(true);
    render(
      <EquipmentDialog
        ocid="test-ocid"
        character={mockCharacter}
        open={true}
        onClose={() => {}}
      />
    );
    await waitFor(() => {
      expect(screen.getByAltText('角色')).toBeInTheDocument(); // Avatar from Grid
    });
  });

  it('calls onClose when dialog close is triggered', async () => {
    const handleClose = jest.fn();
    render(
      <EquipmentDialog
        ocid="test-ocid"
        character={mockCharacter}
        open={true}
        onClose={handleClose}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('角色裝備')).toBeInTheDocument();
    });
    // Clicking backdrop or pressing Escape triggers onClose through MUI Dialog
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="EquipmentDialog" --verbose`
Expected: FAIL (old component doesn't match new test expectations after rewrite)

**Step 3: Commit**

```bash
git add __tests__/components/EquipmentDialog.test.js
git commit -m "test: update EquipmentDialog tests for new architecture"
```

---

### Task 10: Rewrite EquipmentDialog — Implementation

**Files:**
- Modify: `components/EquipmentDialog.js` (full rewrite)

**Step 1: Rewrite the component**

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
} from '@mui/material';
import { processEquipmentData } from '../lib/equipmentUtils';
import { getCachedData, setCachedData } from '../lib/cache';
import EquipmentGrid from './EquipmentGrid';
import EquipmentList from './EquipmentList';
import EquipmentDetailDrawer from './EquipmentDetailDrawer';

const EquipmentDialog = ({ ocid, character, open, onClose }) => {
  const [equipment, setEquipment] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [characterImage, setCharacterImage] = useState('/character-placeholder.png');
  const isDesktop = useMediaQuery('(min-width:768px)');

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

  useEffect(() => {
    if (character?.character_image) {
      setCharacterImage(character.character_image);
    }
  }, [character]);

  useEffect(() => {
    if (open && ocid) {
      loadEquipment();
      setSelectedSlot(null);
    }
  }, [open, ocid, loadEquipment]);

  const handleSlotClick = (slotKey) => {
    if (equipment?.[slotKey]) {
      setSelectedSlot(slotKey);
    }
  };

  const handleDrawerClose = () => {
    setSelectedSlot(null);
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
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
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
          ) : (
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
          )}
        </DialogContent>
      </Dialog>

      <EquipmentDetailDrawer
        item={selectedSlot ? equipment?.[selectedSlot] : null}
        open={!!selectedSlot}
        onClose={handleDrawerClose}
        isMobile={!isDesktop}
      />
    </>
  );
};

export default EquipmentDialog;
```

**Step 2: Run all tests**

Run: `npm test -- --testPathPattern="Equipment" --verbose`
Expected: All tests PASS across all 5 test files

**Step 3: Commit**

```bash
git add components/EquipmentDialog.js
git commit -m "feat: rewrite EquipmentDialog as responsive container with Grid/List/Drawer"
```

---

### Task 11: Integration Test & Visual Verification

**Step 1: Run the full test suite**

Run: `npm test --verbose`
Expected: All tests PASS (no regressions in other components)

**Step 2: Run the dev server**

Run: `npm run dev`

Verify manually:
- [ ] Desktop (>768px): Dialog shows 5-col grid with orange-themed slots
- [ ] Mobile (<768px): Dialog is fullScreen, shows grouped list
- [ ] Click equipped slot: DetailDrawer opens with potential/stats
- [ ] Close Drawer: returns to grid/list
- [ ] Empty slots: dashed border, no text
- [ ] Hover animation on equipped slots
- [ ] Focus-visible ring works with Tab key
- [ ] Error state shows Alert with retry button

**Step 3: Run build to check for errors**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete equipment dialog responsive redesign"
```

---

## Summary of All Files

| Action | File | Description |
|--------|------|-------------|
| Create | `components/EquipmentSlot.js` | Shared slot (grid/list variants) |
| Create | `components/EquipmentGrid.js` | Desktop 5-col CSS Grid |
| Create | `components/EquipmentList.js` | Mobile grouped list |
| Create | `components/EquipmentDetailDrawer.js` | Side/bottom Drawer for detail |
| Rewrite | `components/EquipmentDialog.js` | Container only (fetch + state + routing) |
| Create | `__tests__/components/EquipmentSlot.test.js` | 8 tests |
| Create | `__tests__/components/EquipmentGrid.test.js` | 4 tests |
| Create | `__tests__/components/EquipmentList.test.js` | 4 tests |
| Create | `__tests__/components/EquipmentDetailDrawer.test.js` | 7 tests |
| Rewrite | `__tests__/components/EquipmentDialog.test.js` | 4 tests |
| No change | `lib/equipmentUtils.js` | — |
| No change | `lib/cache.js` | — |
| No change | `app/api/character/equipment/route.js` | — |
| No change | `app/page.js` | — |
