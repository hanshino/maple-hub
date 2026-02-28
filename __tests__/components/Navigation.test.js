import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '../../components/Navigation';
import AppThemeProvider from '../../components/MuiThemeProvider';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

beforeEach(() => {
  localStorage.clear();
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
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
