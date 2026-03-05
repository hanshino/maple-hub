'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function PanelSkeleton({ rows = 4 }) {
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1 }}
      aria-busy="true"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          sx={{ height: 44, borderRadius: 1 }}
        />
      ))}
    </Box>
  );
}
