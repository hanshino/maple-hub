'use client';

import { Box, Card, Chip, Typography } from '@mui/material';
import { EVIDENCE_COLORS, EVIDENCE_LABELS, formatRawValue } from './compareFormat';

const SUMMARY_CATEGORIES = [
  { key: 'equipment', label: '裝備', getRow: c => c.equipment.starSum },
  { key: 'symbols', label: '符文', getRow: c => c.symbols.totalLevel },
  { key: 'union', label: '聯盟', getRow: c => c.union.level },
  { key: 'hexa', label: 'HEXA', getRow: c => c.hexa.authenticForce },
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
];

function noteFor(row) {
  if (row.coverage !== 'complete') return '本次資料不足，顯示為未知，不視為 0。';
  if (row.direction === 'behind') {
    return `落後 ${Math.abs(row.delta).toLocaleString('en-US')}。`;
  }
  if (row.direction === 'ahead') {
    return `領先 ${Math.abs(row.delta).toLocaleString('en-US')}。`;
  }
  if (row.direction === 'even') return '兩者相同。';
  return '尚無法比較。';
}

/**
 * Progression-system summary cards (Equipment/Symbols/Union/HEXA/Hyper
 * Stat/Link Skill/Set Effects). These stay visible in cross-class
 * comparisons too — only the main-stat rows and upgrade checklist are
 * class-specific and get hidden there.
 */
export default function ProgressionSummaryCards({ comparison }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(auto-fit, minmax(200px, 1fr))',
        },
        gap: 1.5,
      }}
    >
      {SUMMARY_CATEGORIES.map(({ key, label, getRow }) => {
        const row = getRow(comparison.categories);
        return (
          <Card
            key={key}
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>{label}</Typography>
              <Chip
                label={EVIDENCE_LABELS[row.evidence]}
                size="small"
                color={EVIDENCE_COLORS[row.evidence]}
                sx={{ px: 1, height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>
            <Typography sx={{ fontWeight: 800 }}>
              {formatRawValue(row.left, row.unit)}
              <Box
                component="span"
                sx={{ color: 'text.secondary', fontWeight: 400, mx: 0.75 }}
              >
                →
              </Box>
              {formatRawValue(row.right, row.unit)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {noteFor(row)}
            </Typography>
          </Card>
        );
      })}
    </Box>
  );
}
