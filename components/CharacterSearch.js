'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, TextField, Button, Box } from '@mui/material';
import { saveSearchHistory, getSearchHistory } from '../lib/localStorage';

export default function CharacterSearch({ onSearch, loading }) {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const handleSearch = async () => {
    if (!inputValue.trim()) return;

    try {
      // Call search API to get OCID
      const response = await fetch(
        `/api/character/search?name=${encodeURIComponent(inputValue.trim())}`
      );
      if (!response.ok) throw new Error('Search failed');
      const searchData = await response.json();

      // Save to history
      saveSearchHistory(inputValue.trim(), searchData.ocid);
      setHistory(getSearchHistory());

      // Proceed with search
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
      // Selected from history
      setInputValue(value.characterName);
      onSearch(value.ocid);
    }
  };

  return (
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
  );
}
