'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import CharacterCard from '../../components/CharacterCard';
import { apiCall } from '../../lib/apiUtils';

export default function Dashboard() {
  const [character, setCharacter] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchCharacter = async e => {
    e.preventDefault();
    if (!searchName.trim()) return;

    setLoading(true);
    setError(null);
    setCharacter(null);

    try {
      // First, search for ocid
      const searchResponse = await apiCall(
        `/api/character/search?name=${encodeURIComponent(searchName)}`
      );
      if (!searchResponse.ok) throw new Error('Search failed');
      const searchData = await searchResponse.json();
      const ocid = searchData.ocid;

      // Then, fetch character details
      const charResponse = await apiCall(`/api/characters/${ocid}`);
      if (!charResponse.ok)
        throw new Error('Failed to fetch character details');
      const charData = await charResponse.json();

      setCharacter(charData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{ mb: 4 }}
      >
        角色儀表板
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box
          component="form"
          onSubmit={searchCharacter}
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <TextField
            fullWidth
            label="角色名稱"
            variant="outlined"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="輸入角色名稱"
            sx={{ flex: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            size="large"
            sx={{ minWidth: 120, height: 56 }}
          >
            {loading ? '搜尋中...' : '搜尋'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {character && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Card elevation={3} sx={{ maxWidth: 400, width: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <CharacterCard character={character} />
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
}
