'use client';

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { glassCardSx } from './glassCardSx';
import ErrorMessage from '../ErrorMessage';

function PresetChip({ label, mine, other }) {
  if (mine === null || mine === undefined) {
    return (
      <Chip
        label={`${label} 未知`}
        size="small"
        variant="outlined"
        sx={{ px: 1, fontWeight: 600 }}
      />
    );
  }

  const differs = other !== null && other !== undefined && other !== mine;
  const chip = (
    <Chip
      label={`${label} P${mine}`}
      size="small"
      color={differs ? 'warning' : 'default'}
      variant={differs ? 'filled' : 'outlined'}
      sx={{ px: 1, fontWeight: 700 }}
    />
  );

  if (!differs) return chip;
  return (
    <Tooltip title="與對側啟用的 Preset 不同" arrow>
      {chip}
    </Tooltip>
  );
}

function FighterPanel({ roleLabel, state, normalized, otherNormalized }) {
  const { status, data, error, retry } = state;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1 }}
      >
        {roleLabel}
      </Typography>

      {status === 'idle' && (
        <Typography variant="body2" color="text.secondary">
          請輸入角色名稱以開始比較
        </Typography>
      )}

      {status === 'loading' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Skeleton variant="circular" width={52} height={52} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="80%" />
          </Box>
        </Box>
      )}

      {status === 'error' && <ErrorMessage message={error} onRetry={retry} />}

      {status === 'success' && data && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main' }}>
              {data.basicInfo?.character_name?.charAt(0) || '?'}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800 }} noWrap>
                {data.basicInfo?.character_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {data.basicInfo?.character_class} · Lv.
                {data.basicInfo?.character_level} · {data.basicInfo?.world_name}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            <PresetChip
              label="裝備"
              mine={normalized?.equipment?.activePresetNo}
              other={otherNormalized?.equipment?.activePresetNo}
            />
            <PresetChip
              label="極限屬性"
              mine={normalized?.hyperStat?.activePresetNo}
              other={otherNormalized?.hyperStat?.activePresetNo}
            />
            <PresetChip
              label="連結技能"
              mine={normalized?.linkSkill?.activePresetNo}
              other={otherNormalized?.linkSkill?.activePresetNo}
            />
          </Box>

          <Box sx={{ mt: 'auto' }}>
            <Typography variant="caption" color="text.secondary">
              顯示戰鬥力（API 事實）
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.3rem', md: '1.6rem' },
              }}
            >
              {data.basicInfo?.combat_power != null
                ? Number(data.basicInfo.combat_power).toLocaleString('en-US')
                : '未知'}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}

function headlineWords({ leftName, rightName, relativePct, coverage }) {
  if (
    coverage !== 'complete' ||
    relativePct === null ||
    relativePct === undefined
  ) {
    return '戰鬥力差距未知（至少一側缺少資料）';
  }

  const mine = leftName || '我的角色';
  const reference = rightName || '參考角色';

  if (relativePct === 0) {
    return `${mine}與${reference}的戰鬥力相同`;
  }

  const magnitude = Math.abs(relativePct);
  return relativePct > 0
    ? `${reference}的戰鬥力比${mine}高 ${magnitude}%（以我的角色為基準）`
    : `${reference}的戰鬥力比${mine}低 ${magnitude}%（以我的角色為基準）`;
}

/**
 * The comparison header card: two fighter panels (each with its own
 * independent loading/error/retry state) plus a gap column showing the
 * combat-power difference and the swap action. Preset chips get a
 * warning tint and tooltip when the two sides' active preset numbers
 * differ, mirroring the approved mockup.
 */
export default function CompareHeaderCard({
  left,
  right,
  leftNormalized,
  rightNormalized,
  comparison,
  onSwap,
}) {
  const headline = comparison?.headline;

  return (
    <Card elevation={0} sx={{ ...glassCardSx, mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'stretch',
            gap: 2.5,
          }}
        >
          <FighterPanel
            roleLabel="我的角色"
            state={left}
            normalized={leftNormalized}
            otherNormalized={rightNormalized}
          />

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              minWidth: { md: 190 },
              textAlign: 'center',
              py: 1,
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 800 }}
            >
              戰力差距
            </Typography>
            {headline?.coverage === 'complete' ? (
              <>
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: 'error.main',
                    fontSize: '1.3rem',
                  }}
                >
                  {Math.abs(headline.delta).toLocaleString('en-US')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 220 }}
                >
                  {headlineWords({
                    leftName: comparison.left.name,
                    rightName: comparison.right.name,
                    relativePct: headline.relativePct,
                    coverage: headline.coverage,
                  })}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                尚未取得雙方戰鬥力資料
              </Typography>
            )}
            <IconButton
              onClick={onSwap}
              aria-label="交換左右角色"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <SwapHorizIcon />
            </IconButton>
          </Box>

          <FighterPanel
            roleLabel="參考角色"
            state={right}
            normalized={rightNormalized}
            otherNormalized={leftNormalized}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
