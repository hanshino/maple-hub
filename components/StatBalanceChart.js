'use client';

import React, { useMemo } from 'react';
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
  const { ratios, chartData, recommendations } = useMemo(() => {
    if (!statsData) return { ratios: null, chartData: [], recommendations: [] };
    const raw = extractBalanceStats(statsData, equipmentData);
    const equiv = computeEquivStats(raw);
    const ratios = computeBalanceRatios(equiv);
    const chartData = ratios
      ? ratios.map(r => ({
          axis: r.axis,
          player: Math.min(r.ratio, MAX_RATIO),
          balance: 1.0,
          outer: MAX_RATIO,
        }))
      : [];
    const recommendations = getRecommendations(ratios);
    return { ratios, chartData, recommendations };
  }, [statsData, equipmentData]);

  if (loading) {
    return (
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width={160} height={28} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (!ratios) return null;

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        {/* Title + Legend row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary">
            屬性平衡分析
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 3, bgcolor: '#f7931e', borderRadius: 1 }} />
              <Typography variant="caption" color="text.secondary">目前狀況</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                component="svg"
                width={16}
                height={4}
                sx={{ overflow: 'visible' }}
              >
                <line x1="0" y1="2" x2="16" y2="2" stroke="#9e9e9e" strokeDasharray="4 2" strokeWidth={2} />
              </Box>
              <Typography variant="caption" color="text.secondary">完美平衡</Typography>
            </Box>
          </Box>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <RadarChart
            data={chartData}
            cx="50%"
            cy="50%"
            role="img"
            aria-label="角色屬性平衡分析圖，顯示六個戰力維度的投資分佈"
          >
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: '#555', fontWeight: 600 }}
            />
            <PolarRadiusAxis
              domain={[0, MAX_RATIO]}
              tick={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'player')
                  return [`${Math.round(value * 100)}%`, '當前'];
                return null;
              }}
            />
            {/* Outer reference boundary — transparent fill to avoid blending with cream bg */}
            <Radar
              dataKey="outer"
              stroke="#e0e0e0"
              fill="none"
              strokeWidth={1}
              tooltipType="none"
            />
            {/* Balance hexagon — gray dashed, distinct from player orange */}
            <Radar
              dataKey="balance"
              stroke="#9e9e9e"
              fill="none"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              tooltipType="none"
            />
            {/* Player hexagon */}
            <Radar
              dataKey="player"
              stroke="#f7931e"
              fill="#f7931e"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>

        {recommendations.length > 0 && (
          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              建議提升：
            </Typography>
            {recommendations.map(rec => (
              <Chip
                key={rec.axis}
                label={`${rec.axis}（${rec.pct}%）`}
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
