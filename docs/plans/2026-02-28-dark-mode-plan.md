# Dark Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dark mode support with system preference detection, manual toggle, and deep-brown warm palette.

**Architecture:** MUI dual palette (`light`/`dark`) managed by React Context. `useColorMode()` hook exposes mode + toggle. localStorage persists preference, `prefers-color-scheme` as fallback. Anti-flash inline script prevents white flash on load.

**Tech Stack:** MUI 7 createTheme, React Context, localStorage, MUI Icons (LightMode/DarkMode)

---

### Task 1: ColorModeContext + dual theme (MuiThemeProvider)

**Files:**
- Modify: `components/MuiThemeProvider.js`
- Test: `__tests__/components/MuiThemeProvider.test.js`

**Step 1: Write the failing tests**

Create `__tests__/components/MuiThemeProvider.test.js`:

```javascript
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useTheme } from '@mui/material/styles';
import AppThemeProvider, { useColorMode } from '../../components/MuiThemeProvider';

// Helper component to read theme
function ThemeReader() {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="palette-mode">{theme.palette.mode}</span>
      <span data-testid="bg-default">{theme.palette.background.default}</span>
      <button onClick={toggleColorMode}>toggle</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  // Default: no system preference
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
});

describe('MuiThemeProvider', () => {
  it('defaults to light mode when no localStorage and no system preference', () => {
    render(<AppThemeProvider><ThemeReader /></AppThemeProvider>);
    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    expect(screen.getByTestId('bg-default')).toHaveTextContent('#fff7ec');
  });

  it('respects system dark preference', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    render(<AppThemeProvider><ThemeReader /></AppThemeProvider>);
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('bg-default')).toHaveTextContent('#1a1210');
  });

  it('localStorage overrides system preference', () => {
    localStorage.setItem('color-mode', 'dark');
    render(<AppThemeProvider><ThemeReader /></AppThemeProvider>);
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
  });

  it('toggleColorMode switches and persists', () => {
    render(<AppThemeProvider><ThemeReader /></AppThemeProvider>);
    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    act(() => { fireEvent.click(screen.getByText('toggle')); });
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(localStorage.getItem('color-mode')).toBe('dark');
  });

  it('dark palette has correct colors', () => {
    localStorage.setItem('color-mode', 'dark');
    render(<AppThemeProvider><ThemeReader /></AppThemeProvider>);
    expect(screen.getByTestId('bg-default')).toHaveTextContent('#1a1210');
    expect(screen.getByTestId('palette-mode')).toHaveTextContent('dark');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="MuiThemeProvider" --no-coverage`
Expected: FAIL (useColorMode not exported yet)

**Step 3: Implement dual theme + context**

Replace `components/MuiThemeProvider.js` with:

```javascript
'use client';

import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ColorModeContext = createContext({ mode: 'light', toggleColorMode: () => {} });

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
        boxShadow: theme.palette.mode === 'dark'
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

  const colorMode = useMemo(() => ({
    mode,
    toggleColorMode: () => {
      setMode((prev) => {
        const next = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('color-mode', next);
        return next;
      });
    },
  }), [mode]);

  const theme = useMemo(() => createTheme({
    palette: mode === 'dark' ? darkPalette : lightPalette,
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: '"Nunito", "Noto Sans TC", "Comic Neue", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: sharedComponents,
  }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="MuiThemeProvider" --no-coverage`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add components/MuiThemeProvider.js __tests__/components/MuiThemeProvider.test.js
git commit -m "feat: add dark mode theme context with dual palette"
```

---

### Task 2: Theme toggle button (Navigation)

**Files:**
- Modify: `components/Navigation.js`
- Test: `__tests__/components/Navigation.test.js`

**Step 1: Write the failing tests**

Create `__tests__/components/Navigation.test.js`:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '../../components/Navigation';
import AppThemeProvider from '../../components/MuiThemeProvider';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

beforeEach(() => {
  localStorage.clear();
});

function renderWithProviders() {
  return render(
    <AppThemeProvider>
      <Navigation />
    </AppThemeProvider>
  );
}

describe('Navigation', () => {
  it('renders theme toggle button', () => {
    renderWithProviders();
    expect(screen.getByLabelText('切換深色模式')).toBeInTheDocument();
  });

  it('toggles theme on click', () => {
    renderWithProviders();
    const toggleBtn = screen.getByLabelText('切換深色模式');
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem('color-mode')).toBe('dark');
    expect(screen.getByLabelText('切換淺色模式')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="Navigation" --no-coverage`
