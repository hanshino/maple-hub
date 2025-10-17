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
import { generateDateRange } from '../lib/progressUtils';
import { apiCall, sequentialApiCalls } from '../lib/apiUtils';

export default function Home() {
  const [character, setCharacter] = useState(null);
  const [unionData, setUnionData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchCharacter = async ocid => {
    setLoading(true);
    setError(null);
    try {
      // Get data for the last 5 days (but only available dates after 2025-10-15)
      const dateConfigs = generateDateRange(7);
      const apiUrls = dateConfigs.map(
        config =>
          `/api/characters/${ocid}${config.needsDateParam ? `?date=${config.date}` : ''}`
      );

      // Execute API calls sequentially to respect rate limits
      const characterResponses = await sequentialApiCalls(apiUrls);

      // Process responses
      const characterResults = await Promise.all(
        characterResponses.map(async response => {
          if (response && response.ok) {
            try {
              return await response.json();
            } catch {
              return null;
            }
          }
          return null;
        })
      );

      // Filter out failed requests and get the most recent successful data
      const validCharacters = characterResults.filter(char => char !== null);
      const latestCharacter = validCharacters[validCharacters.length - 1];

      if (!latestCharacter) {
        throw new Error('No character data available');
      }

      setCharacter({ ...latestCharacter, ocid });

      // Fetch union data
      try {
        const unionResponse = await apiCall(`/api/union/${ocid}`);
        if (unionResponse.ok) {
          const union = await unionResponse.json();
          setUnionData(union);
        } else {
          setUnionData(null);
        }
      } catch {
        setUnionData(null);
      }

      // Prepare chart data from all valid characters
      const chartData = characterResults
        .map((char, index) =>
          char
            ? {
                date: dateConfigs[index].date,
                progress: parseFloat(char.character_exp_rate || 0),
              }
            : null
        )
        .filter(item => item !== null);

      // Always ensure we have at least current data for the chart
      if (chartData.length === 0 && latestCharacter) {
        const currentProgress = parseFloat(
          latestCharacter.character_exp_rate || 0
        );
        const singleDataPoint = [
          {
            date: new Date().toISOString().split('T')[0],
            progress: currentProgress,
          },
        ];
        setChartData(singleDataPoint);
      } else {
        setChartData(chartData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <CharacterSearch onSearch={searchCharacter} loading={loading} />
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            正在載入角色資料...
          </Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ mb: 4 }}>
          <ErrorMessage
            message={error}
            onRetry={() => {
              // Retry would need the last search term, for now just clear error
              setError(null);
            }}
          />
        </Box>
      )}

      {character && (
        <Box>
          {/* Single Row: Character info, experience progress, and Hexa Matrix progress */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 2 }}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 0, height: '100%' }}>
                  <CharacterCard
                    character={character}
                    historicalData={chartData}
                    unionData={unionData}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent sx={{ height: '100%' }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    進度視覺化
                  </Typography>
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <ProgressBar
                      progress={
                        parseFloat(character.character_exp_rate || 0) / 100
                      }
                      expRate={parseFloat(character.character_exp_rate || 0)}
                      historicalData={chartData}
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <ProgressChart progressData={chartData} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <HexaMatrixProgress character={character} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
}
