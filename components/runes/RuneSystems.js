import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';
import RuneCard from './RuneCard';
import { filterRunesByType } from '../../lib/runeUtils';
import PanelEmpty from '../panel/PanelEmpty';
import SectionHeader from '../panel/SectionHeader';

const RUNE_TYPES = [
  { key: 'secret', label: '祕法符文' },
  { key: 'true', label: '真實符文' },
  { key: 'luxury', label: '豪華真實符文' },
];

const RuneCardSkeleton = () => (
  <Card sx={{ borderRadius: 2 }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
        <Skeleton variant="rounded" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
        </Box>
      </Box>
      <Skeleton variant="rounded" height={6} sx={{ borderRadius: 3 }} />
    </CardContent>
  </Card>
);

export default function RuneSystems({ runes }) {
  const filteredRunes = useMemo(
    () => ({
      secret: filterRunesByType(runes, 'secret'),
      true: filterRunesByType(runes, 'true'),
      luxury: filterRunesByType(runes, 'luxury'),
    }),
    [runes]
  );

  const availableTypes = useMemo(
    () => RUNE_TYPES.filter(({ key }) => filteredRunes[key].length > 0),
    [filteredRunes]
  );

  const [activeTypeKey, setActiveTypeKey] = useState(
    availableTypes[0]?.key ?? 'secret'
  );

  if (availableTypes.length === 0) {
    return <PanelEmpty message="尚無符文系統資料" />;
  }

  const currentRunes = filteredRunes[activeTypeKey] ?? [];

  return (
    <Box sx={{ mt: 1 }} role="region" aria-label="符文系統">
      <SectionHeader description="各地區符文目前等級與升級所需經驗" />

      {availableTypes.length > 1 && (
        <ToggleButtonGroup
          value={activeTypeKey}
          exclusive
          onChange={(_, v) => v !== null && setActiveTypeKey(v)}
          size="small"
          sx={{ mb: 2, flexWrap: 'wrap' }}
          aria-label="符文類型選擇"
        >
          {availableTypes.map(({ key, label }) => (
            <ToggleButton
              key={key}
              value={key}
              sx={{ px: 2, borderRadius: '20px !important' }}
            >
              {label} ({filteredRunes[key].length})
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}

      <Grid container spacing={1.5}>
        {currentRunes.map(rune => (
          <Grid key={rune.symbol_name} size={{ xs: 12, sm: 6, md: 4 }}>
            <RuneCard rune={rune} />
          </Grid>
        ))}
        {Array.from({ length: Math.max(0, 6 - currentRunes.length) }).map(
          (_, i) => (
            <Grid key={`skeleton-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
              <RuneCardSkeleton />
            </Grid>
          )
        )}
      </Grid>
    </Box>
  );
}
