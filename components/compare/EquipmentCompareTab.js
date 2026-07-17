'use client';

import { useState } from 'react';
import { Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { processEquipmentData } from '../../lib/equipmentUtils';
import {
  EVIDENCE_COLORS,
  EVIDENCE_LABELS,
  formatDelta,
  formatRawValue,
} from './compareFormat';

// Display order for the per-slot list — a presentation concern only,
// mirroring components/equipment/EquipmentSection.js's own local copy.
// Never used to rank slots by predicted combat-power gain.
const SLOT_ORDER = [
  'hat',
  'face-accessory',
  'eye-accessory',
  'earring',
  'top',
  'bottom',
  'shoulder',
  'cape',
  'gloves',
  'shoes',
  'belt',
  'ring',
  'ring2',
  'ring3',
  'ring4',
  'necklace',
  'necklace2',
  'weapon',
  'sub-weapon',
  'pocket',
  'badge',
  'medal',
  'machine-heart',
];

const SLOT_LABELS = {
  hat: '帽子',
  'face-accessory': '臉飾',
  'eye-accessory': '眼飾',
  earring: '耳環',
  top: '上衣',
  bottom: '褲/裙',
  shoulder: '肩膀裝飾',
  cape: '披風',
  gloves: '手套',
  shoes: '鞋子',
  belt: '腰帶',
  ring: '戒指1',
  ring2: '戒指2',
  ring3: '戒指3',
  ring4: '戒指4',
  necklace: '墜飾',
  necklace2: '墜飾2',
  weapon: '武器',
  'sub-weapon': '輔助武器',
  pocket: '口袋道具',
  badge: '徽章',
  medal: '勳章',
  'machine-heart': '機器心臟',
};

const STAT_LABELS = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'int', label: 'INT' },
  { key: 'luk', label: 'LUK' },
  { key: 'attack_power', label: '攻擊力' },
  { key: 'magic_power', label: '魔力' },
  { key: 'boss_damage', label: 'BOSS傷害' },
  { key: 'ignore_monster_armor', label: '無視防禦' },
  { key: 'all_stat', label: '全屬性%' },
];

function ItemFixedStats({ item }) {
  const total = item?.item_total_option;
  if (!total || typeof total !== 'object') return null;
  const entries = STAT_LABELS.filter(({ key }) => parseInt(total[key]) > 0);
  if (entries.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {entries.map(({ key, label }) => (
        <Chip
          key={key}
          label={`${label} +${total[key]}`}
          size="small"
          variant="outlined"
          sx={{ px: 1, height: 20, fontSize: '0.65rem' }}
        />
      ))}
    </Box>
  );
}

function ItemPotential({ item, prefix, title }) {
  const lines = [1, 2, 3].map(n => item?.[`${prefix}_${n}`]).filter(Boolean);
  if (lines.length === 0) return null;
  const grade = item?.[`${prefix}_grade`];
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        {title}
        {grade ? `（${grade}）` : ''}
      </Typography>
      {lines.map((line, i) => (
        <Typography key={i} variant="caption" sx={{ display: 'block' }}>
          {line}
        </Typography>
      ))}
    </Box>
  );
}

// A nullish (absent) starforce field is genuinely unknown — never shown
// as 0, per the spec's unknown-never-zero principle. An actual 0 (real
// zero-star item) is still shown as 0.
function formatStarforce(value) {
  if (value === null || value === undefined || value === '') return '未知';
  return value;
}

function hasNonZero(optionObject) {
  return (
    !!optionObject &&
    Object.values(optionObject).some(value => parseInt(value) > 0)
  );
}

