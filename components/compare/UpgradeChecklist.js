'use client';

import { Box, Card, Chip, Typography } from '@mui/material';
import {
  CATEGORY_LABELS,
  EVIDENCE_COLORS,
  EVIDENCE_LABELS,
  categoryMetricLabel,
  formatDelta,
  formatPlain,
} from './compareFormat';

/**
 * Up to three progression systems worth inspecting, from
 * `rankUpgradeDirections`. Presented as a numbered checklist with a
 * not-a-ranking footnote — never as an effectiveness ranking, and never
 * summed to reproduce the total combat-power gap.
 */
export default function UpgradeChecklist({ directions }) {
  if (!directions || directions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        目前沒有偵測到值得優先檢查的落後系統。
      </Typography>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(auto-fit, minmax(220px, 1fr))',
          },
          gap: 1.5,
        }}
      >
        {directions.map((direction, index) => (
          <Card
            key={direction.category}
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              gap: 1.5,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                flexShrink: 0,
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 800,
              }}
            >
              {index + 1}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                {CATEGORY_LABELS[direction.category] || direction.category}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.75 }}
              >
                觀察到的差異：{categoryMetricLabel(direction.metric)}{' '}
                {formatPlain(direction.myValue)} vs{' '}
                {formatPlain(direction.referenceValue)}（
                {formatDelta(direction.delta, null)}）
              </Typography>
              <Chip
                label={EVIDENCE_LABELS[direction.evidence]}
                size="small"
                color={EVIDENCE_COLORS[direction.evidence]}
                sx={{ px: 1, height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>
          </Card>
        ))}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 2 }}
      >
        各項為「可觀察的差異」，並非因果歸因；差異不可加總重現總戰力差距。
      </Typography>
    </Box>
  );
}
