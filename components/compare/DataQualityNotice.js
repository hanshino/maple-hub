'use client';

import { Box, Card, CardContent, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { staticGlassCardSx } from './glassCardSx';
import { CATEGORY_COVERAGE } from './compareFormat';

function formatSyncedAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Data-quality notice: both syncedAt values, a >10-minute freshness
 * warning, the active-preset clarification (V1 never estimates
 * cross-preset combat power), undated-snapshot wording, and a list of
 * structurally missing categories. Every bullet reads directly from
 * `comparison.snapshot` and the normalized characters' `coverage` flags —
 * no per-category freshness claim is invented, per the spec's Error and
 * Partial-data Handling section.
 */
export default function DataQualityNotice({
  comparison,
  leftNormalized,
  rightNormalized,
}) {
  const { snapshot } = comparison;
  const leftLabel = formatSyncedAt(snapshot.leftSyncedAt);
  const rightLabel = formatSyncedAt(snapshot.rightSyncedAt);
  const diffMinutes =
    snapshot.diffMs !== null ? Math.round(snapshot.diffMs / 60000) : null;

  const missingCategories = CATEGORY_COVERAGE.filter(
    ({ key }) =>
      !leftNormalized?.[key]?.coverage && !rightNormalized?.[key]?.coverage
  );

  return (
    <Card
      elevation={0}
      sx={{
        ...staticGlassCardSx,
        mb: 3,
        borderColor: 'warning.main',
        bgcolor: theme =>
          theme.palette.mode === 'dark'
            ? 'rgba(232,179,75,0.10)'
            : 'rgba(240,173,45,0.12)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <WarningAmberIcon color="warning" fontSize="small" />
          <Typography
            variant="subtitle1"
            component="h2"
            sx={{ fontWeight: 800 }}
          >
            資料品質
          </Typography>
        </Box>

        <Box component="ul" sx={{ m: 0, pl: 2.5, display: 'grid', gap: 1 }}>
          <Typography component="li" variant="body2">
            快照時間 — 我的角色：{leftLabel || '未標註日期'} · 參考角色：
            {rightLabel || '未標註日期'}
            {diffMinutes !== null && `（相差 ${diffMinutes} 分鐘）`}
          </Typography>

          {snapshot.warning && (
            <Typography
              component="li"
              variant="body2"
              sx={{ color: 'warning.main', fontWeight: 700 }}
            >
              快照時間相差超過 10 分鐘，裝備或 Preset 變動可能影響本結果。
            </Typography>
          )}

          <Typography component="li" variant="body2">
            顯示戰鬥力為<strong>當前啟用的 preset 組合</strong>
            下的數值，不一定是該角色的最高戰力；本頁不推估切換 preset 後的戰力。
          </Typography>

          {snapshot.undated && (
            <Typography component="li" variant="body2">
              此為未標註日期的快照（上游 API
              未附日期欄位），並非同一瞬間的即時比較。
            </Typography>
          )}

          {missingCategories.length > 0 && (
            <Typography component="li" variant="body2">
              本次未提供的分類：
              <strong>
                {missingCategories.map(({ label }) => label).join('、')}
              </strong>
              — 相關數值顯示為「未知」，不會當成 0。
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
