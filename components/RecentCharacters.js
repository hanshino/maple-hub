'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { getSearchHistory } from '../lib/localStorage';

export default function RecentCharacters({ onSelect }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  if (history.length === 0) return null;

  return (
    <Box sx={{ mt: 4, maxWidth: 640, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        <HistoryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: 0.5 }}
        >
          最近查看的角色
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(5, 1fr)',
          },
          gap: 1.5,
        }}
      >
        {history.map(char => (
          <Paper
            key={char.ocid}
            elevation={0}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(char.ocid)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(char.ocid);
              }
            }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              p: 2,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: 'transparent',
              borderRadius: 3,
              backgroundColor: 'rgba(247, 147, 30, 0.04)',
              transition: 'all 200ms ease',
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none',
              },
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(247, 147, 30, 0.10)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(247, 147, 30, 0.15)',
                '@media (prefers-reduced-motion: reduce)': {
                  transform: 'none',
                },
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            <Avatar
              src={char.characterImage}
              alt={char.characterName}
              sx={{
                width: 64,
                height: 64,
                backgroundColor: 'rgba(247, 147, 30, 0.12)',
                border: '2px solid',
                borderColor: 'divider',
                '& img': {
                  objectFit: 'contain',
                  imageRendering: 'pixelated',
                },
              }}
            />
            <Box sx={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontFamily: '"Comic Neue", cursive',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {char.characterName}
              </Typography>
              {char.characterClass && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {char.characterClass}
                </Typography>
              )}
              {char.characterLevel && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                  }}
                >
                  Lv.{char.characterLevel}
                </Typography>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
