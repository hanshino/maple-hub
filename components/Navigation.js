'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import HomeIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { FaCanadianMapleLeaf } from 'react-icons/fa';
import { useColorMode } from './MuiThemeProvider';

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: HomeIcon, exact: true },
  { href: '/leaderboard', label: '排行榜', icon: LeaderboardIcon },
  { href: '/about', label: '關於', icon: InfoOutlinedIcon },
];

export default function Navigation() {
  const pathname = usePathname();
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href, exact) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Skip to main content for keyboard accessibility */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: -9999,
          top: 'auto',
          width: 1,
          height: 1,
          overflow: 'hidden',
          zIndex: 9999,
          '&:focus': {
            position: 'fixed',
            top: 8,
            left: 8,
            width: 'auto',
            height: 'auto',
            overflow: 'visible',
            px: 2,
            py: 1,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 2,
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          },
        }}
      >
        跳到主要內容
      </Box>

      <Box
        component="nav"
        aria-label="主導覽列"
        sx={{
          position: 'sticky',
          top: { xs: 0, sm: 12 },
          mx: { xs: 0, sm: 2, md: 3 },
          mt: { xs: 0, sm: 1.5 },
          mb: { xs: 0, sm: 1 },
          zIndex: 1100,
          borderRadius: { xs: 0, sm: '16px' },
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          bgcolor:
            mode === 'dark'
              ? 'rgba(42, 31, 26, 0.82)'
              : 'rgba(255, 247, 236, 0.78)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor:
            mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(247, 147, 30, 0.18)',
          boxShadow:
            mode === 'dark'
              ? '0 4px 24px rgba(0, 0, 0, 0.3)'
              : '0 4px 24px rgba(247, 147, 30, 0.1)',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: { xs: 56, sm: 52 },
            px: { xs: 2, sm: 2.5 },
            gap: 1,
          }}
        >
          {/* Logo */}
          <Box
            component={Link}
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              textDecoration: 'none',
              color: 'text.primary',
              mr: 'auto',
              '&:hover': { opacity: 0.85 },
              transition: 'opacity 0.15s ease',
            }}
          >
            <Box
              component="span"
              sx={{ color: 'primary.main', display: 'flex' }}
            >
              <FaCanadianMapleLeaf size={22} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: '1.1rem',
                letterSpacing: 0.3,
                lineHeight: 1,
              }}
            >
              Maple Hub
            </Typography>
          </Box>

          {/* Desktop Nav Links */}
          {!isMobile && (
            <Box
              component="ul"
              role="list"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                listStyle: 'none',
                m: 0,
                p: 0,
              }}
            >
              {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Box component="li" key={href}>
                    <Box
                      component={Link}
                      href={href}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.75,
                        py: 0.75,
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: active ? 700 : 500,
                        color: active ? 'primary.contrastText' : 'text.primary',
                        bgcolor: active ? 'primary.main' : 'transparent',
                        transition:
                          'background-color 0.15s ease, color 0.15s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: active
                            ? 'primary.dark'
                            : mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(247, 147, 30, 0.1)',
                        },
                        '&:focus-visible': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: 2,
                        },
                      }}
                    >
                      <Icon sx={{ fontSize: 18 }} />
                      {label}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Theme Toggle */}
          <IconButton
            onClick={toggleColorMode}
            aria-label={mode === 'dark' ? '切換淺色模式' : '切換深色模式'}
            size="small"
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              color: 'text.primary',
              transition: 'background-color 0.15s ease',
              '&:hover': {
                bgcolor:
                  mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(247, 147, 30, 0.1)',
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
            }}
          >
            {mode === 'dark' ? (
              <LightModeIcon sx={{ fontSize: 20 }} />
            ) : (
              <DarkModeIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="開啟選單"
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                color: 'text.primary',
                '&:hover': {
                  bgcolor:
                    mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(247, 147, 30, 0.1)',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              <MenuIcon sx={{ fontSize: 22 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 260,
              bgcolor:
                mode === 'dark'
                  ? 'rgba(42, 31, 26, 0.95)'
                  : 'rgba(255, 247, 236, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              component="span"
              sx={{ color: 'primary.main', display: 'flex' }}
            >
              <FaCanadianMapleLeaf size={20} />
            </Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, letterSpacing: 0.3 }}
            >
              Maple Hub
            </Typography>
          </Box>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            aria-label="關閉選單"
            size="small"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ pt: 1 }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <ListItem key={href} disablePadding sx={{ px: 1, mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  selected={active}
                  sx={{
                    borderRadius: '10px',
                    py: 1.25,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    slotProps={{
                      primary: {
                        fontSize: '0.9rem',
                        fontWeight: active ? 700 : 500,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>
    </>
  );
}
