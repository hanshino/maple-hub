'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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

function getInitialMode() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('color-mode');
  if (stored === 'dark' || stored === 'light') return stored;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export default function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light';
          localStorage.setItem('color-mode', next);
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
