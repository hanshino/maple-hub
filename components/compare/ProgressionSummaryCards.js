'use client';

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import EvidenceChip from './EvidenceChip';
import { DIRECTION_COLORS, formatDelta, formatRawValue } from './compareFormat';
import { HEADLINE_METRIC_BY_CATEGORY } from '../../lib/characterComparison';

// Presentational (key, label) pairs only — row selection now delegates to
// lib/characterComparison.js's HEADLINE_METRIC_BY_CATEGORY, the same
// headline-metric choice rankUpgradeDirections uses, so the two never
// drift apart. `categoryName` indexes into that map's stable-order keys.
const SUMMARY_CATEGORIES = [
  { key: 'equipment', label: '裝備', categoryName: 'Equipment' },
  { key: 'symbols', label: '符文', categoryName: 'Symbols' },
  { key: 'union', label: '聯盟', categoryName: 'Union' },
  { key: 'hexa', label: 'HEXA', categoryName: 'HEXA' },
  { key: 'hyperStat', label: '極限屬性', categoryName: 'Hyper Stat' },
  { key: 'linkSkill', label: '連結技能', categoryName: 'Link Skill' },
  { key: 'setEffects', label: '套裝效果', categoryName: 'Set Effects' },
  { key: 'familiar', label: '萌獸', categoryName: 'Familiar' },
  { key: 'ability', label: '內在能力', categoryName: 'Ability' },
];

function deltaCell(row) {
  if (row.coverage !== 'complete' || row.direction === 'unknown') {
    return { text: '未知', color: DIRECTION_COLORS.unknown };
  }
  if (row.direction === 'even') {
    return { text: '相同', color: DIRECTION_COLORS.even };
  }
  return {
    text: formatDelta(row.delta, row.unit),
    color: DIRECTION_COLORS[row.direction],
  };
}

/**
 * Progression-system summary (Equipment/Symbols/Union/HEXA/Hyper Stat/Link
 * Skill/Set Effects) as a table matching KeyStatTable's visual language.
 * Stays visible in cross-class comparisons too — only the main-stat rows
 * and upgrade checklist are class-specific and get hidden there.
 */
export default function ProgressionSummaryCards({ comparison }) {
  const rows = SUMMARY_CATEGORIES.map(({ key, label, categoryName }) => ({
    key,
    label,
    row: HEADLINE_METRIC_BY_CATEGORY[categoryName](comparison.categories),
  }));
  const hasUnknown = rows.some(({ row }) => row.coverage !== 'complete');

  return (
    <Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 520 }}>
          <TableHead>
            <TableRow>
              <TableCell>系統</TableCell>
              <TableCell align="right">我的角色</TableCell>
              <TableCell align="right">參考角色</TableCell>
              <TableCell align="right">差值</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ key, label, row }) => {
              const delta = deltaCell(row);
              return (
                <TableRow key={key}>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {label}
                      </Typography>
                      <EvidenceChip evidence={row.evidence} />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {formatRawValue(row.left, row.unit)}
                  </TableCell>
                  <TableCell align="right">
                    {formatRawValue(row.right, row.unit)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      component="span"
                      sx={{ fontWeight: 800, color: delta.color }}
                    >
                      {delta.text}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      {hasUnknown && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1.5 }}
        >
          顯示為未知代表本次資料不足，不視為 0。
        </Typography>
      )}
    </Box>
  );
}
