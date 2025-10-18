# Quick Start: Add Character Details to Home Page

**Date**: 2025-10-19  
**Feature**: 008-add-character-details-home

## Overview

This guide provides a quick start for implementing the character details feature, which adds equipment dialog and stats display to the home page.

## Prerequisites

- Next.js 14 application with React 18
- Material-UI components installed
- Axios for API calls
- Existing character card component
- Nexon MapleStory API access

## Implementation Steps

### 1. Create Equipment Dialog Component

Create `components/EquipmentDialog.js`:

```javascript
// Key implementation points:
// - Use Material-UI Dialog, Grid, Paper components
// - Fixed 100x100px slots for consistent layout
// - Character image in center of equipment grid
// - Handle image loading errors gracefully
// - Support keyboard navigation
```

### 2. Create Character Stats Component

Create `components/CharacterStats.js`:

```javascript
// Key implementation points:
// - Display stats in table format with paired rows (屬性: 數值   屬性: 數值)
// - Merge min/max stat pairs into ranges (e.g., 最低屬性攻擊力/最高屬性攻擊力 → 100-200)
// - Handle loading and error states
// - Responsive design for mobile devices
// - Filter out non-essential stats during implementation
```

### 3. Update Equipment Data Processing

Update `lib/equipmentUtils.js`:

```javascript
// Key implementation points:
// - Fix equipment slot mapping (use item_equipment_slot as key)
// - Support preset equipment merging
// - Handle empty slots gracefully
```

### 4. Add API Integration

Create `lib/api/character.js` and `lib/api/equipment.js`:

```javascript
// Key implementation points:
// - Implement 5-minute caching with client-side storage (localStorage optional)
// - Handle API errors by hiding blocks
// - Support preset equipment fetching
```

### 5. Update Home Page

Modify `app/page.js`:

```javascript
// Key implementation points:
// - Add equipment button to existing character card
// - Add stats block below character card
// - Handle loading states for both blocks
// - Ensure responsive layout
```

## Testing Checklist

### Unit Tests

- [ ] EquipmentDialog renders correctly with 100x100px slots
- [ ] CharacterStats displays paired rows and merged ranges
- [ ] Equipment data processing handles presets correctly
- [ ] API caching works with 5-minute expiry

### Integration Tests

- [ ] Equipment dialog opens on button click
- [ ] Stats load within 2 seconds
- [ ] Error states hide blocks appropriately
- [ ] Responsive design works on mobile

### Accessibility Tests

- [ ] Keyboard navigation in equipment dialog
- [ ] Screen reader support for stat values
- [ ] High contrast support

## Common Issues & Solutions

### Equipment Not Displaying

- Check `item_equipment_slot` mapping in `equipmentUtils.js`
- Verify preset merging logic uses correct key
- Ensure API returns expected data structure

### Stats Layout Issues

- Confirm paired row logic in CharacterStats component
- Check min/max stat merging implementation
- Verify responsive breakpoints for table display

### Performance Issues

- Implement proper memoization for data processing
- Use lazy loading for equipment images
- Optimize re-rendering with useMemo/useCallback

## File Structure

```
components/
├── EquipmentDialog.js      # New equipment dialog (100x100px slots)
├── CharacterStats.js       # New stats display (paired rows, merged ranges)
└── CharacterCard.js        # Modified to add equipment button

lib/
├── equipmentUtils.js       # Updated equipment processing (slot-based mapping)
├── api/
│   ├── character.js        # New character API calls
│   └── equipment.js        # New equipment API calls
└── cache.js                # Caching utilities (5-minute TTL)

__tests__/
├── components/
│   ├── EquipmentDialog.test.js
│   └── CharacterStats.test.js
└── api/
    ├── character.test.js
    └── equipment.test.js
```

## Success Criteria

- [ ] Equipment dialog shows all equipped items in 100x100px grid layout
- [ ] Stats display in organized table format with paired rows and merged ranges
- [ ] Page loads within 2 seconds
- [ ] 95% of users see character details without errors
- [ ] Responsive design works on all screen sizes</content>
      <parameter name="filePath">e:\workspace\maplestory\specs\008-add-character-details-home\quickstart.md
