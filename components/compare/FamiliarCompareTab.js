'use client';

import { Box, Typography } from '@mui/material';
import CategoryCompareTab from './CategoryCompareTab';

// Formats one raw familiar option entry for display, e.g.
// { option_name: '最終傷害 (%)', option_value: '20' } → 最終傷害 +20%.
// Non-percentage options (緩慢效果 etc.) render as plain "name value".
function formatOption(option) {
  const name = option?.option_name || '';
  const value = option?.option_value ?? '';
  return name.endsWith(' (%)')
    ? `${name.slice(0, -4)} +${value}%`
    : `${name} ${value}`;
}

function SummonedPane({ title, familiarData }) {
  const list = familiarData?.familiar_info;
  const summoned = Array.isArray(list)
    ? list.filter(f => f?.summoned_flag === 'true')
    : null;

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 1 }}
      >
        {title}
      </Typography>
      <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
        {summoned === null ? (
          <Typography variant="body2" color="text.disabled">
            本次資料不足，不視為 0。
          </Typography>
        ) : summoned.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            未裝備萌獸
          </Typography>
        ) : (
          summoned.map(f => (
            <Box key={f.familiar_name} sx={{ '&:not(:last-child)': { mb: 2 } }}>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                {f.familiar_name}
              </Typography>
              {(Array.isArray(f.option) ? f.option : []).map(
                (option, index) => (
                  <Typography
                    key={`${option?.option_no ?? index}`}
                    variant="body2"
                    color="text.secondary"
                  >
                    {formatOption(option)}
                  </Typography>
                )
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

/**
 * Familiar (萌獸) comparison tab: summary rows from
 * `comparison.categories.familiar`, then each side's actually equipped
 * (summoned_flag) familiars with their concrete option values — the
 * numbers that apply in combat, 最終傷害 in particular. The 羈絆 link
 * system only appears as the summary count row.
 */
export default function FamiliarCompareTab({
  rows,
  leftFamiliarData,
  rightFamiliarData,
}) {
  return (
    <Box>
      <CategoryCompareTab rows={rows} />

      <Box component="h4" sx={{ fontWeight: 800, mt: 4, mb: 2 }}>
        裝備中萌獸
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <SummonedPane title="我的角色" familiarData={leftFamiliarData} />
        <SummonedPane title="參考角色" familiarData={rightFamiliarData} />
      </Box>
    </Box>
  );
}
