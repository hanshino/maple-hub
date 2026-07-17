'use client';

import { Box, Chip, Typography } from '@mui/material';
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
 * `rankUpgradeDirections`. Presented as a borderless numbered checklist
 * with a not-a-ranking footnote — never as an effectiveness ranking, and
 * never summed to reproduce the total combat-power gap.
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {directions.map((direction, index) => (
          <Box
            key={direction.category}
            sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
          >
            <Box
              aria-hidden="true"
              sx={{
                flexShrink: 0,
                width: 32,
                height: 32,
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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                  mb: 0.5,
                }}
              >
                <Typography sx={{ fontWeight: 800 }}>
                  {CATEGORY_LABELS[direction.category] || direction.category}
                </Typography>
                <Chip
                  label={EVIDENCE_LABELS[direction.evidence]}
                  size="small"
                  color={EVIDENCE_COLORS[direction.evidence]}
                  sx={{
                    px: 1,
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                觀察到的差異：{categoryMetricLabel(direction.metric)}{' '}
                {formatPlain(direction.myValue)} vs{' '}
                {formatPlain(direction.referenceValue)}（
                {formatDelta(direction.delta, null)}）
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 2.5 }}
      >
        各項為「可觀察的差異」，並非因果歸因；差異不可加總重現總戰力差距。
      </Typography>
    </Box>
  );
}
