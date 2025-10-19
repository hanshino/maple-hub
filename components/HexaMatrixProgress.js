import { useState, useEffect } from 'react';
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
import { fetchHexaMatrixData, fetchHexaStatCores } from '../lib/hexaMatrixApi';
import {
  filterHexaCoreSkills,
  formatResourceAmount,
} from '../lib/hexaMatrixUtils';
import { calculateHexaMatrixProgress } from '../lib/progressUtils';
import HexaStatTable from './HexaStatTable';

export default function HexaMatrixProgress({ character }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [statCores, setStatCores] = useState([]);

  useEffect(() => {
    if (character.character_class_level < 6) return;

    const loadData = async () => {
      try {
        // Fetch both hexa matrix and stat core data in parallel
        const [hexaData, statData] = await Promise.all([
          fetchHexaMatrixData(character.ocid),
          fetchHexaStatCores(character.ocid).catch(() => ({
            character_hexa_stat_core: [],
          })), // Gracefully handle stat core fetch failures
        ]);

        // Process hexa matrix data
        if (
          !hexaData.character_hexa_core_equipment ||
          hexaData.character_hexa_core_equipment.length === 0
        ) {
          setProgress(null);
        } else {
          // Filter hexa core data first to remove irrelevant skills
          const filteredHexaCores = filterHexaCoreSkills(
            hexaData.character_hexa_core_equipment
          );

          // Combine filtered equipment cores with stat core data for complete progress calculation
          const combinedHexaData = {
            character_hexa_core_equipment: filteredHexaCores,
            ...statData, // Include stat core data
          };
          const calculatedProgress =
            calculateHexaMatrixProgress(combinedHexaData);
          setProgress(calculatedProgress);
        }

        // Set stat cores data
        setStatCores(statData.character_hexa_stat_core || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [character]);

  if (character.character_class_level < 6) return null;

  if (loading) return <Typography>Loading Hexa Matrix data...</Typography>;

  if (error)
    return <Typography>Failed to load Hexa Matrix data: {error}</Typography>;

  if (!progress)
    return (
      <Typography>No Hexa Matrix data available for this character.</Typography>
    );

  // Prepare data for radar chart - create a single data point with all cores
  const radarData = progress.equipmentCores.map(core => ({
    core: core.name.length > 8 ? core.name.substring(0, 8) + '...' : core.name, // Truncate long names
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
          <PolarAngleAxis dataKey="core" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 30]}
            tick={{ fontSize: 10 }}
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
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      <HexaStatTable cores={statCores} />
    </Box>
  );
}
