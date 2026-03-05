'use client';

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const SetEffectPanel = ({ loading, error, data, onRetry }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
                重試
              </Button>
            )
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const sets = data?.set_effect ?? [];

  if (sets.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">尚無套裝效果資料</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        p: 1,
      }}
    >
      {sets.map((set, i) => {
        const activeEffects = (set.set_effect_info ?? []).filter(
          (e) => e.set_count <= set.total_set_count
        );
        return (
          <Accordion key={i} defaultExpanded={false} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {set.set_name}
                </Typography>
                <Chip
                  label={`${set.total_set_count}件`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {activeEffects.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  無主動效果
                </Typography>
              ) : (
                activeEffects.map((effect, j) => (
                  <Box key={j} sx={{ mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: 'text.secondary' }}
                    >
                      {effect.set_count}件效果
                    </Typography>
                    <Typography variant="body2">{effect.set_option}</Typography>
                  </Box>
                ))
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default SetEffectPanel;
