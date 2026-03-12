'use client';

import React, { useMemo } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  extractBalanceStats,
  computeEquivStats,
  computeBalanceRatios,
  getRecommendations,
} from '../lib/statBalance.js';

const MAX_RATIO = 1.8;

const StatBalanceChart = ({ statsData, equipmentData, loading }) => {
  const theme = useTheme();

  const { ratios, chartData, recommendations } = useMemo(() => {
    if (!statsData) return { ratios: null, chartData: [], recommendations: [] };
    const raw = extractBalanceStats(statsData, equipmentData);
    const equiv = computeEquivStats(raw);
    const ratios = computeBalanceRatios(equiv);
    const chartData = ratios
      ? ratios.map(r => ({
          axis: r.axis,
          player: Math.min(r.ratio, MAX_RATIO),
          equiv: Math.round(r.equiv),
          balance: 1.0,
          outer: MAX_RATIO,
        }))
      : [];
    const recommendations = getRecommendations(ratios);
    return { ratios, chartData, recommendations };
  }, [statsData, equipmentData]);

  if (loading) {
    return (
      <Card elevation={4} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width={160} height={28} sx={{ mb: 1 }} />
          <Skeleton
            variant="rectangular"
            height={260}
            sx={{ borderRadius: 2 }}
          />
        </CardContent>
      </Card>
    );
  }

  if (!ratios) return null;

  return (
    <Card elevation={4} sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Title + Legend row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography variant="h6" fontWeight={700} color="primary">
            能力探測圖
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 3,
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                目前狀況
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                component="svg"
                width={16}
                height={4}
                sx={{ overflow: 'visible' }}
              >
                <line
                  x1="0"
                  y1="2"
                  x2="16"
                  y2="2"
                  stroke={theme.palette.text.disabled}
                  strokeDasharray="4 2"
                  strokeWidth={2}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                完美平衡
              </Typography>
            </Box>
          </Box>
        </Box>

        <ResponsiveContainer width="100%" height={260}>
          <RadarChart
            data={chartData}
            cx="50%"
            cy="50%"
            role="img"
            aria-label="能力探測圖，顯示六個戰力維度的投資分佈"
          >
            <PolarGrid
              stroke={
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.divider, 0.2)
                  : alpha(theme.palette.divider, 0.4)
              }
            />
            <PolarAngleAxis
              dataKey="axis"
              tick={{
                fontSize: 11,
                fill: theme.palette.text.secondary,
                fontWeight: 600,
              }}
            />
            <PolarRadiusAxis
              domain={[0, MAX_RATIO]}
              tick={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value, name, props) => {
                if (name === 'player') {
                  const equiv = props?.payload?.equiv;
                  return [
                    equiv != null
                      ? equiv.toLocaleString()
                      : Math.round(value * 100),
                    '換算值',
                  ];
                }
                return null;
              }}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                color: theme.palette.text.primary,
                fontSize: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            {/* Outer reference boundary */}
            <Radar
              dataKey="outer"
              stroke={
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.divider, 0.2)
                  : alpha(theme.palette.divider, 0.4)
              }
              fill="none"
              strokeWidth={1}
              tooltipType="none"
            />
            {/* Balance hexagon — dashed, distinct from player */}
            <Radar
              dataKey="balance"
              stroke={theme.palette.text.disabled}
              fill="none"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              tooltipType="none"
            />
            {/* Player hexagon */}
            <Radar
              dataKey="player"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>

        {recommendations.length > 0 && (
          <Box
            sx={{
              mt: 1.5,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              建議提升：
            </Typography>
            {recommendations.map(rec => (
              <Chip
                key={rec.axis}
                label={rec.axis}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(StatBalanceChart);