Expected: FAIL (toggle button not found)

**Step 3: Add toggle button to Navigation**

Add imports and toggle button to `components/Navigation.js`:

```javascript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Toolbar, Typography, Box, Button, IconButton } from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import HomeIcon from '@mui/icons-material/Home';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useColorMode } from './MuiThemeProvider';

export default function Navigation() {
  const pathname = usePathname();
  const { mode, toggleColorMode } = useColorMode();

  return (
    <AppBar
      position="sticky"
      color="primary"
      elevation={1}
      sx={{ top: 0, zIndex: 1100 }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            letterSpacing: 0.5,
            '&:hover': { opacity: 0.85 },
          }}
        >
          Maple Hub
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {[
            { href: '/', label: '首頁', icon: <HomeIcon />, exact: true },
            { href: '/leaderboard', label: '排行榜', icon: <LeaderboardIcon /> },
          ].map(({ href, label, icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Button
                key={href}
                component={Link}
                href={href}
                color="inherit"
                startIcon={icon}
                sx={{
                  textTransform: 'none',
                  borderRadius: 0,
                  px: 1.5,
                  pb: 0.5,
                  opacity: isActive ? 1 : 0.75,
                  borderBottom: isActive ? '2px solid white' : '2px solid transparent',
                  '&:hover': { opacity: 1, backgroundColor: 'transparent' },
                }}
              >
                {label}
              </Button>
            );
          })}
          <IconButton
            color="inherit"
            onClick={toggleColorMode}
            aria-label={mode === 'dark' ? '切換淺色模式' : '切換深色模式'}
            sx={{ ml: 1 }}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="Navigation" --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add components/Navigation.js __tests__/components/Navigation.test.js
git commit -m "feat: add dark mode toggle button to navigation"
```

---

### Task 3: Anti-flash script (layout.js)

**Files:**
- Modify: `app/layout.js`

**Step 1: Add inline script to layout**

Add `<Script>` with anti-flash logic to `app/layout.js`:

```javascript
import Script from 'next/script';
// ... existing imports ...

export default function RootLayout({ children }) {
  return (
    <html lang="zh-tw" suppressHydrationWarning>
      <head>
        <Script id="color-mode-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var mode = localStorage.getItem('color-mode');
              if (!mode) {
                mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              document.documentElement.setAttribute('data-color-mode', mode);
              if (mode === 'dark') {
                document.documentElement.style.backgroundColor = '#1a1210';
              }
            } catch(e) {}
          })();
        `}</Script>
      </head>
      <body>
        <MuiThemeProvider>
          <Navigation />
          {children}
        </MuiThemeProvider>
      </body>
    </html>
  );
}
```

**Step 2: Verify by running build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add app/layout.js
git commit -m "feat: add anti-flash script for dark mode"
```

---

### Task 4: Fix hardcoded colors in EquipmentSlot

**Files:**
- Modify: `components/EquipmentSlot.js`

**Step 1: Run existing tests as baseline**

Run: `npm test -- --testPathPattern="EquipmentSlot" --no-coverage`
Expected: PASS (existing tests still work)

**Step 2: Replace hardcoded rgba with theme-aware values**

Convert `gridSx` and `listSx` from plain functions to functions that accept `theme`:

