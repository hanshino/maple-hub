'use client';

import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { filterRunesByType } from '../../lib/runeUtils';
import PanelEmpty from '../panel/PanelEmpty';
import SectionTitle from '../panel/SectionTitle';

const RUNE_TYPES = [
  { key: 'secret', label: '秘法符文' },
  { key: 'true', label: '真實符文' },
  { key: 'luxury', label: '豪華真實符文' },
];

/**
 * Compact rune summary for the three-card overview row — count and highest
 * level per rune type. Full per-rune detail lives in CharacterDataTabs'
 * 符文系統 tab (RuneSystems), which this does not re-derive.
 */
const RuneSummaryCard = ({ runes }) => {
  const groups = RUNE_TYPES.map(({ key, label }) => {
    const items = filterRunesByType(runes || [], key);
    if (items.length === 0) return null;
    const maxLevel = Math.max(...items.map(r => r.symbol_level || 0));
    return { key, label, count: items.length, maxLevel };
  }).filter(Boolean);

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <SectionTitle>符文摘要</SectionTitle>
        {groups.length === 0 ? (
          <PanelEmpty message="尚無符文系統資料" />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {groups.map(g => (
              <Box
                key={g.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  py: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {g.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Chip
                    label={`${g.count} 件`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                  <Chip
                    icon={<AutoAwesomeIcon sx={{ fontSize: 13 }} />}
                    label={`最高 Lv.${g.maxLevel}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RuneSummaryCard;
