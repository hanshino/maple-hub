'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/Inbox';

export default function PanelEmpty({ message }) {
  return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <InboxIcon sx={{ fontSize: 48, opacity: 0.4, color: 'text.secondary' }} />
      <Typography>{message}</Typography>
    </Box>
  );
}
