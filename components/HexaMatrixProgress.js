'use client';

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
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
      statCores: hexaStatData?.character_hexa_stat_core || [],
    };
  }, [hexaCoreData, hexaStatData]);

  if (character.character_class_level < 6) return null;

  if (!progress)
    return (
      <Typography>No Hexa Matrix data available for this character.</Typography>
    );

  // Prepare data for radar chart
  const radarData = progress.equipmentCores.map(core => ({
    core:
      core.name.length > 8 ? core.name.substring(0, 8) + '...' : core.name,
    level: core.level,
    fullMark: 30,
  }));

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        六轉進度
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          總進度:{' '}
          {typeof progress.totalProgress === 'number' &&
          !Number.isNaN(progress.totalProgress)
            ? `${progress.totalProgress.toFixed(1)}%`
            : '0.0%'}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          還需 靈魂艾爾達:{' '}
          {formatResourceAmount(
            Math.max(
              0,
              progress.totalRequired.soul_elder - progress.totalSpent.soul_elder
            )
          )}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          還需 靈魂艾爾達碎片:{' '}
          {formatResourceAmount(
            Math.max(
              0,
              progress.totalRequired.soul_elder_fragment -
                progress.totalSpent.soul_elder_fragment
            )
          )}
        </Typography>
      </Box>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis
            dataKey="core"
            tick={{ fontSize: 12, fill: theme.palette.text.primary }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 30]}
            tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
          />
          <Radar
            name="等級"
            dataKey="level"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            formatter={value => [`等級 ${value}/30`, '進度']}
            labelFormatter={label => `核心: ${label}`}
            wrapperStyle={{
              maxWidth: '200px',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              padding: '8px',
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(42, 31, 26, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${theme.palette.mode === 'dark' ? '#5a4a38' : '#ccc'}`,
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              color: theme.palette.text.primary,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      <HexaStatTable cores={statCores} />
    </Box>
  );
}
