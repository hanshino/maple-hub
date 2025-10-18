import React, { useState, useMemo } from 'react';
import { Box, Tabs, Tab, Grid } from '@mui/material';
import RuneCard from './RuneCard';
import { filterRunesByType } from '../../lib/runeUtils';

const RUNE_TYPES = [
  { key: 'secret', label: '祕法符文' },
  { key: 'true', label: '真實符文' },
  { key: 'luxury', label: '豪華真實符文' },
];

export default function RuneSystems({ runes }) {
  const [tabValue, setTabValue] = useState(0);

  // Memoize filtered runes to avoid recalculation on re-renders
  const filteredRunes = useMemo(
    () => ({
      secret: filterRunesByType(runes, 'secret'),
      true: filterRunesByType(runes, 'true'),
      luxury: filterRunesByType(runes, 'luxury'),
    }),
    [runes]
  );

  // Create tabs and contents dynamically
  const { tabs, tabContents } = useMemo(() => {
    const tabs = [];
    const tabContents = [];

    RUNE_TYPES.forEach(({ key, label }) => {
      const runeList = filteredRunes[key];
      if (runeList.length > 0) {
        tabs.push(
          <Tab
            key={key}
            label={label}
            id={`rune-tab-${key}`}
            aria-controls={`rune-panel-${key}`}
          />
        );

        tabContents.push(
          <Grid
            key={key}
            container
            spacing={2}
            sx={{
              justifyContent: {
                xs: 'center',
                sm: 'flex-start',
              },
            }}
            id={`rune-panel-${key}`}
            role="tabpanel"
            aria-labelledby={`rune-tab-${key}`}
          >
            {runeList.map(rune => (
              <Grid
                item
                key={rune.symbol_name}
                xs={12}
                sm={6}
                md={4}
                lg={4}
                xl={4}
              >
                <RuneCard rune={rune} />
              </Grid>
            ))}
            {/* Add skeleton placeholders to reach 6 */}
            {Array.from({ length: Math.max(0, 6 - runeList.length) }).map(
              (_, i) => (
                <Grid
                  item
                  key={`skeleton-${key}-${i}`}
                  xs={12}
                  sm={6}
                  md={4}
                  lg={4}
                  xl={4}
                >
                  <Box
                    sx={{
                      width: 220,
                      minWidth: 200,
                      maxWidth: 250,
                      height: 200,
                      bgcolor: 'grey.300',
                      borderRadius: 1,
                    }}
                    aria-label="Loading rune placeholder"
                  />
                </Grid>
              )
            )}
          </Grid>
        );
      }
    });

    return { tabs, tabContents };
  }, [filteredRunes]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (tabs.length === 0) {
    return (
      <Box role="region" aria-label="Rune systems" aria-live="polite">
        No rune data available
      </Box>
    );
  }

  return (
    <Box role="region" aria-label="Rune systems">
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
        aria-label="Rune type selection"
      >
        {tabs}
      </Tabs>
      <Box sx={{ p: 3 }}>{tabContents[tabValue]}</Box>
    </Box>
  );
}
