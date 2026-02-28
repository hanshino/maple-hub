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
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[
            { href: '/', label: '首頁', icon: <HomeIcon />, exact: true },
            {
              href: '/leaderboard',
              label: '排行榜',
              icon: <LeaderboardIcon />,
            },
          ].map(({ href, label, icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Button
                key={href}
                component={Link}
                href={href}
                color="inherit"
                startIcon={icon}
                sx={{
                  textTransform: 'none',
                  borderRadius: 0,
                  px: 1.5,
                  pb: 0.5,
                  opacity: isActive ? 1 : 0.75,
                  borderBottom: isActive
                    ? '2px solid white'
                    : '2px solid transparent',
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: 'transparent',
                  },
                }}
              >
                {label}
              </Button>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
