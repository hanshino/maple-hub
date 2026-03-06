'use client';

import { Box, Chip } from '@mui/material';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const UnionRaiderPanel = ({ loading, error, data, onRetry }) => {
  if (loading) return <PanelSkeleton rows={4} />;

  if (error) {
    return <PanelError message="無法載入聯盟戰地資料" onRetry={onRetry} />;
  }

  const stats = data?.union_raider_stat ?? [];

  if (stats.length === 0) {
    return <PanelEmpty message="尚無聯盟戰地資料" />;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="聯盟戰地格子所提供的能力值加成" />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 1 }}>
        {stats.map((stat, i) => (
          <Chip
            key={i}
            label={stat}
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
    </Box>
  );
};

export default UnionRaiderPanel;
