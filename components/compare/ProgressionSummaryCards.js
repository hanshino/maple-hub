'use client';

import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  EVIDENCE_COLORS,
  EVIDENCE_LABELS,
  formatDelta,
  formatRawValue,
} from './compareFormat';

const SUMMARY_CATEGORIES = [
  { key: 'equipment', label: '裝備', getRow: c => c.equipment.starSum },
  { key: 'symbols', label: '符文', getRow: c => c.symbols.totalLevel },
  { key: 'union', label: '聯盟', getRow: c => c.union.level },
  { key: 'hexa', label: 'HEXA', getRow: c => c.hexa.totalCoreLevel },
  {
    key: 'hyperStat',
    label: '極限屬性',
    getRow: c => c.hyperStat.totalLevel,
  },
  {
    key: 'linkSkill',
    label: '連結技能',
    getRow: c => c.linkSkill.totalLevel,
  },
  {
    key: 'setEffects',
    label: '套裝效果',
    getRow: c => c.setEffects.totalSetCount,
  },
  {
    key: 'familiar',
    label: '萌獸',
    getRow: c => c.familiar.summonedFinalDamage,
  },
  {
    key: 'ability',
    label: '內在能力',
    getRow: c => c.ability.bossDamage,
  },
];

const DELTA_COLOR = {
  ahead: 'success.main',
  behind: 'error.main',
  even: 'text.secondary',
  unknown: 'text.disabled',
};

function deltaCell(row) {
  if (row.coverage !== 'complete' || row.direction === 'unknown') {
    return { text: '未知', color: DELTA_COLOR.unknown };
  }
  if (row.direction === 'even') {
    return { text: '相同', color: DELTA_COLOR.even };
  }
  return {
    text: formatDelta(row.delta, row.unit),
    color: DELTA_COLOR[row.direction],
  };
}

/**
 * Progression-system summary (Equipment/Symbols/Union/HEXA/Hyper Stat/Link
 * Skill/Set Effects) as a table matching KeyStatTable's visual language.
 * Stays visible in cross-class comparisons too — only the main-stat rows
 * and upgrade checklist are class-specific and get hidden there.
 */
export default function ProgressionSummaryCards({ comparison }) {
  const rows = SUMMARY_CATEGORIES.map(({ key, label, getRow }) => ({
    key,
    label,
    row: getRow(comparison.categories),
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
                      <Chip
                        label={EVIDENCE_LABELS[row.evidence]}
                        size="small"
                        color={EVIDENCE_COLORS[row.evidence]}
                        sx={{
                          px: 1,
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                      />
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
