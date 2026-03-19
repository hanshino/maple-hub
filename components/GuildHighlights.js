'use client';

import { useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import BoltIcon from '@mui/icons-material/Bolt';
import GroupsIcon from '@mui/icons-material/Groups';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';

export default function GuildHighlights({ members }) {
  const { mode } = useColorMode();
  const syncedMembers = useMemo(
    () => members.filter(m => m.characterLevel),
    [members]
  );

  const highlights = useMemo(() => {
    if (syncedMembers.length === 0) return [];

    const results = [];

    const byLevel = [...syncedMembers].sort(
      (a, b) => (b.characterLevel || 0) - (a.characterLevel || 0)
    );
    if (byLevel[0]) {
      results.push({
        label: `最高等級: ${byLevel[0].characterName} (Lv.${byLevel[0].characterLevel})`,
        color: 'warning',
        icon: <MilitaryTechIcon />,
      });
    }

    const byCombat = [...syncedMembers].sort(
      (a, b) => (b.combatPower || 0) - (a.combatPower || 0)
    );
    if (byCombat[0]?.combatPower) {
      results.push({
        label: `最強戰力: ${byCombat[0].characterName} (${Number(byCombat[0].combatPower).toLocaleString()})`,
        color: 'error',
        icon: <BoltIcon />,
      });
    }

    const classCounts = {};
    syncedMembers.forEach(m => {
      if (m.characterClass) {
        classCounts[m.characterClass] =
          (classCounts[m.characterClass] || 0) + 1;
      }
    });
    const topClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0];
    if (topClass) {
      results.push({
        label: `最多人玩: ${topClass[0]} (${topClass[1]} 人)`,
        color: 'info',
        icon: <GroupsIcon />,
      });
    }

    return results;
  }, [syncedMembers]);

  if (highlights.length === 0) return null;

  const glassCardSx = { ...getGlassCardSx(mode, { hover: true }), p: 3, mb: 3 };

  return (
    <Box sx={glassCardSx}>
      <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 700 }}>
        工會之最
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {highlights.map((h, i) => (
          <Chip
            key={i}
            icon={h.icon}
            label={h.label}
            color={h.color}
            sx={{ px: 1.5 }}
          />
        ))}
      </Box>
    </Box>
  );
}
