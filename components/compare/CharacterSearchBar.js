'use client';

import { useEffect, useState } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function SideField({ side, label, value, loading, onSearch }) {
  const [input, setInput] = useState(value);

  // The URL is the source of truth: when the parent's value changes
  // (search submit on either side, or a swap), mirror it back into the
  // local draft so the field never shows stale text.
  useEffect(() => {
    setInput(value);
  }, [value]);

  const submit = e => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSearch(side, trimmed);
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ flex: 1, minWidth: 0 }}>
      <TextField
        fullWidth
        size="small"
        label={label}
        placeholder="輸入角色名稱"
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={loading}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="submit"
                  aria-label={`搜尋${label}`}
                  size="small"
                  disabled={loading || !input.trim()}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
}

/**
 * Two independent name inputs ("我的角色" / "參考角色"). Each submits only
 * its own side via `onSearch(side, name)` — replacing one side never
 * touches the other's input or in-flight request.
 */
export default function CharacterSearchBar({
  leftName,
  rightName,
  onSearch,
  leftLoading,
  rightLoading,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 3,
      }}
    >
      <SideField
        side="left"
        label="我的角色"
        value={leftName}
        loading={leftLoading}
        onSearch={onSearch}
      />
      <SideField
        side="right"
        label="參考角色"
        value={rightName}
        loading={rightLoading}
        onSearch={onSearch}
      />
    </Box>
  );
}
