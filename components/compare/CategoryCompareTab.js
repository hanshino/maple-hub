'use client';

import { Box, Typography } from '@mui/material';
import EvidenceChip from './EvidenceChip';
import { formatDelta, formatRawValue } from './compareFormat';

/**
 * Generic detail tab for the categories that don't need a specialized
 * layout (Symbols, HEXA, Union, Hyper Stat, Link Skill, Set Effects).
 * Every row is read directly from `comparison.categories` — no invented
 * values, no recomputed deltas or evidence. Rows render as a
 * divider-separated list, not bordered boxes.
 */
export default function CategoryCompareTab({ rows, presetInfo }) {
  return (
    <Box>
      {presetInfo && (
        <Box sx={{ mb: 3 }}>
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
            py: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            '&:not(:last-child)': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
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
          <EvidenceChip evidence={row.evidence} />
        </Box>
      ))}
    </Box>
  );
}
