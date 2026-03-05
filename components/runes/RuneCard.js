import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { calculateRuneProgress, getMaxLevel } from '../../lib/runeUtils';

export default function RuneCard({ rune }) {
  const progress = calculateRuneProgress(rune);

  return (
    <Card
      sx={{ borderRadius: 2, overflow: 'hidden' }}
      role="article"
      aria-label={`${rune.symbol_name} 符文卡片`}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={rune.symbol_icon}
              alt={rune.symbol_name}
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain',
              }}
              onError={e => {
                e.target.src = '/placeholder-rune.png';
              }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {rune.symbol_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lv.{rune.symbol_level} / {getMaxLevel(rune)} | 力量:{' '}
              {rune.symbol_force}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: theme => alpha(theme.palette.primary.main, 0.15),
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main',
              },
            }}
            aria-label={`升級進度: ${progress.toFixed(1)}%`}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'right', mt: 0.25 }}
          >
            {progress.toFixed(1)}%
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
