'use client';

import Link from 'next/link';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

export default function Navigation() {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          Maple Hub
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={Link}
            href="/leaderboard"
            color="inherit"
            startIcon={<LeaderboardIcon />}
            sx={{
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            排行榜
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
