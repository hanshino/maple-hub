'use client';

import { Box, Typography } from '@mui/material';
import CategoryCompareTab from './CategoryCompareTab';

function AbilityPane({ title, abilityData }) {
  const lines = abilityData?.ability_info;
  const grade = abilityData?.ability_grade;

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 1 }}
      >
        {title}
        {grade ? `（${grade}）` : ''}
      </Typography>
      <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
        {!Array.isArray(lines) || lines.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            本次資料不足，不視為 0。
          </Typography>
        ) : (
          lines.map((line, index) => (
            <Typography
              key={`${line?.ability_no ?? index}`}
              variant="body2"
              sx={{ '&:not(:last-child)': { mb: 1 } }}
            >
              【{line?.ability_grade ?? '?'}】{line?.ability_value ?? ''}
            </Typography>
          ))
        )}
      </Box>
    </Box>
  );
}

/**
 * Inner ability (內在能力) comparison tab: parsed combat-relevant sums
 * from `comparison.categories.ability` (rows hidden when both sides are
 * zero — utility lines don't parse into any row), then each side's
 * active preset lines verbatim so nothing the parser skips is hidden.
 */
export default function AbilityCompareTab({
  rows,
  presetInfo,
  leftAbilityData,
  rightAbilityData,
}) {
  const visible = (rows || []).filter(
    ({ row }) => row && (row.left > 0 || row.right > 0)
  );

  return (
    <Box>
      <CategoryCompareTab rows={visible} presetInfo={presetInfo} />

      <Box component="h4" sx={{ fontWeight: 800, mt: 4, mb: 2 }}>
        啟用中的內在能力詞條
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <AbilityPane title="我的角色" abilityData={leftAbilityData} />
        <AbilityPane title="參考角色" abilityData={rightAbilityData} />
      </Box>
    </Box>
  );
}
