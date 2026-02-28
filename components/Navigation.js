'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import HomeIcon from '@mui/icons-material/Home';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <AppBar
      position="sticky"
      color="primary"
      elevation={1}
      sx={{ top: 0, zIndex: 1100 }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            letterSpacing: 0.5,
            '&:hover': {
              opacity: 0.85,
            },
          }}
        >
          Maple Hub
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            href="/"
            color="inherit"
            startIcon={<HomeIcon />}
            sx={{
              textTransform: 'none',
              backgroundColor:
                pathname === '/' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            首頁
          </Button>
          <Button
            component={Link}
            href="/leaderboard"
            color="inherit"
            startIcon={<LeaderboardIcon />}
            sx={{
              textTransform: 'none',
              backgroundColor:
                pathname === '/leaderboard'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'transparent',
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
