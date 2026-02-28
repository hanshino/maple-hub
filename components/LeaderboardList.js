'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import LeaderboardCard from './LeaderboardCard';

const ITEMS_PER_PAGE = 20;
const DEBOUNCE_DELAY = 300; // ms

/**
 * LeaderboardList component
 * Displays combat power leaderboard with infinite scroll and filters
 */
export default function LeaderboardList() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [worldName, setWorldName] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    worlds: [],
    classes: [],
  });

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Fetch filter options
  useEffect(() => {
    fetch('/api/leaderboard/filters')
      .then((res) => res.json())
      .then((data) => setFilterOptions(data))
      .catch((err) =>
        console.error('Failed to fetch filter options:', err)
      );
  }, []);

  /**
   * Fetch leaderboard data from API
   * @param {number} offset - Starting position
   * @param {boolean} append - Whether to append to existing entries
   */
  const fetchLeaderboard = useCallback(
    async (offset = 0, append = false) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const params = new URLSearchParams({
          offset: String(offset),
          limit: String(ITEMS_PER_PAGE),
        });

        if (searchQuery) params.set('search', searchQuery);
        if (worldName) params.set('worldName', worldName);
        if (characterClass)
          params.set('characterClass', characterClass);

        const response = await fetch(
          `/api/leaderboard?${params}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }

        const data = await response.json();

        if (append) {
          setEntries((prev) => [...prev, ...data.entries]);
        } else {
          setEntries(data.entries);
        }

        setTotalCount(data.totalCount);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, worldName, characterClass]
  );

  // Filter handlers
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchText(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 500);
  }, []);

  const handleWorldChange = useCallback((e) => {
    setWorldName(e.target.value);
  }, []);

  const handleClassChange = useCallback((e) => {
    setCharacterClass(e.target.value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchText('');
    setSearchQuery('');
    setWorldName('');
    setCharacterClass('');
  }, []);

  const hasActiveFilters = !!(
    searchQuery ||
    worldName ||
    characterClass
  );

  /**
   * Load more entries with debounce
   */
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the load more request
    debounceTimerRef.current = setTimeout(() => {
      fetchLeaderboard(entries.length, true);
    }, DEBOUNCE_DELAY);
  }, [entries.length, hasMore, isLoadingMore, fetchLeaderboard]);

  /**
   * Retry loading after error
   */
  const handleRetry = useCallback(() => {
    if (entries.length === 0) {
      fetchLeaderboard(0, false);
    } else {
      fetchLeaderboard(entries.length, true);
    }
  }, [entries.length, fetchLeaderboard]);

  // Initial load
  useEffect(() => {
    fetchLeaderboard(0, false);
  }, [fetchLeaderboard]);

  // Set up Intersection Observer for infinite scroll
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasMore &&
          !isLoading &&
          !isLoadingMore
        ) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    // Observe the load more trigger element
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  // Filter bar (reusable across states)
  const filterBar = (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1.5,
        alignItems: { sm: 'center' },
      }}
    >
      <TextField
        size="small"
        placeholder="搜尋角色名稱..."
        value={searchText}
        onChange={handleSearchChange}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ flex: { sm: 1 }, minWidth: { sm: 200 } }}
      />
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flex: { sm: '0 0 auto' },
        }}
      >
        <FormControl
          size="small"
          sx={{
            minWidth: 120,
            flex: { xs: 1, sm: 'none' },
          }}
        >
          <InputLabel>伺服器</InputLabel>
          <Select
            value={worldName}
            onChange={handleWorldChange}
            label="伺服器"
          >
            <MenuItem value="">全部</MenuItem>
            {filterOptions.worlds.map((world) => (
              <MenuItem key={world} value={world}>
                {world}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl
          size="small"
          sx={{
            minWidth: 120,
            flex: { xs: 1, sm: 'none' },
          }}
        >
          <InputLabel>職業</InputLabel>
          <Select
            value={characterClass}
            onChange={handleClassChange}
            label="職業"
          >
            <MenuItem value="">全部</MenuItem>
            {filterOptions.classes.map((cls) => (
              <MenuItem key={cls} value={cls}>
                {cls}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );

  // Initial loading state
  if (isLoading && entries.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state with no data
  if (error && entries.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRetry}
        >
          重試
        </Button>
      </Paper>
    );
  }

  // Empty state
  if (!isLoading && entries.length === 0) {
    return (
      <Box>
        {filterBar}
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          {hasActiveFilters ? (
            <>
              <Typography
                variant="h6"
                color="text.secondary"
                gutterBottom
              >
                找不到符合條件的角色
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FilterListOffIcon />}
                onClick={handleClearFilters}
                sx={{ mt: 1 }}
              >
                清除篩選條件
              </Button>
            </>
          ) : (
            <>
              <Typography
                variant="h6"
                color="text.secondary"
                gutterBottom
              >
                目前沒有排行榜資料
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                請先透過首頁搜尋角色，系統會自動記錄戰力資訊
              </Typography>
            </>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {filterBar}

      {/* Counter */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          已載入 {entries.length} / {totalCount} 筆
        </Typography>
      </Box>

      {/* Leaderboard entries */}
      <Box>
        {entries.map((entry) => (
          <LeaderboardCard
            key={entry.ocid}
            rank={entry.rank}
            characterName={entry.character_name}
            characterLevel={entry.character_level}
            characterImage={entry.character_image}
            worldName={entry.world_name}
            characterClass={entry.character_class}
            combatPower={entry.combat_power}
            onClick={() =>
              router.push(`/?ocid=${entry.ocid}`)
            }
          />
        ))}
      </Box>

      {/* Load more trigger / Status indicator */}
      <Box
        ref={loadMoreRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 3,
        }}
      >
        {isLoadingMore && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              載入更多...
            </Typography>
          </Box>
        )}

        {error && entries.length > 0 && (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              載入失敗: {error}
            </Alert>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              size="small"
            >
              重試
            </Button>
          </Box>
        )}

        {!hasMore && entries.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <CheckCircleIcon
              fontSize="small"
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary">
              已載入全部資料
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
