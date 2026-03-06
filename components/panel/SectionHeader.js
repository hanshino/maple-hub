'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function SectionHeader({ description }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Box
        sx={{
          width: 3,
          height: 20,
          bgcolor: 'primary.main',
          borderRadius: 1,
        }}
      />
      <Typography sx={{ fontStyle: 'italic' }}>{description}</Typography>
    </Box>
  );
}