Key replacements in `components/EquipmentSlot.js`:
- `'rgba(247,147,30,0.08)'` → `(theme) => alpha(theme.palette.primary.main, 0.08)` (use MUI's `alpha` from `@mui/material/styles`)
- `'2px solid #f7931e'` → `(theme) => \`2px solid ${theme.palette.primary.main}\``
- `'rgba(247,147,30,0.4)'` → `(theme) => alpha(theme.palette.primary.main, 0.4)`
- `'2px dashed #e0c9a8'` → `(theme) => \`2px dashed ${theme.palette.mode === 'dark' ? '#5a4a38' : '#e0c9a8'}\``
- `'rgba(0,0,0,0.05)'` → keep (subtle shadow works in both modes)
- `'rgba(247,147,30,0.15)'` → `(theme) => alpha(theme.palette.primary.main, 0.15)`
- `'rgba(247,147,30,0.25)'` → `(theme) => alpha(theme.palette.primary.main, 0.25)`
- `'rgba(247,147,30,0.04)'` → `(theme) => alpha(theme.palette.primary.main, 0.04)`
- `'#f7931e'` in focus-visible → `(theme) => theme.palette.primary.main`
- Empty slot dashed border in list variant: `'1px dashed #e0c9a8'` → same dark-aware approach

The `sx` prop in MUI accepts functions: `sx={{ border: (theme) => ... }}`. Restructure `gridSx` and `listSx` to return sx objects with function values where needed.

**Step 3: Run existing tests to verify no regression**

Run: `npm test -- --testPathPattern="EquipmentSlot" --no-coverage`
Expected: PASS

**Step 4: Commit**

```bash
git add components/EquipmentSlot.js
git commit -m "fix: make EquipmentSlot colors theme-aware for dark mode"
```

---

### Task 5: Fix hardcoded colors in EquipmentList

**Files:**
- Modify: `components/EquipmentList.js`

**Step 1: Replace hardcoded rgba**

In `components/EquipmentList.js` line 101:
- `'rgba(247,147,30,0.06)'` → `(theme) => alpha(theme.palette.primary.main, 0.06)`

Add import: `import { alpha } from '@mui/material/styles';`

**Step 2: Run existing tests**

Run: `npm test -- --testPathPattern="EquipmentList" --no-coverage`
Expected: PASS

**Step 3: Commit**

```bash
git add components/EquipmentList.js
git commit -m "fix: make EquipmentList group header theme-aware"
```

---

### Task 6: Fix hardcoded colors in HexaMatrixProgress

**Files:**
- Modify: `components/HexaMatrixProgress.js`

**Step 1: Make tooltip background theme-aware**

In `components/HexaMatrixProgress.js`, the Recharts Tooltip `wrapperStyle` uses `backgroundColor: 'rgba(255, 255, 255, 0.95)'`. Recharts doesn't accept MUI theme functions, so we need to read the theme via hook.

Add `'use client'` directive and use `useTheme`:

```javascript
'use client';

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// ... existing imports ...

export default function HexaMatrixProgress({ character }) {
  const theme = useTheme();
  // ... existing state ...

  // In the Tooltip wrapperStyle:
  const tooltipStyle = {
    maxWidth: '200px',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    padding: '8px',
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(42, 31, 26, 0.95)'
      : 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${theme.palette.mode === 'dark' ? '#5a4a38' : '#ccc'}`,
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    color: theme.palette.text.primary,
  };
```

Also make the Radar chart colors theme-aware:
- `stroke="#8884d8"` and `fill="#8884d8"` → use `theme.palette.info.main` (`#4fc3f7`) to align with the theme

**Step 2: Run existing tests**

Run: `npm test -- --testPathPattern="HexaMatrixProgress" --no-coverage`
Expected: PASS

**Step 3: Commit**

```bash
git add components/HexaMatrixProgress.js
git commit -m "fix: make HexaMatrixProgress tooltip theme-aware"
```

---

### Task 7: Fix hardcoded colors in ProgressChart

**Files:**
- Modify: `components/ProgressChart.js`

**Step 1: Make Recharts components theme-aware**

ProgressChart uses Tailwind classes like `text-gray-500`, `text-gray-600`. These need dark variants or replacement with MUI `sx`.

Changes:
1. Import `useTheme` from MUI
2. Replace `text-gray-500` / `text-gray-600` divs with MUI `Typography` or `Box` with `sx={{ color: 'text.secondary' }}`
3. Make `CartesianGrid` stroke theme-aware
4. Make Tooltip background theme-aware (same pattern as Task 6)

Key replacements:
- `className="w-full h-64 flex items-center justify-center text-gray-500"` → keep layout classes, replace color: `sx={{ color: 'text.secondary' }}`
- `className="text-xs text-gray-600 mb-2"` → already handled by MUI Box above
- `CartesianGrid strokeDasharray="3 3"` → add `stroke={theme.palette.mode === 'dark' ? '#3a2f2a' : '#e0e0e0'}`

Note: `memo()` wraps the component, so `useTheme()` must be inside the memo'd function body.

**Step 2: Run existing tests**

Run: `npm test -- --testPathPattern="ProgressChart" --no-coverage`
Expected: PASS

**Step 3: Commit**

```bash
git add components/ProgressChart.js
git commit -m "fix: make ProgressChart colors theme-aware"
```

---

### Task 8: Final integration test + full test suite

**Step 1: Run full test suite**

Run: `npm test -- --no-coverage`
Expected: ALL PASS

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Manual smoke test (optional)**

Run: `npm run dev`
Check: Toggle dark mode in browser, verify all pages render correctly

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "feat: dark mode complete"
```
