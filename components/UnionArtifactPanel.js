'use client';

import { Box, Typography, Chip, Grid, Paper } from '@mui/material';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const SectionTitle = ({ children }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 1 }}>
    <Box
      sx={{
        width: 3,
        height: 16,
        bgcolor: 'primary.main',
        borderRadius: 1,
        flexShrink: 0,
      }}
    />
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
      {children}
    </Typography>
  </Box>
);

const UnionArtifactPanel = ({ loading, error, data, onRetry }) => {
  if (loading) return <PanelSkeleton rows={4} />;

  if (error) {
    return <PanelError message="無法載入聯盟神器資料" onRetry={onRetry} />;
  }

  const crystals = data?.union_artifact_crystal ?? [];
  const effects = data?.union_artifact_effect ?? [];

  if (crystals.length === 0 && effects.length === 0) {
    return <PanelEmpty message="尚無聯盟神器資料" />;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="聯盟神器水晶與效果等級" />

      {crystals.length > 0 && (
        <>
          <SectionTitle>水晶</SectionTitle>
          <Grid container spacing={1.5}>
            {crystals.map((crystal, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {crystal.name}
                    </Typography>
                    <Chip
                      label={`Lv.${crystal.level}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  </Box>
                  {crystal.crystal_option_name_1 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {crystal.crystal_option_name_1}
                    </Typography>
                  )}
                  {crystal.crystal_option_name_2 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {crystal.crystal_option_name_2}
                    </Typography>
                  )}
                  {crystal.crystal_option_name_3 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {crystal.crystal_option_name_3}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {crystals.length > 0 && effects.length > 0 && <Box sx={{ height: 8 }} />}

      {effects.length > 0 && (
        <>
          <SectionTitle>效果</SectionTitle>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {effects.map((effect, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  px: 1,
                  py: 0.5,
                  '&:hover': {
                    bgcolor: theme => `${theme.palette.primary.main}0a`,
                  },
                }}
              >
                <Typography variant="body2">{effect.name}</Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: 'primary.main' }}
                >
                  Lv.{effect.level}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default UnionArtifactPanel;
