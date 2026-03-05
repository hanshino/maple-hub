// __tests__/components/CharacterStats.test.js
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

jest.mock('../../lib/cache', () => ({
  getCachedData: jest.fn(() => null),
  setCachedData: jest.fn(),
}));

jest.mock('../../components/panel/PanelSkeleton', () => {
  return function MockSkeleton() {
    return <div data-testid="panel-skeleton">Loading</div>;
  };
});
jest.mock('../../components/panel/PanelError', () => {
  return function MockError({ message }) {
    return <div data-testid="panel-error">{message}</div>;
  };
});
jest.mock('../../components/panel/PanelEmpty', () => {
  return function MockEmpty({ message }) {
    return <div data-testid="panel-empty">{message}</div>;
  };
});
jest.mock('../../components/panel/SectionHeader', () => {
  return function MockHeader({ description }) {
    return <div data-testid="section-header">{description}</div>;
  };
});

import CharacterStats from '../../components/CharacterStats';

const theme = createTheme();
const wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('CharacterStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows skeleton while loading', () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    render(<CharacterStats ocid="test" />, { wrapper });
    expect(screen.getByTestId('panel-skeleton')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500 }));
    render(<CharacterStats ocid="test" />, { wrapper });
    const error = await screen.findByTestId('panel-error');
    expect(error).toBeInTheDocument();
  });

  it('renders section header', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ final_stat: [] }),
      })
    );
    render(<CharacterStats ocid="test" />, { wrapper });
    const header = await screen.findByTestId('section-header');
    expect(header).toHaveTextContent('角色最終能力值，包含所有加成來源');
  });
});
