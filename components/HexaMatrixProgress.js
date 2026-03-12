'use client';

import { useMemo } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import { Box, Typography, Chip } from '@mui/material';
import DiamondIcon from '@mui/icons-material/Diamond';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  filterHexaCoreSkills,
  formatResourceAmount,
} from '../lib/hexaMatrixUtils';

const HEXA_CORE_MAX_LEVEL = 30;
import { calculateHexaMatrixProgress } from '../lib/progressUtils';
import HexaStatTable from './HexaStatTable';

export default function HexaMatrixProgress({
  character,
  hexaCoreData,
  hexaStatData,
}) {
  const theme = useTheme();

  const { progress, statCores } = useMemo(() => {
    if (!hexaCoreData?.character_hexa_core_equipment?.length) {
      return { progress: null, statCores: [] };
    }

    const filteredHexaCores = filterHexaCoreSkills(
      hexaCoreData.character_hexa_core_equipment
    );

    const combinedHexaData = {
      character_hexa_core_equipment: filteredHexaCores,
      ...(hexaStatData || {}),
    };
    const calculatedProgress = calculateHexaMatrixProgress(combinedHexaData);

    return {
      progress: calculatedProgress,
      statCores: [
        ...(hexaStatData?.character_hexa_stat_core || []),
        ...(hexaStatData?.character_hexa_stat_core_2 || []),
        ...(hexaStatData?.character_hexa_stat_core_3 || []),
      ],
    };
  }, [hexaCoreData, hexaStatData]);

  if (character.character_class_level < 6) return null;

  if (!progress)
    return (
      <Box
        sx={{
          py: 4,
          textAlign: 'center',
          color: 'text.secondary',
          opacity: 0.6,
        }}
      >
        <Typography variant="body2">尚無六轉核心資料</Typography>
      </Box>
    );

  const totalProgress =
    typeof progress.totalProgress === 'number' &&
    !Number.isNaN(progress.totalProgress)
      ? progress.totalProgress
      : 0;

  const remainingSoulElder = Math.max(
    0,
    progress.totalRequired.soul_elder - progress.totalSpent.soul_elder
  );
  const remainingFragments = Math.max(
    0,
    progress.totalRequired.soul_elder_fragment -
      progress.totalSpent.soul_elder_fragment
  );

  // Prepare data for radar chart
  const radarData = progress.equipmentCores.map(core => ({
    core: core.name.length > 8 ? core.name.substring(0, 8) + '...' : core.name,
    fullName: core.name,
    level: core.level,
    fullMark: HEXA_CORE_MAX_LEVEL,
  }));

  return (
    <Box>
      {/* Header */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
        六轉進度
      </Typography>

      {/* Progress summary */}
      <Box sx={{ mb: 2.5 }}>
        {/* Large percentage + progress bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: 'primary.main',
              lineHeight: 1,
              fontFamily: '"Comic Neue", cursive',
            }}
          >
            {totalProgress.toFixed(1)}
            <Typography
              component="span"
              variant="body1"
              sx={{ fontWeight: 700, color: 'primary.main', ml: 0.25 }}
            >
              %
            </Typography>
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 500 }}
          >
            裝備核心完成度
          </Typography>
        </Box>

        {/* Gradient progress bar */}
        <Box
          sx={{
            position: 'relative',
            height: 10,
            borderRadius: 5,
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.primary.main, 0.08),
            overflow: 'hidden',
            mb: 2,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${Math.min(totalProgress, 100)}%`,
              borderRadius: 5,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.85)})`,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow:
                totalProgress > 1
                  ? `0 0 6px ${alpha(theme.palette.primary.main, 0.4)}`
                  : 'none',
            }}
          />
        </Box>

        {/* Resource chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<DiamondIcon sx={{ fontSize: 14 }} />}
            label={`靈魂艾爾達 ${formatResourceAmount(remainingSoulElder)}`}
            size="small"
            variant="outlined"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              borderColor: alpha(theme.palette.primary.main, 0.3),
              color: 'text.secondary',
              '& .MuiChip-icon': { color: 'primary.main' },
            }}
          />
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
            label={`碎片 ${formatResourceAmount(remainingFragments)}`}
            size="small"
            variant="outlined"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              borderColor: alpha(theme.palette.primary.main, 0.3),
              color: 'text.secondary',
              '& .MuiChip-icon': { color: 'primary.main' },
            }}
          />
        </Box>
      </Box>

      {/* Radar chart */}
      {radarData.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid
                stroke={
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.divider, 0.2)
                    : alpha(theme.palette.divider, 0.4)
                }
              />
              <PolarAngleAxis
                dataKey="core"
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, HEXA_CORE_MAX_LEVEL]}
                tick={{ fontSize: 9, fill: theme.palette.text.secondary }}
              />
              <Radar
                name="等級"
                dataKey="level"
                stroke={theme.palette.primary.main}
                fill={theme.palette.primary.main}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                formatter={value => [
                  `Lv.${value} / ${HEXA_CORE_MAX_LEVEL}`,
                  '進度',
                ]}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.fullName
                    ? `核心: ${item.fullName}`
                    : `核心: ${_}`;
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
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Stat core table */}
      <HexaStatTable cores={statCores} />
    </Box>
  );
}
