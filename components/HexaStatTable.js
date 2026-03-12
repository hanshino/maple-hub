'use client';

import { Box, Typography, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';

const MAX_STAT_GRADE = 20;

function StatCoreRow({ core }) {
  const gradePercent = Math.min(
    100,
    ((core.stat_grade || 0) / MAX_STAT_GRADE) * 100
  );

  const gradeColor =
    core.stat_grade === 0
      ? 'text.secondary'
      : core.stat_grade >= MAX_STAT_GRADE
        ? 'success.main'
        : 'primary.main';

  const barBgColor =
    core.stat_grade === 0
      ? 'action.disabled'
      : core.stat_grade >= MAX_STAT_GRADE
        ? 'success.main'
        : 'primary.main';

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 1.5,
        bgcolor: theme => alpha(theme.palette.primary.main, 0.04),
        '&:hover': {
          bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
        },
        transition: 'background-color 200ms',
      }}
    >
      {/* Top row: main stat + grade */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.5,
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, fontSize: '0.8rem' }}
        >
          {core.main_stat_name || '未啟用'}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: gradeColor, fontSize: '0.75rem' }}
        >
          {core.stat_grade}/{MAX_STAT_GRADE}
        </Typography>
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={gradePercent}
        sx={{
          height: 4,
          borderRadius: 2,
          mb: 0.75,
          bgcolor: theme => alpha(theme.palette.divider, 0.15),
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
            bgcolor: barBgColor,
          },
        }}
      />

      {/* Sub stats */}
      {(core.sub_stat_name_1 || core.sub_stat_name_2) && (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {core.sub_stat_name_1 && (
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontSize: '0.7rem' }}
            >
              {core.sub_stat_name_1} Lv.{core.sub_stat_level_1}
            </Typography>
          )}
          {core.sub_stat_name_2 && (
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontSize: '0.7rem' }}
            >
              {core.sub_stat_name_2} Lv.{core.sub_stat_level_2}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default function HexaStatTable({ cores }) {
  if (!cores || cores.length === 0) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          屬性核心
        </Typography>
        <Box
          sx={{
            py: 2,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: theme => alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', opacity: 0.6 }}
          >
            尚未啟用任何屬性核心
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        屬性核心
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {cores.map((core, index) => (
          <StatCoreRow
            key={`${core.slot_id || 'unknown'}-${index}`}
            core={core}
          />
        ))}
      </Box>
    </Box>
  );
}
