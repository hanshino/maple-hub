'use client';

import { Box, Chip, Typography } from '@mui/material';
import {
  EVIDENCE_COLORS,
  EVIDENCE_LABELS,
  formatDelta,
  formatRawValue,
} from './compareFormat';

/**
 * Generic detail tab for the categories that don't need a specialized
 * layout (Symbols, HEXA, Union, Hyper Stat, Link Skill, Set Effects).
 * Every row is read directly from `comparison.categories` — no invented
 * values, no recomputed deltas or evidence.
 */
export default function CategoryCompareTab({ rows, presetInfo }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {presetInfo && (
        <Box
          sx={{
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {presetInfo.label}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>
            {presetInfo.left != null ? `P${presetInfo.left}` : '未知'} vs{' '}
            {presetInfo.right != null ? `P${presetInfo.right}` : '未知'}
          </Typography>
        </Box>
      )}

      {rows.map(({ label, row }) => (
        <Box
          key={label}
          sx={{
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 700, minWidth: 160 }}>
            {label}
          </Typography>
          <Typography sx={{ flex: 1, minWidth: 0 }}>
            {formatRawValue(row.left, row.unit)} vs{' '}
            {formatRawValue(row.right, row.unit)}（
            {formatDelta(row.delta, row.unit)}）
          </Typography>
          <Chip
            label={EVIDENCE_LABELS[row.evidence]}
            size="small"
            color={EVIDENCE_COLORS[row.evidence]}
            sx={{ px: 1, height: 22, fontSize: '0.7rem', fontWeight: 700 }}
          />
        </Box>
      ))}
    </Box>
  );
}
