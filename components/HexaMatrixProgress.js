import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { fetchHexaMatrixData } from '../lib/hexaMatrixApi';
import { calculateOverallProgress } from '../lib/hexaMatrixUtils';
import HexaMatrixCoreCard from './HexaMatrixCoreCard';

export default function HexaMatrixProgress({ character }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (character.character_class_level < 6) return;

    const loadData = async () => {
      try {
        const data = await fetchHexaMatrixData(character.ocid);
        if (
          !data.character_hexa_core_equipment ||
          data.character_hexa_core_equipment.length === 0
        ) {
          setProgress(null);
        } else {
          const calculatedProgress = calculateOverallProgress(
            data.character_hexa_core_equipment
          );
          setProgress(calculatedProgress);
        }
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

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        六轉進度
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          總進度:{' '}
          {typeof progress.totalProgress === 'number' &&
          !Number.isNaN(progress.totalProgress)
            ? `${progress.totalProgress.toFixed(1)}%`
            : '0.0%'}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={Math.max(
            0,
            Math.min(Number(progress.totalProgress) || 0, 100)
          )}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: 'grey.300',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              backgroundColor: 'primary.main',
            },
          }}
        />
      </Box>

      <Accordion defaultExpanded={false}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="hexa-matrix-details-content"
          id="hexa-matrix-details-header"
        >
          <Typography variant="h6">詳細核心進度</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {progress.coreProgress.map((core, index) => (
            <HexaMatrixCoreCard key={index} core={core} />
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
