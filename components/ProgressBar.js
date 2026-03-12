'use client';

import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  calculateEstimatedTimeToLevel,
  formatTime,
} from '../lib/progressUtils';

export default function ProgressBar({
  progress,
  expRate = 5,
  historicalData = null,
  level = null,
}) {
  const percentage = Math.max(0, Math.min(progress * 100, 100));
  const remainingPercentage = Math.max(0, 100 - percentage);
  const estimatedHours = calculateEstimatedTimeToLevel(
    remainingPercentage,
    expRate,
    historicalData
  );

  // Calculate daily growth rate from historical data
  const dailyGrowth = (() => {
    if (!historicalData || historicalData.length < 2) return null;
    const sorted = [...historicalData].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const days = Math.max(
      1,
      (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24)
    );

    // Account for level changes
    const firstPct = first.percentage ?? (first.progress ?? 0) * 100;
    const lastPct = last.percentage ?? (last.progress ?? 0) * 100;
    const firstLevel = first.level ?? 0;
    const lastLevel = last.level ?? 0;
    const levelAdj = Math.max(0, lastLevel - firstLevel) * 100;
    const totalGain = lastPct - firstPct + levelAdj;

    return totalGain / days;
  })();

  return (
    <Box>
      {/* Header: percentage + level */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: 'primary.main',
              lineHeight: 1,
              fontFamily: '"Comic Neue", cursive',
            }}
          >
            {percentage.toFixed(2)}
            <Typography
              component="span"
              variant="body1"
              sx={{ fontWeight: 700, color: 'primary.main', ml: 0.25 }}
            >
              %
            </Typography>
          </Typography>
          {level && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 600 }}
            >
              Lv.{level}
            </Typography>
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontWeight: 500 }}
        >
          {remainingPercentage.toFixed(2)}% 剩餘
        </Typography>
      </Box>

      {/* Progress bar with gradient */}
      <Box
        sx={{
          position: 'relative',
          height: 14,
          borderRadius: 7,
          bgcolor: theme =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.primary.main, 0.08),
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${percentage}%`,
            borderRadius: 7,
            background: theme =>
              `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.85)})`,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: theme =>
              percentage > 1
                ? `0 0 8px ${alpha(theme.palette.primary.main, 0.4)}`
                : 'none',
          }}
        />
        {/* Shimmer effect on the bar */}
        {percentage > 2 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${percentage}%`,
              borderRadius: 7,
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              animation: 'shimmer 2.5s infinite',
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          />
        )}
      </Box>

      {/* Footer: estimated time + daily growth */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 1.5,
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTimeIcon
            sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.7 }}
          />
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 500 }}
          >
            預計升級: {formatTime(estimatedHours)}
          </Typography>
        </Box>
        {dailyGrowth !== null && dailyGrowth > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUpIcon
              sx={{ fontSize: 14, color: 'success.main', opacity: 0.8 }}
            />
            <Typography
              variant="caption"
              sx={{ color: 'success.main', fontWeight: 600 }}
            >
              +{dailyGrowth.toFixed(2)}%/天
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
