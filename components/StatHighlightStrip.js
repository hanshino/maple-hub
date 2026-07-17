'use client';

import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { extractBalanceStats } from '../lib/statBalance';
import { formatStatValue } from '../lib/statsUtils';

const MAIN_STAT_KEYS = ['STR', 'DEX', 'INT', 'LUK'];

const getMainStatName = (finalStats, characterClass) => {
  if (characterClass === '惡魔復仇者') {
    return finalStats.some(stat => stat.stat_name === 'HP') ? 'HP' : null;
  }

  let bestName = null;
  let bestValue = -1;
  for (const name of MAIN_STAT_KEYS) {
    const entry = finalStats.find(s => s.stat_name === name);
    const value = entry ? parseFloat(entry.stat_value || '0') : 0;
    if (value > bestValue) {
      bestValue = value;
      bestName = name;
    }
  }
  return bestValue > 0 ? bestName : null;
};

const tileSx = highlight => ({
  py: 2.5,
  px: 3,
  borderRadius: 3,
  textAlign: 'center',
  backdropFilter: 'blur(8px)',
  border: theme =>
    `1px solid ${alpha(theme.palette.primary.main, highlight ? 0.3 : 0.15)}`,
  bgcolor: theme =>
    alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'dark'
        ? highlight
          ? 0.14
          : 0.08
        : highlight
          ? 0.09
          : 0.05
    ),
});

const Tile = ({ label, value, sub, highlight }) => (
  <Box sx={tileSx(highlight)}>
    <Typography
      variant="caption"
      sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}
    >
      {label}
    </Typography>
    <Typography
      variant={highlight ? 'h5' : 'h6'}
      sx={{
        fontWeight: 800,
        fontFamily: '"Comic Neue", cursive',
        color: highlight ? 'primary.main' : 'text.primary',
        lineHeight: 1.3,
      }}
    >
      {value}
    </Typography>
    {sub && (
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 600 }}
      >
        {sub}
      </Typography>
    )}
  </Box>
);

/**
 * Horizontal strip of headline combat stat tiles: battle power, main stat,
 * boss/critical damage %, and ignore-defense %. Mirrors maplescouter's
 * "at-a-glance" summary row. 2x2 on mobile, 4 across on sm+.
 */
const StatHighlightStrip = ({ battlePower, statsData, characterClass }) => {
  const finalStats = statsData?.final_stat || [];

  if (finalStats.length === 0 && battlePower == null) return null;

  const balance = extractBalanceStats(statsData || {});
  const mainStatName = getMainStatName(finalStats, characterClass);
  const mainStatValue =
    characterClass === '惡魔復仇者'
      ? finalStats.find(stat => stat.stat_name === 'HP')?.stat_value
      : balance.mainStat;

  const tiles = [
    {
      key: 'power',
      label: '戰鬥力',
      value: battlePower != null ? battlePower.toLocaleString() : '-',
      highlight: true,
    },
    {
      key: 'main-stat',
      label: mainStatName ? `主屬性 ${mainStatName}` : '主屬性',
      value: mainStatValue ? formatStatValue(String(mainStatValue)) : '-',
    },
    {
      key: 'boss-crit',
      label: 'Boss傷害',
      value: `${Math.round(balance.bossDmg)}%`,
      sub: `爆擊傷害 ${Math.round(balance.critDmg)}%`,
    },
    {
      key: 'ignore-defense',
      label: '無視防禦',
      value: `${Math.round(balance.ignoreDef)}%`,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 1.5,
        mb: 3,
      }}
    >
      {tiles.map(({ key, ...tile }) => (
        <Tile key={key} {...tile} />
      ))}
    </Box>
  );
};

export default StatHighlightStrip;
