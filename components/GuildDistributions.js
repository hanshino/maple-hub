'use client';

import { useMemo } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';

export default function GuildDistributions({ members }) {
  const { mode } = useColorMode();
  const theme = useTheme();
  const syncedMembers = useMemo(
    () => members.filter(m => m.characterClass),
    [members]
  );

  const MAX_CLASS_DISPLAY = 10;

  const classData = useMemo(() => {
    const counts = {};
    syncedMembers.forEach(m => {
      counts[m.characterClass] = (counts[m.characterClass] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    if (sorted.length <= MAX_CLASS_DISPLAY) return sorted;

    const top = sorted.slice(0, MAX_CLASS_DISPLAY);
    const otherCount = sorted
      .slice(MAX_CLASS_DISPLAY)
      .reduce((sum, item) => sum + item.count, 0);
    return [...top, { name: '其他', count: otherCount }];
  }, [syncedMembers]);

  const levelData = useMemo(() => {
    const buckets = {};
    syncedMembers.forEach(m => {
      if (!m.characterLevel) return;
      let bucket;
      if (m.characterLevel < 200) {
        bucket = '<200';
      } else {
        const base = Math.floor(m.characterLevel / 10) * 10;
        bucket = `${base}-${base + 9}`;
      }
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    return Object.entries(buckets)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        if (a.range === '<200') return -1;
        if (b.range === '<200') return 1;
        return parseInt(a.range) - parseInt(b.range);
      });
  }, [syncedMembers]);

  if (syncedMembers.length === 0) return null;

  const glassCardSx = { ...getGlassCardSx(mode), p: 3, height: '100%' };

  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '8px',
    color: theme.palette.text.primary,
    fontSize: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  const gridStroke =
    mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={glassCardSx}>
          <Typography
            variant="h6"
            component="h3"
            sx={{ mb: 2, fontWeight: 700 }}
          >
            職業分布
          </Typography>
          <ResponsiveContainer
            width="100%"
            height={Math.max(300, classData.length * 32)}
            role="img"
            aria-label="工會成員職業分布長條圖"
          >
            <BarChart
              data={classData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridStroke}
                horizontal={false}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                  fill: theme.palette.text.secondary,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{
                  fontSize: 12,
                  fill: theme.palette.text.primary,
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="count"
                fill="#f7931e"
                radius={[0, 4, 4, 0]}
                name="人數"
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={glassCardSx}>
          <Typography
            variant="h6"
            component="h3"
            sx={{ mb: 2, fontWeight: 700 }}
          >
            等級分布
          </Typography>
          <ResponsiveContainer
            width="100%"
            height={300}
            role="img"
            aria-label="工會成員等級分布長條圖"
          >
            <BarChart data={levelData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridStroke}
                vertical={false}
              />
              <XAxis
                dataKey="range"
                tick={{
                  fontSize: 11,
                  fill: theme.palette.text.secondary,
                }}
                tickLine={false}
                axisLine={{ stroke: theme.palette.divider }}
              />
              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                  fill: theme.palette.text.secondary,
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="count"
                fill="#f7931e"
                radius={[4, 4, 0, 0]}
                name="人數"
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Grid>
    </Grid>
  );
}
