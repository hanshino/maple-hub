# Quickstart: Add Search History

## Overview

This guide provides implementation steps for adding search history functionality with localStorage caching and MUI Autocomplete display.

## Prerequisites

- Next.js 14 app with Material-UI installed
- Existing character search functionality
- Axios for API calls

## Implementation Steps

### 1. Enhance localStorage Utility

Update `lib/localStorage.js` to include history management functions:

```javascript
// Add to existing localStorage.js
const HISTORY_KEY = 'characterSearchHistory';
const MAX_HISTORY = 10;

export const saveSearchHistory = (characterName, ocid) => {
  if (typeof window === 'undefined') return;

  try {
    const history = getSearchHistory();
    const newEntry = {
      characterName: characterName.trim(),
      ocid,
      timestamp: new Date().toISOString(),
    };

    // Remove existing entry for same character
    const filtered = history.filter(
      item => item.characterName !== characterName
    );
    filtered.unshift(newEntry);

    // Limit to max items
    const limited = filtered.slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    console.warn('Failed to save search history:', error);
  }
};

export const getSearchHistory = () => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load search history:', error);
    return [];
  }
};
```

### 2. Create Enhanced Search Component

Create or update `components/CharacterSearch.js`:

```javascript
import { useState, useEffect } from 'react';
import { Autocomplete, TextField, Button } from '@mui/material';
import { saveSearchHistory, getSearchHistory } from '../lib/localStorage';

export default function CharacterSearch({ onSearch }) {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const handleSearch = async () => {
    if (!inputValue.trim()) return;

    try {
      // Call existing search API to get OCID
      const response = await searchCharacter(inputValue);
      const ocid = response.ocid;

      // Save to history
      saveSearchHistory(inputValue, ocid);
      setHistory(getSearchHistory());

      // Proceed with search
      onSearch(ocid);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleHistorySelect = (event, value) => {
    if (value && value.ocid) {
      setInputValue(value.characterName);
      onSearch(value.ocid);
    }
  };

  return (
    <div>
      <Autocomplete
        freeSolo
        options={history}
        getOptionLabel={option => option.characterName || option}
        onChange={handleHistorySelect}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
        renderInput={params => (
          <TextField {...params} label="Character Name" variant="outlined" />
        )}
        renderOption={(props, option) => (
          <li {...props}>{option.characterName}</li>
        )}
      />
      <Button onClick={handleSearch} variant="contained">
        Search
      </Button>
    </div>
  );
}
```

### 3. Update Search Logic

Modify existing search logic to use cached OCID when available from history selection.

### 4. Add Tests

Create tests for localStorage functions and component behavior.

## Testing

Run the following to verify implementation:

```bash
npm test -- --testPathPattern=CharacterSearch-history
npm test -- --testPathPattern=localStorage-history
```

## Deployment

No additional deployment steps required - feature is client-side only.
