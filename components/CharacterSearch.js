'use client';

import { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Button,
  Box,
  Chip,
  Avatar,
} from '@mui/material';
import { getSearchHistory } from '../lib/localStorage';
import { track } from '../lib/analytics';

export default function CharacterSearch({
  onSearch,
  loading,
  activeCharacter,
  onClear,
}) {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // Clear input when active character is removed (e.g. navigating to home)
  useEffect(() => {
    if (!activeCharacter) {
      setInputValue('');
    }
  }, [activeCharacter]);

  const handleSearch = async () => {
    if (!inputValue.trim()) return;

    track('character-search', { name: inputValue.trim() });

    try {
      const response = await fetch(
        `/api/character/search?name=${encodeURIComponent(inputValue.trim())}`
      );
      if (!response.ok) throw new Error('Search failed');
      const searchData = await response.json();

      onSearch(searchData.ocid);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    handleSearch();
  };

  const handleAutocompleteChange = (event, value) => {
    if (value && typeof value === 'object' && value.ocid) {
      setInputValue(value.characterName);
      onSearch(value.ocid);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Autocomplete
          freeSolo
          options={history}
          getOptionLabel={option => option.characterName || option}
          value={null}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
          onChange={handleAutocompleteChange}
          renderInput={params => (
            <TextField
              {...params}
              fullWidth
              label="角色名稱"
              variant="outlined"
              placeholder="輸入角色名稱"
              sx={{ flex: 1 }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.ocid}>
              {option.characterName}
            </li>
          )}
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

      {activeCharacter && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            avatar={
              activeCharacter.character_image ? (
                <Avatar
                  src={activeCharacter.character_image}
                  alt={activeCharacter.character_name}
                />
              ) : undefined
            }
            label={`${activeCharacter.character_name} — Lv.${activeCharacter.character_level} ${activeCharacter.character_class}`}
            onDelete={() => {
              setInputValue('');
              onClear();
            }}
            color="primary"
            variant="outlined"
            sx={{
              height: 36,
              '& .MuiChip-label': {
                fontWeight: 600,
                fontSize: '0.875rem',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
