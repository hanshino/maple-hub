'use client';

import { Box, Avatar, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
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
  ['ring3', 'earring', null, 'weapon', 'shoes'],
  ['ring4', null, null, null, null],
];

const computeTotalStats = equipment => {
  const totals = {};
  Object.values(equipment).forEach(item => {
    if (!item?.cash_item_option) return;
    item.cash_item_option.forEach(opt => {
      const key = opt.option_type;
      const val = parseInt(opt.option_value) || 0;
      totals[key] = (totals[key] || 0) + val;
    });
  });
  return totals;
};

const CashItemGrid = ({
  equipment,
  characterImage,
  selectedSlot,
  onSlotClick,
}) => {
  const totalStats = computeTotalStats(equipment || {});
  const hasStats = Object.keys(totalStats).length > 0;

  return (
    <Box>
      {hasStats && (
        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            flexWrap: 'wrap',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          {Object.entries(totalStats).map(([type, value]) => (
            <Chip
              key={type}
              label={`${type} +${value}`}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                backgroundColor: theme =>
                  alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              }}
            />
          ))}
        </Box>
      )}
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
    </Box>
  );
};

export default CashItemGrid;
