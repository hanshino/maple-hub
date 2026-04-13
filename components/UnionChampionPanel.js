'use client';

import { Box, Typography, Chip, Grid, Paper, Tooltip } from '@mui/material';
import SectionTitle from './panel/SectionTitle';
import LockIcon from '@mui/icons-material/Lock';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const TOTAL_SLOTS = 6;

const GRADE_COLORS = {
  SSS: {
    bg: 'linear-gradient(135deg, #ffd700, #ff8c00)',
    border: '#ffd700',
    text: '#000',
  },
  SS: { bg: '#9c27b0', border: '#9c27b0', text: '#fff' },
  S: { bg: '#2196f3', border: '#2196f3', text: '#fff' },
  A: { bg: '#4caf50', border: '#4caf50', text: '#000' },
  B: { bg: '#9e9e9e', border: '#9e9e9e', text: '#000' },
  C: { bg: '#616161', border: '#616161', text: '#fff' },
};

const getGradeStyle = (grade) => GRADE_COLORS[grade] || GRADE_COLORS.C;

const ChampionCard = ({ champion }) => {
  const gradeStyle = getGradeStyle(champion.champion_grade);
  const badgeCount = champion.champion_badge_info?.length || 0;

  return (
    <Tooltip
      title={
        <Box>
          {(champion.champion_badge_info || []).map((b, i) => (
            <Typography key={i} variant="caption" display="block">
              {b.stat}
            </Typography>
          ))}
        </Box>
      }
      arrow
      placement="top"
    >
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2,
          borderColor: gradeStyle.border,
          borderWidth: 1.5,
          textAlign: 'center',
          cursor: 'default',
          transition: 'box-shadow 150ms ease',
          '&:hover': {
            boxShadow: `0 0 12px ${gradeStyle.border}40`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Chip
            label={champion.champion_grade}
            size="small"
            sx={{
              background: gradeStyle.bg,
              color: gradeStyle.text,
              fontWeight: 900,
              fontSize: '0.7rem',
              height: 22,
              minWidth: 36,
            }}
          />
          <Typography variant="caption" color="text.disabled">
            Slot {champion.champion_slot}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {champion.champion_class}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {champion.champion_name}
        </Typography>
        <Box
          aria-hidden="true"
          sx={{
            display: 'flex',
            gap: 0.5,
            justifyContent: 'center',
            mt: 1,
          }}
        >
          {Array.from({ length: badgeCount }).map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 14,
                height: 14,
                borderRadius: 0.5,
                bgcolor: gradeStyle.border,
                opacity: 0.8,
              }}
            />
          ))}
        </Box>
      </Paper>
    </Tooltip>
  );
};

const EmptySlot = () => (
  <Paper
    variant="outlined"
    data-testid="empty-slot"
    sx={{
      p: 1.5,
      borderRadius: 2,
      borderStyle: 'dashed',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
    }}
  >
    <LockIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
  </Paper>
);

const UnionChampionPanel = ({ loading, error, data, onRetry }) => {
  if (loading) return <PanelSkeleton rows={4} />;

  if (error) {
    return <PanelError message="無法載入聯盟冠軍資料" onRetry={onRetry} />;
  }

  const champions = data?.union_champion ?? [];
  const totalInfo = data?.champion_badge_total_info ?? [];

  if (champions.length === 0 && totalInfo.length === 0) {
    return <PanelEmpty message="尚無聯盟冠軍資料" />;
  }

  const emptySlotCount = TOTAL_SLOTS - champions.length;

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="聯盟冠軍角色與徽章加成" />

      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        {champions.map((champion) => (
          <Grid key={champion.champion_slot} size={{ xs: 6, md: 4 }}>
            <ChampionCard champion={champion} />
          </Grid>
        ))}
        {Array.from({ length: emptySlotCount }).map((_, i) => (
          <Grid key={`empty-${i}`} size={{ xs: 6, md: 4 }}>
            <EmptySlot />
          </Grid>
        ))}
      </Grid>

      {totalInfo.length > 0 && (
        <>
          <SectionTitle sx={{ mt: 2 }}>總效果</SectionTitle>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {totalInfo.map((badge, i) => (
              <Chip
                key={i}
                label={badge.stat}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'primary.light',
                  color: 'text.primary',
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default UnionChampionPanel;
