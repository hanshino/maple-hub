'use client';

import { useMemo } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useColorMode } from './MuiThemeProvider';

const COLORS = [
  '#f7931e',
  '#cc6e00',
  '#ffb347',
  '#8c6239',
  '#b07d52',
  '#7cb342',
  '#e53935',
  '#ffa726',
  '#4fc3f7',
  '#ab47bc',
];

export default function GuildDistributions({ members }) {
  const { mode } = useColorMode();
  const theme = useTheme();
  const syncedMembers = members.filter(m => m.characterClass);

  const classData = useMemo(() => {
    const counts = {};
    syncedMembers.forEach(m => {
      counts[m.characterClass] = (counts[m.characterClass] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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

  const glassCardSx = {
    p: 3,
    borderRadius: 3,
    border: '1px solid',
    borderColor:
      mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(247,147,30,0.15)',
    bgcolor: mode === 'dark' ? 'rgba(42,31,26,0.6)' : 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
    height: '100%',
  };

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
            height={300}
            role="img"
            aria-label="工會成員職業分布圓餅圖"
          >
            <PieChart>
              <Pie
                data={classData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {classData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
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
