'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function SectionTitle({ children, sx }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 1.5,
        mt: 1,
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 3,
          height: 16,
          bgcolor: 'primary.main',
          borderRadius: 1,
          flexShrink: 0,
        }}
      />
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {children}
      </Typography>
    </Box>
  );
}
