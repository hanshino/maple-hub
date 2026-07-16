'use client';

import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import PanelEmpty from '../panel/PanelEmpty';
import SectionTitle from '../panel/SectionTitle';

/**
 * Compact set-effect summary — active set names and piece counts only. Full
 * effect-by-effect breakdown lives in SetEffectPanel (CharacterDataTabs'
 * 套裝效果 tab), which this does not re-derive.
 */
const SetEffectSummaryCard = ({ data }) => {
  const sets = data?.set_effect ?? [];

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <SectionTitle>套裝效果</SectionTitle>
        {sets.length === 0 ? (
          <PanelEmpty message="尚無套裝效果資料" />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[...sets]
              .sort((a, b) => b.total_set_count - a.total_set_count)
              .map((set, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    py: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {set.set_name}
                  </Typography>
                  <Chip
                    label={`${set.total_set_count} 件`}
                    size="small"
                    color="primary"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                  />
                </Box>
              ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SetEffectSummaryCard;
