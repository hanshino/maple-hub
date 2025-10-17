import { Box, Typography, LinearProgress } from '@mui/material';
import {
  calculateEstimatedTimeToLevel,
  formatTime,
} from '../lib/progressUtils';

export default function ProgressBar({
  progress,
  expRate = 5,
  historicalData = null,
}) {
  const percentage = Math.max(0, Math.min(progress * 100, 100));
  const remainingPercentage = Math.max(0, 100 - percentage);
  const estimatedHours = calculateEstimatedTimeToLevel(
    remainingPercentage,
    expRate,
    historicalData
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">經驗值進度</Typography>
        <Typography variant="body2">{percentage.toFixed(1)}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
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
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: 'block' }}
      >
        預計時間: {formatTime(estimatedHours)}
      </Typography>
    </Box>
  );
}
