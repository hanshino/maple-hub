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
  window.matchMedia = jest.fn().mockImplementation(query => ({
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
  it('renders logo with maple leaf icon and text', () => {
    renderWithProviders();
    expect(screen.getByText('Maple Hub')).toBeInTheDocument();
  });

  it('renders nav links', () => {
    renderWithProviders();
    expect(screen.getByText('首頁')).toBeInTheDocument();
    expect(screen.getByText('排行榜')).toBeInTheDocument();
  });

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

  it('renders skip to content link for accessibility', () => {
    renderWithProviders();
    expect(screen.getByText('跳到主要內容')).toBeInTheDocument();
  });

  it('has correct nav aria label', () => {
    renderWithProviders();
    expect(screen.getByRole('navigation')).toHaveAttribute(
      'aria-label',
      '主導覽列'
    );
  });
});
