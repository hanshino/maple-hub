'use client';

import { Box, Grid, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

const PUZZLE_SLOT_RE = /^拼圖(\d+)$/;
const TOTEM_SLOT_RE = /^圖騰\d+$/;
const SPECIAL_RING_SLOT = '輔助特殊技能戒指';
const SPECIAL_GEM_SLOT = '寶石';

const PUZZLE_TOTAL = 12;

/**
 * Classifies an item by `item_equipment_slot` ONLY — never by
 * `item_equipment_part` (the sub-weapon uses part='寶石' but must stay in
 * the main equipment grid).
 */
export const isSpecialEquipmentSlot = slot => {
  if (!slot) return false;
  if (PUZZLE_SLOT_RE.test(slot)) return true;
  if (TOTEM_SLOT_RE.test(slot)) return true;
  return slot === SPECIAL_RING_SLOT || slot === SPECIAL_GEM_SLOT;
};

// Order mirrors the spec: STR/DEX/INT/LUK/全屬性/攻擊力/魔力/防禦.
const STAT_FIELDS = [
  ['str', 'STR', false],
  ['dex', 'DEX', false],
  ['int', 'INT', false],
  ['luk', 'LUK', false],
  ['all_stat', '全屬性', true],
  ['attack_power', '攻擊力', false],
  ['magic_power', '魔力', false],
  ['armor', '防禦', false],
];

const getStatLine = item => {
  const total = item.item_total_option || {};
  const parts = STAT_FIELDS.map(([key, label, isPercent]) => {
    const value = parseInt(total[key]) || 0;
    if (!value) return null;
    return `${label} +${value}${isPercent ? '%' : ''}`;
  }).filter(Boolean);
  return parts.length ? parts.join('、') : '無屬性加成';
};

const panelSx = {
  p: 3,
  borderRadius: 3,
  border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  bgcolor: theme =>
    alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'dark' ? 0.04 : 0.03
    ),
};

const tileSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  p: 1.5,
  borderRadius: 2,
  border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  bgcolor: theme =>
    alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'dark' ? 0.06 : 0.04
    ),
};

/**
 * Non-clickable panel for special equipment slots (拼圖/圖騰/輔助特殊技能戒指/寶石)
 * that only carry item_total_option data — no potential/starforce, so they
 * don't belong in the interactive EquipmentCardCompact grid. Puzzle pieces
 * are stitched into a single 3x4 collage using their slot number.
 */
const SpecialEquipmentPanel = ({ items }) => {
  const specialItems = (items || []).filter(item =>
    isSpecialEquipmentSlot(item.item_equipment_slot)
  );
  if (specialItems.length === 0) return null;

  const puzzlePieces = specialItems.filter(item =>
    PUZZLE_SLOT_RE.test(item.item_equipment_slot)
  );
  const otherItems = specialItems.filter(
    item => !PUZZLE_SLOT_RE.test(item.item_equipment_slot)
  );

  let sumAttack = 0;
  let sumMagic = 0;
  puzzlePieces.forEach(piece => {
    const total = piece.item_total_option || {};
    sumAttack += parseInt(total.attack_power) || 0;
    sumMagic += parseInt(total.magic_power) || 0;
  });
  const puzzleTotals = [
    sumAttack > 0 && `攻擊力合計 +${sumAttack}`,
    sumMagic > 0 && `魔力合計 +${sumMagic}`,
  ]
    .filter(Boolean)
    .join('、');

  return (
    <Box sx={{ ...panelSx, mt: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        特殊裝備
      </Typography>

      {puzzlePieces.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
            mb: otherItems.length > 0 ? 3 : 0,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 48px)',
              gridTemplateRows: 'repeat(4, 48px)',
              gap: 0,
              border: theme =>
                `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            }}
          >
            {puzzlePieces.map(piece => {
              const n = parseInt(
                piece.item_equipment_slot.match(PUZZLE_SLOT_RE)[1],
                10
              );
              const column = ((n - 1) % 3) + 1;
              const row = Math.floor((n - 1) / 3) + 1;
              return (
                <Box
                  key={piece.item_equipment_slot}
                  component="img"
                  src={piece.item_icon}
                  alt={piece.item_name}
                  sx={{
                    gridColumn: column,
                    gridRow: row,
                    width: 48,
                    height: 48,
                    display: 'block',
                    imageRendering: 'pixelated',
                  }}
                />
              );
            })}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {puzzlePieces.length} / {PUZZLE_TOTAL} 片
            </Typography>
            {puzzleTotals && (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {puzzleTotals}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {otherItems.length > 0 && (
        <Grid container spacing={2}>
          {otherItems.map(item => (
            <Grid key={item.item_equipment_slot} size={{ xs: 12, md: 6 }}>
              <Box sx={tileSx}>
                {item.item_icon && (
                  <Box
                    component="img"
                    src={item.item_icon}
                    alt={item.item_name}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                    {item.item_name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    {getStatLine(item)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SpecialEquipmentPanel;
