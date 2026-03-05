# Scroll Analysis Feature Design

## Goal

Analyze equipment scroll upgrades and display the inferred scroll type(s) in the EquipmentDetailDrawer.

## Data Sources (already in API response, currently unused)

- `scroll_upgrade` — number of scrolls applied
- `scroll_upgradeable_count` — remaining upgrade slots
- `item_etc_option.attack_power / magic_power` — total stats from scrolls
- `item_equipment_part` — equipment category for lookup table selection

## Equipment Categories

| Category | Parts |
|----------|-------|
| weapon | 武器 |
| armor | 帽子, 上衣, 褲/裙, 套服, 鞋子, 手套, 披風, 肩膀裝飾 |
| accessory | everything else (rings, necklaces, earring, face/eye, belt, pocket, machine-heart, badge) |

Armor and accessory share the same scroll value table.

## Scroll Value Tables (attack/magic per scroll)

**Weapon:** 究極黑暗=14, V=13, X=12, RED=10
**Armor/Accessory:** 究極黑暗=9, V=8, X=7, RED=5

## Analysis Logic

```
power = max(attack_power, magic_power) from item_etc_option
avg = power / scroll_upgrade

1. avg > highest fixed value → random scroll → show "平均 +XX.X x N張"
2. power == fixedValue × scrollCount → single type → show "NAME x N"
3. avg < RED value → premium → show "優質 x N"
4. Try all pairs of fixed scrolls, solve linear equations:
   a + b = scrollCount, valA*a + valB*b = power
   Integer solution → mix → show "V x1 + X x2"
5. No integer solution → unknown → show "平均 +XX.X x N張"
```

## Files Changed

1. `lib/equipmentUtils.js` — add `getEquipmentCategory()`, `analyzeScrolls()`
2. `components/EquipmentDetailDrawer.js` — add scroll info section after stats
3. `__tests__/lib/equipmentUtils.test.js` — add scroll analysis tests
4. `__tests__/components/EquipmentDetailDrawer.test.js` — update component tests

## UI

Small section below stats: "卷軸 (used/total)" header with analysis result below.
Hidden when `scroll_upgrade` is 0 or missing.
