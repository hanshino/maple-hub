'use client';

import { Box, LinearProgress, Typography } from '@mui/material';
import { useColorMode } from './MuiThemeProvider';

export default function GuildSyncProgress({ syncStatus }) {
  const { mode } = useColorMode();

  if (!syncStatus || !syncStatus.inProgress) return null;

  const progress =
    syncStatus.total > 0
      ? ((syncStatus.synced + syncStatus.failed) / syncStatus.total) * 100
      : 0;

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor:
          mode === 'dark'
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(247,147,30,0.15)',
        bgcolor:
          mode === 'dark'
            ? 'rgba(42,31,26,0.6)'
            : 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
      >
        <Typography variant="body2" color="text.secondary">
          同步成員資料中...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {syncStatus.synced + syncStatus.failed}/{syncStatus.total}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ borderRadius: 1 }}
      />
    </Box>
  );
}
