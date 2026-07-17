'use client';

import { Box, Avatar } from '@mui/material';
import EquipmentSlot from './EquipmentSlot';
import { SLOT_LABELS } from '../lib/equipmentUtils';

// Grid layout: 6 rows x 5 cols.
// null = empty spacer, 'avatar' = character image.
const GRID_LAYOUT = [
  ['ring', 'eye-accessory', 'avatar', 'hat', 'cape'],
  ['ring2', 'face-accessory', null, 'top', 'gloves'],
  ['ring3', 'earring', null, 'bottom', 'shoes'],
  ['ring4', 'necklace', null, 'shoulder', 'medal'],
  ['belt', 'necklace2', 'weapon', 'sub-weapon', 'badge'],
  [null, 'pocket', null, 'machine-heart', null],
];

const EquipmentGrid = ({
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
            slotName={SLOT_LABELS[cell]}
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
