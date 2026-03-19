'use client';

import { Box, LinearProgress, Typography } from '@mui/material';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';

export default function GuildSyncProgress({ syncStatus }) {
  const { mode } = useColorMode();

  if (!syncStatus || !syncStatus.inProgress) return null;

  const progress =
    syncStatus.total > 0
      ? ((syncStatus.synced + syncStatus.failed) / syncStatus.total) * 100
      : 0;

  return (
    <Box sx={{ ...getGlassCardSx(mode), mb: 3, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
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
