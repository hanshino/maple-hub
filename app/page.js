'use client';

import { useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Skeleton,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import Link from 'next/link';
import CharacterCard from '../components/CharacterCard';
import ProgressChart from '../components/ProgressChart';
import ErrorMessage from '../components/ErrorMessage';
import HexaMatrixProgress from '../components/HexaMatrixProgress';
import ProgressBar from '../components/ProgressBar';
import CharacterSearch from '../components/CharacterSearch';
import RuneSystems from '../components/runes/RuneSystems';
import RuneErrorBoundary from '../components/runes/ErrorBoundary';
import EquipmentDialog from '../components/EquipmentDialog';
import CharacterStats from '../components/CharacterStats';
import { generateDateRange } from '../lib/progressUtils';
import { apiCall, batchApiCalls } from '../lib/apiUtils';

export default function Home() {
  const [character, setCharacter] = useState(null);
  const [unionData, setUnionData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [runes, setRunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [battlePower, setBattlePower] = useState(null);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [lastOcid, setLastOcid] = useState(null);

  const searchCharacter = async ocid => {
    setLastOcid(ocid);
    setLoading(true);
    setError(null);
    setCharacter(null);
    setUnionData(null);
    setChartData([]);
    setRunes([]);
    setBattlePower(null);
    try {
      // Get data for the last 5 days (but only available dates after 2025-10-15)
      const dateConfigs = generateDateRange(7);
      const apiUrls = dateConfigs.map(
        config =>
          `/api/characters/${ocid}${config.needsDateParam ? `?date=${config.date}` : ''}`
      );

      // Execute API calls with environment-based strategy
      const characterResponses = await batchApiCalls(apiUrls);

      // Process responses (axios format)
      const characterResults = characterResponses.map(response => {
        if (response && response.status >= 200 && response.status < 300) {
          try {
            return response.data;
          } catch {
            return null;
          }
        }
        return null;
      });

      // Filter out failed requests and get the most recent successful data
      const validCharacters = characterResults.filter(char => char !== null);
      const latestCharacter = validCharacters[validCharacters.length - 1];

      if (!latestCharacter) {
        throw new Error('No character data available');
      }

      setCharacter({ ...latestCharacter, ocid });

      // Fetch stats, union, runes in parallel
      const [statsResult, unionResult, runeResult] = await Promise.all([
        apiCall(`/api/character/stats?ocid=${ocid}`).catch(() => null),
        apiCall(`/api/union/${ocid}`).catch(() => null),
        apiCall(`/api/character/${ocid}/runes`).catch(() => null),
      ]);

      // Process battle power
      if (statsResult?.status >= 200 && statsResult?.status < 300) {
        const battlePowerValue = statsResult.data.final_stat?.find(
          stat => stat.stat_name === '戰鬥力'
        )?.stat_value;
        setBattlePower(battlePowerValue ? parseInt(battlePowerValue) : null);
      }

      // Process union data
      if (unionResult?.status >= 200 && unionResult?.status < 300) {
        setUnionData(unionResult.data);
      }

      // Process rune data
      if (runeResult?.status >= 200 && runeResult?.status < 300) {
        setRunes(runeResult.data.symbol || []);
      }

      // Prepare chart data from all valid characters
      const chartData = characterResults
        .map((char, index) =>
          char
            ? {
                date: dateConfigs[index].date,
                percentage: parseFloat(char.character_exp_rate || 0),
                level: parseInt(char.character_level || 0),
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
            percentage: currentProgress,
            level: parseInt(latestCharacter.character_level || 0),
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

      {/* Empty state: show when no character loaded and not loading */}
      {!loading && !character && !error && (
        <Paper
          elevation={0}
          sx={{
            py: { xs: 6, md: 10 },
            px: 3,
            textAlign: 'center',
            backgroundColor: 'transparent',
          }}
        >
          <SearchIcon
            sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4, mb: 2 }}
          />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            搜尋你的 MapleStory 角色
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 480, mx: 'auto' }}
          >
            輸入角色名稱即可查看詳細數據、經驗值進度、六轉核心與裝備資訊
          </Typography>
          <Button
            component={Link}
            href="/leaderboard"
            variant="outlined"
            startIcon={<LeaderboardIcon />}
            sx={{ textTransform: 'none' }}
          >
            查看戰力排行榜
          </Button>
        </Paper>
      )}

      {loading && (
        <Box>
          {/* Hero Card Skeleton */}
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'center', md: 'flex-start' },
                  gap: { xs: 2, md: 3 },
                }}
              >
                <Skeleton
                  variant="circular"
                  sx={{
                    width: { xs: 80, md: 96 },
                    height: { xs: 80, md: 96 },
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      mb: 1,
                      justifyContent: { xs: 'center', md: 'flex-start' },
                    }}
                  >
                    <Skeleton variant="text" width={120} height={32} />
                    <Skeleton
                      variant="rounded"
                      width={60}
                      height={24}
                      sx={{ borderRadius: 3 }}
                    />
                    <Skeleton variant="text" width={40} height={24} />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      mb: 1.5,
                      justifyContent: { xs: 'center', md: 'flex-start' },
                    }}
                  >
                    <Skeleton
                      variant="rounded"
                      width={100}
                      height={24}
                      sx={{ borderRadius: 3 }}
                    />
                    <Skeleton
                      variant="rounded"
                      width={80}
                      height={24}
                      sx={{ borderRadius: 3 }}
                    />
                    <Skeleton
                      variant="rounded"
                      width={120}
                      height={24}
                      sx={{ borderRadius: 3 }}
                    />
                  </Box>
                  <Skeleton variant="text" width={180} height={20} />
                </Box>
                <Skeleton
                  variant="rounded"
                  width={140}
                  height={56}
                  sx={{
                    flexShrink: 0,
                    display: { xs: 'none', md: 'block' },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Two columns Skeleton */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card elevation={3}>
                <CardContent>
                  <Skeleton variant="text" width={120} height={32} />
                  <Skeleton
                    variant="rounded"
                    height={10}
                    sx={{ my: 2, borderRadius: 1 }}
                  />
                  <Skeleton
                    variant="rounded"
                    height={300}
                    sx={{ borderRadius: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card elevation={3}>
                <CardContent sx={{ p: 3 }}>
                  <Skeleton variant="text" width={100} height={32} />
                  <Skeleton
                    variant="circular"
                    width={200}
                    height={200}
                    sx={{ mx: 'auto', my: 2 }}
                  />
                  <Skeleton variant="rounded" height={80} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {error && (
        <Box sx={{ mb: 4 }}>
          <ErrorMessage
            message={error}
            onRetry={() => {
              if (lastOcid) {
                searchCharacter(lastOcid);
              } else {
                setError(null);
              }
            }}
          />
        </Box>
      )}

      {!loading && character && (
        <Box>
          {/* Hero Card: Character info */}
          <Card elevation={3} sx={{ mb: 3 }}>
            <CharacterCard
              character={character}
              historicalData={chartData}
              unionData={unionData}
              battlePower={battlePower}
              onEquipmentClick={() => setEquipmentDialogOpen(true)}
            />
          </Card>

          {/* Two columns: Progress + Hexa Matrix */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 7 }}>
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
                      expRate={5}
                      historicalData={chartData}
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <ProgressChart progressData={chartData} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <HexaMatrixProgress character={character} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Stats Section */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12 }}>
              <CharacterStats ocid={character.ocid} />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Equipment Dialog */}
      {!loading && character && (
        <EquipmentDialog
          ocid={character.ocid}
          character={character}
          open={equipmentDialogOpen}
          onClose={() => setEquipmentDialogOpen(false)}
        />
      )}

      {/* Rune Systems Section */}
      {!loading && character && (
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
