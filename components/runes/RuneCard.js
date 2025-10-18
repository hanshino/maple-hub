import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
import Image from 'next/image';
import { calculateRuneProgress, getMaxLevel } from '../../lib/runeUtils';

export default function RuneCard({ rune }) {
  const progress = calculateRuneProgress(rune);

  return (
    <Card
      sx={{ minWidth: 200, maxWidth: 250 }}
      role="article"
      aria-label={`${rune.symbol_name} 符文卡片`}
    >
      <CardContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 48,
              height: 48,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src={rune.symbol_icon}
              alt={rune.symbol_name}
              fill
              sizes="48px"
              style={{ objectFit: 'contain' }}
              onError={e => {
                e.target.src = '/placeholder-rune.png'; // fallback image
              }}
            />
          </Box>
          <Typography
            variant="body2"
            noWrap
            title={rune.symbol_name}
            aria-label={`符文名稱: ${rune.symbol_name}`}
          >
            {rune.symbol_name}
          </Typography>
          <Typography
            variant="body2"
            aria-label={`當前等級: ${rune.symbol_level}`}
          >
            等級: {rune.symbol_level}
          </Typography>
          <Typography
            variant="body2"
            aria-label={`力量值: ${rune.symbol_force}`}
          >
            力量: {rune.symbol_force}
          </Typography>
          <Box
            width="100%"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
              aria-label={`升級進度: ${progress.toFixed(1)}%`}
            />
            <Typography
              variant="caption"
              align="center"
              display="block"
              aria-label={`進度百分比: ${progress.toFixed(1)}%`}
            >
              等級 {rune.symbol_level}/{getMaxLevel(rune)} (
              {progress.toFixed(1)}%)
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
