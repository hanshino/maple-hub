import { render, screen, fireEvent, act } from '@testing-library/react';
import { useTheme } from '@mui/material/styles';
import AppThemeProvider, {
  useColorMode,
} from '../../components/MuiThemeProvider';

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
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
});

describe('MuiThemeProvider', () => {
  it('defaults to light mode when no localStorage and no system preference', () => {
    render(
      <AppThemeProvider>
        <ThemeReader />
      </AppThemeProvider>
    );
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
    render(
      <AppThemeProvider>
        <ThemeReader />
      </AppThemeProvider>
    );
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('bg-default')).toHaveTextContent('#1a1210');
  });

  it('localStorage overrides system preference', () => {
    localStorage.setItem('color-mode', 'dark');
    render(
      <AppThemeProvider>
        <ThemeReader />
      </AppThemeProvider>
    );
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
  });

  it('toggleColorMode switches and persists', () => {
    render(
      <AppThemeProvider>
        <ThemeReader />
      </AppThemeProvider>
    );
    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    act(() => {
      fireEvent.click(screen.getByText('toggle'));
    });
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(localStorage.getItem('color-mode')).toBe('dark');
  });

  it('dark palette has correct colors', () => {
    localStorage.setItem('color-mode', 'dark');
    render(
      <AppThemeProvider>
        <ThemeReader />
      </AppThemeProvider>
    );
    expect(screen.getByTestId('bg-default')).toHaveTextContent('#1a1210');
    expect(screen.getByTestId('palette-mode')).toHaveTextContent('dark');
  });
});
