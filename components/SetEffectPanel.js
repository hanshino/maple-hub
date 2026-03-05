'use client';

import {
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const SetEffectPanel = ({ loading, error, data, onRetry }) => {
  if (loading) return <PanelSkeleton rows={4} />;

  if (error) {
    return <PanelError message="無法載入套裝效果資料" onRetry={onRetry} />;
  }

  const sets = data?.set_effect ?? [];

  if (sets.length === 0) {
    return <PanelEmpty message="尚無套裝效果資料" />;
  }

  const sortedSets = [...sets].sort(
    (a, b) => b.total_set_count - a.total_set_count
  );

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="目前裝備的套裝組合與生效的套裝效果" />
      {sortedSets.map((set, i) => {
        const activeEffects = (set.set_effect_info ?? []).filter(
          e => e.set_count <= set.total_set_count
        );
        return (
          <Accordion key={i} defaultExpanded={false} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {set.set_name}
                </Typography>
                <Chip
                  label={`${set.total_set_count}件`}
                  size="small"
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {activeEffects.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  此套裝目前無生效的效果
                </Typography>
              ) : (
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}
                >
                  {activeEffects.map((effect, j) => (
                    <Box
                      key={j}
                      sx={{
                        pl: 1.5,
                        borderLeft: '2px solid',
                        borderColor: 'primary.light',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: 'text.secondary' }}
                      >
                        {effect.set_count}件
                      </Typography>
                      <Typography variant="body2">
                        {effect.set_option}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default SetEffectPanel;
