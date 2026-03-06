'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function PanelError({ message, onRetry }) {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <WarningAmberIcon sx={{ fontSize: 40, color: 'warning.main' }} />
      <Typography>{message}</Typography>
      {onRetry && <Button onClick={onRetry}>重新載入</Button>}
    </Box>
  );
}
