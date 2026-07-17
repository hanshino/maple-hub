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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  EVIDENCE_COLORS,
  EVIDENCE_LABELS,
  formatDelta,
  formatRawValue,
  statMetricLabel,
} from './compareFormat';

const DIRECTION_ICON = {
  ahead: <TrendingUpIcon fontSize="small" />,
  behind: <TrendingDownIcon fontSize="small" />,
  even: <RemoveIcon fontSize="small" />,
  unknown: <HelpOutlineIcon fontSize="small" />,
};

const DIRECTION_COLOR = {
  ahead: 'success.main',
  behind: 'error.main',
  even: 'text.secondary',
  unknown: 'text.disabled',
};

const DIRECTION_LABEL = {
  ahead: '我方領先',
  behind: '我方落後',
  even: '兩者相同',
  unknown: '無資料',
};

/**
 * Fixed-order key stat rows (main stat, attack, damage, boss damage, IED,
 * critical rate, critical damage) — advantages and deficits stay in this
 * documented order rather than being sorted away. Rows and their order
 * come directly from `comparison.rows` exactly as returned by
 * compareCharacters; every value carries an evidence badge and
 * advantage/deficit/unknown state.
 */
export default function KeyStatTable({ comparison }) {
  const rows = comparison.rows.filter(row => row.category === 'stats');

  if (rows.length === 0) return null;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow>
            <TableCell>屬性</TableCell>
            <TableCell align="right">我的角色</TableCell>
            <TableCell align="center">差距方向</TableCell>
            <TableCell align="right">參考角色</TableCell>
            <TableCell align="right">差值</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.metric}>
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
                    {statMetricLabel(row.metric)}
                  </Typography>
                  <Chip
                    label={EVIDENCE_LABELS[row.evidence]}
                    size="small"
                    color={EVIDENCE_COLORS[row.evidence]}
                    sx={{ px: 1, height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                </Box>
              </TableCell>
              <TableCell align="right">
                {formatRawValue(row.left, row.unit)}
              </TableCell>
              <TableCell align="center">
                <Box
                  role="img"
                  aria-label={DIRECTION_LABEL[row.direction]}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    color: DIRECTION_COLOR[row.direction],
                  }}
                >
                  {DIRECTION_ICON[row.direction]}
                </Box>
              </TableCell>
              <TableCell align="right">
                {formatRawValue(row.right, row.unit)}
              </TableCell>
              <TableCell align="right">
                <Typography
                  component="span"
                  sx={{ fontWeight: 800, color: DIRECTION_COLOR[row.direction] }}
                >
                  {formatDelta(row.delta, row.unit)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