function ItemDetail({ item, sideLabel }) {
  if (!item) {
    return (
      <Box sx={{ p: 2, flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.disabled">
          {sideLabel}：此格未裝備
        </Typography>
      </Box>
    );
  }

  const hasScrollOrFlame =
    hasNonZero(item.item_etc_option) || hasNonZero(item.item_add_option);

  return (
    <Box
      sx={{
        p: 2,
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        bgcolor: 'action.hover',
        borderRadius: 2,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {sideLabel}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
        {item.item_name}
      </Typography>
      <Typography variant="caption">
        星力 {formatStarforce(item.starforce)}
      </Typography>
      <ItemFixedStats item={item} />
      {hasScrollOrFlame && (
        <Typography variant="caption" color="text.secondary">
          含卷軸／星火加成
        </Typography>
      )}
      <ItemPotential item={item} prefix="potential_option" title="潛在能力" />
      <ItemPotential
        item={item}
        prefix="additional_potential_option"
        title="附加潛能"
      />
    </Box>
  );
}

/**
 * Per-slot equipment comparison with expandable detail (fixed stats, star
 * force, scroll/flame additions, potential, additional potential). Slot
 * pairing and per-item fields are read directly from each side's raw
 * active-preset equipment (via the existing processEquipmentData helper)
 * — this is side-by-side rendering of two independent API payloads, not
 * comparison math, so it does not route through
 * lib/characterComparison.js. Never ranks slots by predicted
 * combat-power gain.
 */
export default function EquipmentCompareTab({
  leftEquipmentData,
  rightEquipmentData,
  starSumRow,
  starForceRow,
}) {
  const [expandedSlot, setExpandedSlot] = useState(null);

  const leftBySlot = leftEquipmentData
    ? processEquipmentData(leftEquipmentData)
    : {};
  const rightBySlot = rightEquipmentData
    ? processEquipmentData(rightEquipmentData)
    : {};

  const slots = SLOT_ORDER.filter(
    slot => leftBySlot[slot] || rightBySlot[slot]
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          columnGap: 4,
          rowGap: 2,
          mb: 3,
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            現有裝備星力總和
          </Typography>
          <Typography sx={{ fontWeight: 800 }}>
            {formatRawValue(starSumRow.left, starSumRow.unit)} /{' '}
            {formatRawValue(starSumRow.right, starSumRow.unit)}（
            {formatDelta(starSumRow.delta, starSumRow.unit)}）
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            面板星力（與現有裝備星力總和不同）
          </Typography>
          <Typography sx={{ fontWeight: 800 }}>
            {formatRawValue(starForceRow.left, starForceRow.unit)} /{' '}
            {formatRawValue(starForceRow.right, starForceRow.unit)}（
            {formatDelta(starForceRow.delta, starForceRow.unit)}）
          </Typography>
        </Box>
        <Chip
          label={EVIDENCE_LABELS[starSumRow.evidence]}
          size="small"
          color={EVIDENCE_COLORS[starSumRow.evidence]}
          sx={{ px: 1 }}
        />
      </Box>

      {slots.length === 0 ? (
        <Typography color="text.secondary">尚無裝備資料可比較</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {slots.map(slot => {
            const leftItem = leftBySlot[slot];
            const rightItem = rightBySlot[slot];
            const expanded = expandedSlot === slot;
            const slotLabel = SLOT_LABELS[slot] || slot;
            return (
              <Box
                key={slot}
                sx={{
                  py: 1.5,
                  '&:not(:last-child)': {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography sx={{ fontWeight: 700, minWidth: 72 }}>
                    {slotLabel}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ flex: 1, minWidth: 0 }}
                    noWrap
                  >
                    {leftItem?.item_name || '未裝備'}
                    {leftItem?.starforce ? `（★${leftItem.starforce}）` : ''}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ flex: 1, minWidth: 0 }}
                    noWrap
                  >
                    {rightItem?.item_name || '未裝備'}
                    {rightItem?.starforce ? `（★${rightItem.starforce}）` : ''}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setExpandedSlot(expanded ? null : slot)}
                    aria-label={`${expanded ? '收合' : '展開'}${slotLabel}詳細資訊`}
                    aria-expanded={expanded}
                    sx={{
                      transform: expanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <ExpandMoreIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Collapse in={expanded}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      mt: 1.5,
                      flexDirection: { xs: 'column', sm: 'row' },
                    }}
                  >
                    <ItemDetail item={leftItem} sideLabel="我的角色" />
                    <ItemDetail item={rightItem} sideLabel="參考角色" />
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
