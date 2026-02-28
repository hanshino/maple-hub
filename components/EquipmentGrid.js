'use client';

import { Box, Avatar } from '@mui/material';
import EquipmentSlot from './EquipmentSlot';

const SLOT_NAMES = {
  hat: '帽子',
  top: '上衣',
  bottom: '褲裙',
  shoes: '鞋子',
  gloves: '手套',
  cape: '披風',
  shoulder: '肩膀',
  belt: '腰帶',
  ring: '戒指',
  ring2: '戒指',
  ring3: '戒指',
  ring4: '戒指',
  necklace: '墜飾',
  necklace2: '墜飾',
  earring: '耳環',
  'face-accessory': '臉飾',
  'eye-accessory': '眼飾',
  weapon: '武器',
  'sub-weapon': '輔助武器',
  pocket: '口袋',
  badge: '徽章',
  medal: '勳章',
  'machine-heart': '機械心臟',
};

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
