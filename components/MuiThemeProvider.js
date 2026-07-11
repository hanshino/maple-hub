'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { track } from '../lib/analytics';

const ColorModeContext = createContext({
  mode: 'light',
  toggleColorMode: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}

const sharedPalette = {
  primary: {
    main: '#f7931e',
    light: '#ffb347',
    dark: '#cc6e00',
    contrastText: '#fff',
  },
  success: { main: '#7cb342' },
  error: { main: '#e53935' },
  warning: { main: '#ffa726' },
  info: { main: '#4fc3f7' },
};

const lightPalette = {
  mode: 'light',
  ...sharedPalette,
  secondary: {
    main: '#8c6239',
    light: '#b07d52',
    dark: '#5e3f22',
    contrastText: '#fff',
  },
  background: { default: '#fff7ec', paper: '#fff3e0' },
  text: { primary: '#4e342e', secondary: '#6d4c41' },
};

const darkPalette = {
  mode: 'dark',
  ...sharedPalette,
  secondary: {
    main: '#b07d52',
    light: '#c4956a',
    dark: '#8c6239',
    contrastText: '#fff',
  },
  background: { default: '#1a1210', paper: '#2a1f1a' },
  text: { primary: '#f5e6d3', secondary: '#c4a882' },
};

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 20,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 4px 10px rgba(0,0,0,0.3)'
            : '0 4px 10px rgba(0,0,0,0.1)',
      }),
    },
  },
  MuiPaper: {
    styleOverrides: { root: { borderRadius: 20 } },
  },
};

function persistMode(next) {
  try {
    localStorage.setItem('color-mode', next);
  } catch {
    // storage disabled (private mode) — cookie below still carries the mode
  }
  // 1-year cookie so the server can render the right theme on the next
  // request. This is what keeps SSR and the first client render in sync.
  document.cookie = `color-mode=${next}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.setAttribute('data-color-mode', next);
  document.documentElement.style.colorScheme = next;
}

export default function AppThemeProvider({ children, initialMode }) {
  // initialMode is read from the color-mode cookie server-side (layout.js),
  // so SSR and the first client render use the SAME value — no hydration
  // mismatch. Only a first-time visitor (no cookie yet) resolves the stored /
  // system preference after mount, which is the one case that can briefly flash.
  const [mode, setMode] = useState(initialMode || 'light');

  useEffect(() => {
    if (initialMode) return; // cookie already decided the mode
    let resolved = 'light';
    try {
      const stored = localStorage.getItem('color-mode');
      if (stored === 'dark' || stored === 'light') resolved = stored;
      else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
        resolved = 'dark';
    } catch {
      // ignore
    }
    persistMode(resolved); // write the cookie so the next SSR is correct
    // One-time sync from client-only prefs on first visit; returning users
    // hit the early return above and never reach this.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (resolved !== 'light') setMode(resolved);
  }, [initialMode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode(prev => {
          const next = prev === 'light' ? 'dark' : 'light';
          persistMode(next);
          track('theme-toggle', { mode: next });
          return next;
        });
      },
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: mode === 'dark' ? darkPalette : lightPalette,
        shape: { borderRadius: 16 },
        typography: {
          fontFamily:
            '"Nunito", "Noto Sans TC", "Comic Neue", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 800 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 600 },
          button: { textTransform: 'none', fontWeight: 600 },
        },
        components: sharedComponents,
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
