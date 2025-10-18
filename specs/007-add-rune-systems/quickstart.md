# Quickstart: Add Rune Systems to Character Info

**Feature**: Add Rune Systems to Character Info
**Date**: 2025-10-18

## Overview

This feature adds a rune systems display to character information pages, showing Secret, True, and Luxury Authentic runes with progress bars, icons, and upgrade information in a tabbed interface.

## Prerequisites

- Next.js 14 application with App Router
- Character info page component (`app/character/[id]/page.js`)
- Nexon MapleStory API access with `API_KEY` environment variable
- Material-UI components library

## Implementation Steps

### 1. Environment Setup

Add to `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://open.api.nexon.com/maplestorytw/v1
API_KEY=your_nexon_api_key_here
```

### 2. API Integration

Create a Next.js API route to proxy Nexon API calls:

```javascript
// app/api/character/[ocid]/runes/route.js
import axios from 'axios';
import { handleApiError } from '../../../../lib/apiErrorHandler';

export async function GET(request, { params }) {
  const { ocid } = params;
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const response = await axios.get(
      `https://open.api.nexon.com/maplestorytw/v1/character/symbol-equipment?ocid=${ocid}`,
      { headers: { 'x-nxopen-api-key': apiKey } }
    );
    return Response.json(response.data);
  } catch (error) {
    const apiError = handleApiError(error);
    return Response.json(
      { error: apiError.message },
      { status: apiError.status || 500 }
    );
  }
}
```

### 3. Utility Functions

Create rune processing utilities:

```javascript
// lib/runeUtils.js
export function filterRunesByType(runes, type) {
  const typeMap = {
    secret: '祕法符文',
    true: '真實符文',
    luxury: '豪華真實符文',
  };
  return runes.filter(rune => rune.symbol_name.startsWith(typeMap[type]));
}

export function calculateRuneProgress(rune) {
  const { symbol_level, symbol_growth_count, symbol_require_growth_count } =
    rune;
  if (symbol_level >= getMaxLevel(rune)) return 100;
  return Math.min(
    (symbol_growth_count / symbol_require_growth_count) * 100,
    100
  );
}

export function getMaxLevel(rune) {
  return rune.symbol_name.startsWith('祕法符文') ? 20 : 11;
}
```

### 4. Rune Components

Create RuneCard component:

```javascript
// components/runes/RuneCard.js
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
import Image from 'next/image';
import { calculateRuneProgress } from '../../lib/runeUtils';

export default function RuneCard({ rune }) {
  const progress = calculateRuneProgress(rune);

  return (
    <Card role="article" aria-label={`${rune.symbol_name} rune card`}>
      <CardContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          <Image
            src={rune.symbol_icon}
            alt={rune.symbol_name}
            width={48}
            height={48}
          />
          <Typography
            variant="body2"
            aria-label={`Rune name: ${rune.symbol_name}`}
          >
            {rune.symbol_name}
          </Typography>
          <Typography
            variant="body2"
            aria-label={`Current level: ${rune.symbol_level}`}
          >
            Level: {rune.symbol_level}
          </Typography>
          <Typography
            variant="body2"
            aria-label={`Force value: ${rune.symbol_force}`}
          >
            Force: {rune.symbol_force}
          </Typography>
          <Box
            width="100%"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption">{progress.toFixed(1)}%</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
```

Create RuneSystems component:

```javascript
// components/runes/RuneSystems.js
import React, { useState, useMemo } from 'react';
import { Box, Tabs, Tab, Grid } from '@mui/material';
import RuneCard from './RuneCard';
import { filterRunesByType } from '../../lib/runeUtils';

const RUNE_TYPES = [
  { key: 'secret', label: 'Secret Runes' },
  { key: 'true', label: 'True Runes' },
  { key: 'luxury', label: 'Luxury Runes' },
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
            id={`rune-panel-${key}`}
            role="tabpanel"
            aria-labelledby={`rune-tab-${key}`}
          >
            {runeList.map(rune => (
              <Grid item key={rune.symbol_name} xs={4}>
                <RuneCard rune={rune} />
              </Grid>
            ))}
            {/* Add skeleton placeholders to reach 6 */}
            {Array.from({ length: Math.max(0, 6 - runeList.length) }).map(
              (_, i) => (
                <Grid item key={`skeleton-${key}-${i}`} xs={4}>
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
```

### 5. Error Boundary

Create an error boundary component for graceful error handling:

```javascript
// components/runes/ErrorBoundary.js
import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

class RuneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Rune system error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            bgcolor: 'error.light',
            color: 'error.contrastText',
          }}
          role="alert"
          aria-live="assertive"
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Rune System Error
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Something went wrong while loading the rune information.
          </Typography>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                component="pre"
                sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </Typography>
            </Alert>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={this.handleRetry}
            aria-label="Retry loading rune system"
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default RuneErrorBoundary;
```

Add to home page (app/page.js):

```javascript
// app/page.js
'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import CharacterCard from '../components/CharacterCard';
import ProgressChart from '../components/ProgressChart';
import ErrorMessage from '../components/ErrorMessage';
import HexaMatrixProgress from '../components/HexaMatrixProgress';
import ProgressBar from '../components/ProgressBar';
import CharacterSearch from '../components/CharacterSearch';
import RuneSystems from '../components/runes/RuneSystems';
import RuneErrorBoundary from '../components/runes/ErrorBoundary';
import { generateDateRange } from '../lib/progressUtils';
import { apiCall, batchApiCalls } from '../lib/apiUtils';

export default function Home() {
  const [character, setCharacter] = useState(null);
  const [unionData, setUnionData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [runes, setRunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchCharacter = async ocid => {
    // ... existing search logic for character and union data ...

    // Fetch rune data
    try {
      const runeResponse = await apiCall(`/api/character/${ocid}/runes`);
      if (runeResponse.status >= 200 && runeResponse.status < 300) {
        setRunes(runeResponse.data.symbol || []);
      } else {
        setRunes([]);
      }
    } catch {
      setRunes([]);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* ... existing search and character display logic ... */}

      {/* Rune Systems Section */}
      {character && (
        <Box sx={{ mt: 4 }}>
          <Card elevation={3}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                符文系統
              </Typography>
              <RuneErrorBoundary>
                <RuneSystems runes={runes} />
              </RuneErrorBoundary>
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
}
```

## Testing

Run the test suite:

```bash
npm test -- --testPathPattern="runeUtils|runes"
```

## Features

- **Home Page Integration**: Rune systems are now displayed directly on the home page after character search, providing a unified experience
- **Tabbed Interface**: Separate tabs for Secret, True, and Luxury runes with dynamic tab generation
- **Progress Bars**: Visual progress indicators for rune upgrades with percentage display
- **Skeleton Placeholders**: Shows 6 slots per type with loading placeholders for missing runes
- **Accessibility**: Full ARIA support for screen readers, keyboard navigation, and progress announcements
- **Error Handling**: Graceful error boundaries with retry functionality and development error details
- **Performance**: Memoized calculations and optimized re-renders using React.useMemo
- **Responsive Design**: Fixed 3-column grid layout (2 rows × 3 columns) that adapts to different screen sizes while maintaining consistent rune placement
- **Loading States**: Proper loading indicators and error states for better UX

## Migration Notes

The rune system was originally designed as a separate page (`app/character/[id]/page.js`) but has been integrated into the home page (`app/page.js`) for a better user experience. The separate character page is no longer needed and can be removed.

## Deployment

Ensure `API_KEY` environment variable is set in production environment.
