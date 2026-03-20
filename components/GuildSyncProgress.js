'use client';

import { Box, LinearProgress, Typography } from '@mui/material';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';

export default function GuildSyncProgress({ syncStatus, backfillStatus }) {
  const { mode } = useColorMode();

  const memberSyncing = syncStatus?.inProgress;
  const expBackfilling = backfillStatus?.inProgress;

  if (!memberSyncing && !expBackfilling) return null;

  const memberProgress =
    memberSyncing && syncStatus.total > 0
      ? ((syncStatus.synced + syncStatus.failed) / syncStatus.total) * 100
      : 0;

  const expProgress =
    expBackfilling && backfillStatus.total > 0
      ? (backfillStatus.done / backfillStatus.total) * 100
      : 0;

  return (
    <Box sx={{ ...getGlassCardSx(mode), mb: 3, p: 3 }}>
      {memberSyncing && (
        <Box sx={{ mb: expBackfilling ? 2 : 0 }}>
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
            value={memberProgress}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      )}
      {expBackfilling && (
        <Box>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              收集歷史經驗資料中...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {backfillStatus.done}/{backfillStatus.total}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={expProgress}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      )}
    </Box>
  );
}
