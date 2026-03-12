'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useRouter } from 'next/navigation';
import CharacterCard from '../components/CharacterCard';
import ProgressChart from '../components/ProgressChart';
import ErrorMessage from '../components/ErrorMessage';
import HexaMatrixProgress from '../components/HexaMatrixProgress';
import ProgressBar from '../components/ProgressBar';
import CharacterSearch from '../components/CharacterSearch';
import EquipmentDialog from '../components/EquipmentDialog';
import CharacterDataTabs from '../components/CharacterDataTabs';
import StatBalanceChart from '../components/StatBalanceChart';
import RecentCharacters from '../components/RecentCharacters';
import { generateDateRange } from '../lib/progressUtils';
import { analyzeAllPresets } from '../lib/combatPowerCalculator';
import { saveSearchHistory, migrateStorage } from '../lib/localStorage';

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [character, setCharacter] = useState(null);
  const [charData, setCharData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastOcid, setLastOcid] = useState(null);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);

  useEffect(() => {
    migrateStorage();
  }, []);

  const searchCharacter = async ocid => {
    // Update URL so refresh preserves the selected character
    const url = new URL(window.location);
    url.searchParams.set('ocid', ocid);
    window.history.replaceState({}, '', url);

    setLastOcid(ocid);
    setLoading(true);
    setError(null);
    setCharacter(null);
    setCharData(null);
    setChartData([]);
    try {
      // Fetch all character data in one call + historical data in parallel
      const dateConfigs = generateDateRange(7);
      const historyUrls = dateConfigs.map(
        config =>
          `/api/characters/${ocid}${config.needsDateParam ? `?date=${config.date}` : ''}`
      );

      const [charResponse, ...historyResponses] = await Promise.all([
        fetch(`/api/character/${ocid}`),
        ...historyUrls.map(url => fetch(url).catch(() => null)),
      ]);

      if (!charResponse.ok) {
        if (charResponse.status === 404) {
          throw new Error('找不到此角色');
        }
        throw new Error('載入角色資料失敗');
      }

      const data = await charResponse.json();
      setCharData(data);

      const latestChar = { ...data.basicInfo, ocid };
      setCharacter(latestChar);

      // Save to search history
      saveSearchHistory(latestChar);

      // Process historical chart data
      const historyResults = await Promise.all(
        historyResponses.map(async res => {
          if (!res || !res.ok) return null;
          try {
            return await res.json();
          } catch {
            return null;
          }
        })
      );

      const chartPoints = historyResults
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

      if (chartPoints.length === 0 && data.basicInfo) {
        setChartData([
          {
            date: new Date().toISOString().split('T')[0],
            percentage: parseFloat(data.basicInfo.character_exp_rate || 0),
            level: parseInt(data.basicInfo.character_level || 0),
          },
        ]);
      } else {
        setChartData(chartPoints);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset state when navigating back to / without ocid param
  const currentOcid = searchParams.get('ocid');
  useEffect(() => {
    if (currentOcid) {
      searchCharacter(currentOcid);
    } else {
      // No ocid in URL — reset to welcome screen
      setCharacter(null);
      setCharData(null);
      setChartData([]);
      setError(null);
      setLastOcid(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOcid]);

  // Derived data from single API response
  const battlePower = charData?.basicInfo?.combat_power || null;
  const statsData = charData?.stats || null;
  const equipmentRawData = charData?.equipment || null;
  const unionData = charData?.union || null;
  const unionRaiderData = charData?.unionRaider || null;
  const runes = charData?.symbols?.symbol || [];
  const setEffectData = charData?.setEffects || null;
  const hexaCoreData = charData?.hexaCores || null;
  const hexaStatData = charData?.hexaStats || null;
  const hyperStatData = charData?.hyperStats || null;
  const linkSkillData = charData?.linkSkills || null;
  const unionArtifactData = charData?.unionArtifacts || null;
  const cashEquipmentData = charData?.cashEquipment || null;
  const petEquipmentData = charData?.petEquipment || null;

  // Compute preset analysis
  const presetAnalysis =
    equipmentRawData && statsData
      ? analyzeAllPresets(
          equipmentRawData,
          statsData,
          charData?.symbols || null,
          setEffectData,
          hyperStatData,
          linkSkillData
        )
      : null;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <CharacterSearch
          onSearch={searchCharacter}
          loading={loading}
          activeCharacter={character}
          onClear={() => router.push('/')}
        />
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
          <RecentCharacters onSelect={searchCharacter} />
        </Paper>
      )}

      {loading && (
        <Box>
          {/* Hero row Skeleton: Character card + Stat balance */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card elevation={4} sx={{ height: '100%' }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <StatBalanceChart
                statsData={null}
                equipmentData={null}
                loading={true}
              />
            </Grid>
          </Grid>

          {/* Two columns Skeleton */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card elevation={2}>
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
              <Card elevation={2}>
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
          {/* Hero row: Character info + Stat Balance side-by-side */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card elevation={4} sx={{ height: '100%' }}>
                <CharacterCard
                  character={character}
                  historicalData={chartData}
                  unionData={unionData}
                  battlePower={battlePower}
                  onEquipmentClick={() => setEquipmentDialogOpen(true)}
                  presetAnalysis={presetAnalysis}
                />
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <StatBalanceChart
                statsData={statsData}
                equipmentData={equipmentRawData}
                loading={false}
              />
            </Grid>
          </Grid>

          {/* Two columns: Progress + Hexa Matrix */}
          <Grid container spacing={2} sx={{ mb: 4, alignItems: 'flex-start' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ fontWeight: 700, mb: 2.5 }}
                  >
                    經驗值進度
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <ProgressBar
                      progress={
                        parseFloat(character.character_exp_rate || 0) / 100
                      }
                      expRate={5}
                      historicalData={chartData}
                      level={character.character_level}
                    />
                  </Box>
                  <ProgressChart progressData={chartData} />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <HexaMatrixProgress
                    character={character}
                    hexaCoreData={hexaCoreData}
                    hexaStatData={hexaStatData}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Character Data Tabs */}
          <Box sx={{ mt: 2 }}>
            <CharacterDataTabs
              ocid={character.ocid}
              runes={runes}
              setEffectData={setEffectData}
              statsData={statsData}
              hyperStatData={hyperStatData}
              linkSkillData={linkSkillData}
              unionRaiderData={unionRaiderData}
              unionArtifactData={unionArtifactData}
            />
          </Box>
        </Box>
      )}

      {/* Equipment Dialog */}
      {!loading && character && (
        <EquipmentDialog
          ocid={character.ocid}
          character={character}
          open={equipmentDialogOpen}
          onClose={() => setEquipmentDialogOpen(false)}
          prefetchedData={equipmentRawData}
          cashEquipmentData={cashEquipmentData}
          petEquipmentData={petEquipmentData}
        />
      )}
    </Container>
  );
}
