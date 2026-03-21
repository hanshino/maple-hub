'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';
import { track } from '@/lib/analytics';

const WORLDS = ['殺人鯨', '琉德', '普力特', '優依娜', '艾麗亞'];

export default function GuildSearch() {
  const router = useRouter();
  const { mode } = useColorMode();
  const [guildName, setGuildName] = useState('');
  const [world, setWorld] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const glassCardSx = { ...getGlassCardSx(mode), p: 3 };

  const handleSearch = useCallback(
    async e => {
      e.preventDefault();
      if (!guildName.trim() || !world) return;

      setLoading(true);
      setError('');
      track('guild_search', { world, guildName: guildName.trim() });

      try {
        const res = await fetch(
          `/api/guild/search?name=${encodeURIComponent(guildName.trim())}&world=${encodeURIComponent(world)}`
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '搜尋失敗');
        }

        router.push(
          `/guild/${encodeURIComponent(world)}/${encodeURIComponent(guildName.trim())}`
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [guildName, world, router]
  );

  return (
    <Box sx={glassCardSx}>
      <Box component="form" onSubmit={handleSearch}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'flex-start' },
          }}
        >
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>伺服器</InputLabel>
            <Select
              value={world}
              label="伺服器"
              onChange={e => setWorld(e.target.value)}
            >
              {WORLDS.map(w => (
                <MenuItem key={w} value={w}>
                  {w}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="工會名稱"
            value={guildName}
            onChange={e => setGuildName(e.target.value)}
            sx={{ flex: 1 }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading || !guildName.trim() || !world}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SearchIcon />
              )
            }
            sx={{ minWidth: 100, height: 56 }}
          >
            {loading ? '搜尋中' : '搜尋'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
