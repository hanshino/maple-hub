'use client';

import { Box, Typography, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
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

const GROUPS = [
  { label: '武器', slots: ['weapon', 'sub-weapon'] },
  {
    label: '防具',
    slots: [
      'hat',
      'top',
      'bottom',
      'shoes',
      'gloves',
      'cape',
      'shoulder',
      'belt',
    ],
  },
  {
    label: '飾品',
    slots: [
      'ring',
      'ring2',
      'ring3',
      'ring4',
      'necklace',
      'necklace2',
      'earring',
      'face-accessory',
      'eye-accessory',
    ],
  },
  {
    label: '其他',
    slots: ['pocket', 'badge', 'medal', 'machine-heart'],
  },
];

const EquipmentList = ({ equipment, selectedSlot, onSlotClick }) => {
  const hasAnyEquipment =
    equipment && Object.keys(equipment).length > 0;

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
        const equippedSlots = group.slots.filter(
          (slot) => equipment?.[slot]
        );
        if (equippedSlots.length === 0) return null;

        return (
          <Box key={group.label} sx={{ mb: 1 }}>
            <Typography
              role="heading"
              aria-level={3}
              variant="caption"
              sx={{
                display: 'block',
                px: 2,
                py: 0.75,
                fontWeight: 700,
                color: 'text.secondary',
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, 0.06),
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
