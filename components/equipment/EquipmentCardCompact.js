'use client';

import { Box, Typography, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import StarIcon from '@mui/icons-material/Star';
import { parsePotentialOption } from '../../lib/combatPowerCalculator';
import { POTENTIAL_GRADE_COLORS } from '../EquipmentDetailDrawer';

// Fallback labels when no potential line is parseable — only used to
// summarize item_total_option, not to re-derive potential text parsing.
const FALLBACK_STAT_LABELS = {
  all_stat: { label: '全屬性', isPercent: true },
  boss_damage: { label: 'Boss傷害', isPercent: true },
  ignore_monster_armor: { label: '無視防禦', isPercent: true },
  attack_power: { label: '攻擊力', isPercent: false },
  magic_power: { label: '魔力', isPercent: false },
  str: { label: 'STR', isPercent: false },
  dex: { label: 'DEX', isPercent: false },
  int: { label: 'INT', isPercent: false },
  luk: { label: 'LUK', isPercent: false },
};

const getStatSummary = item => {
  const potentialLines = [
    item.potential_option_1,
    item.potential_option_2,
    item.potential_option_3,
  ]
    .map(parsePotentialOption)
    .filter(Boolean);

  const line = potentialLines.find(p => p.isPercent) || potentialLines[0];
  if (line) {
    return `${line.stat} +${line.value}${line.isPercent ? '%' : ''}`;
  }

  const total = item.item_total_option;
  if (total && typeof total === 'object') {
    let best = null;
    for (const [key, meta] of Object.entries(FALLBACK_STAT_LABELS)) {
      const raw = parseFloat(total[key]);
      if (!Number.isNaN(raw) && raw > 0 && (!best || raw > best.raw)) {
        best = { raw, ...meta };
      }
    }
    if (best) {
      return `${best.label} +${best.raw}${best.isPercent ? '%' : ''}`;
    }
  }

  return null;
};

const cardSx = {
  display: 'flex',
  flexDirection: 'column',
  p: 2,
  borderRadius: 3,
  cursor: 'pointer',
  height: '100%',
  backdropFilter: 'blur(8px)',
  border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  bgcolor: theme =>
    alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'dark' ? 0.06 : 0.04
    ),
  transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme => `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
  '&:focus-visible': {
    outline: theme => `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:hover': { transform: 'none' },
  },
};

const emptyCardSx = {
  ...cardSx,
  cursor: 'default',
  alignItems: 'center',
  justifyContent: 'center',
  border: theme =>
    theme.palette.mode === 'dark' ? '1px dashed #5a4a38' : '1px dashed #e0c9a8',
  bgcolor: 'transparent',
  '&:hover': {},
};

/**
 * Information-dense equipment card for the maplescouter-style equipment
 * section — icon, name, starforce, potential grade, and a one-line stat
 * summary. Reuses potential grade colors from EquipmentDetailDrawer and
 * the potential-text parser from combatPowerCalculator (no re-derivation).
 */
const EquipmentCardCompact = ({ item, slotName, onClick }) => {
  if (!item) {
    return (
      <Box sx={emptyCardSx} aria-label={slotName ? `${slotName}：空` : '空'}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {slotName || '空'}
        </Typography>
      </Box>
    );
  }

  const starforce = parseInt(item.starforce) || 0;
  const grade = item.potential_option_grade;
  const gradeColor = grade ? POTENTIAL_GRADE_COLORS[grade] : null;
  const summary = getStatSummary(item);

  const handleClick = () => onClick?.(item);
  const handleKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`${item.item_name}${starforce ? `，星力 ${starforce}` : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={cardSx}
    >
      <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
        {item.item_icon && (
          <img
            src={item.item_icon}
            alt={item.item_name}
            style={{
              width: 40,
              height: 40,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ fontWeight: 700, lineHeight: 1.3 }}
          >
            {item.item_name}
          </Typography>
          {starforce > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <StarIcon sx={{ fontSize: 13, color: '#ffd54f' }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {starforce}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {grade && (
        <Chip
          label={grade}
          size="small"
          variant="outlined"
          sx={{
            alignSelf: 'flex-start',
            mt: 0.75,
            height: 20,
            px: 1,
            fontWeight: 700,
            fontSize: '0.65rem',
            color: gradeColor,
            borderColor: gradeColor ? alpha(gradeColor, 0.5) : 'divider',
            bgcolor: gradeColor ? alpha(gradeColor, 0.12) : 'transparent',
          }}
        />
      )}

      <Typography
        variant="caption"
        sx={{
          mt: 0.75,
          fontWeight: 600,
          color: summary ? 'primary.main' : 'text.disabled',
        }}
      >
        {summary || '尚無潛能資訊'}
      </Typography>
    </Box>
  );
};

export default EquipmentCardCompact;
