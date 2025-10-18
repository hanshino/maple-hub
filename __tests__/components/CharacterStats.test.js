// Mock fetch
global.fetch = jest.fn();

// Mock cache utils
jest.mock('../../lib/cache', () => ({
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
}));

// Mock stats utils
jest.mock('../../lib/statsUtils', () => ({
  processStatsData: jest.fn(),
  formatStatValue: jest.fn(),
}));

import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CharacterStats from '../../components/CharacterStats';
import { getCachedData, setCachedData } from '../../lib/cache';
import { processStatsData, formatStatValue } from '../../lib/statsUtils';

// Create a basic theme for testing
const testTheme = createTheme();

// Helper function to render with theme provider
const renderWithTheme = component => {
  return render(<ThemeProvider theme={testTheme}>{component}</ThemeProvider>);
};

// Helper function to flush promises
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('CharacterStats', () => {
  // Test basic Accordion rendering first
  it('should render Accordion components correctly', () => {
    renderWithTheme(
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Test Accordion</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>Test content</Typography>
        </AccordionDetails>
      </Accordion>
    );

    expect(screen.getByText('Test Accordion')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  const mockStatsData = {
    final_stat: [
      { stat_name: '戰鬥力', stat_value: '1000000' },
      { stat_name: '攻擊力', stat_value: '5000' },
    ],
  };

  const mockProcessedStats = [
    { name: '戰鬥力', value: '1000000' },
    { name: '攻擊力', value: '5000' },
  ];

  beforeEach(() => {
    fetch.mockClear();
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => mockStatsData,
      })
    );
    processStatsData.mockReturnValue(mockProcessedStats);
    formatStatValue.mockImplementation(value => {
      // Mock Chinese unit formatting to match actual implementation
      if (typeof value === 'string' && /^\d+$/.test(value)) {
        const num = parseInt(value);
        if (num >= 100000000) {
          return `${(num / 100000000).toFixed(2)}億`;
        } else if (num >= 10000) {
          return `${(num / 10000).toFixed(2)}萬`;
        }
        return num.toString();
      }
      return value;
    });
    getCachedData.mockReturnValue(null); // No cached data, so component will fetch
  });

  it('should display stats in table format', async () => {
    renderWithTheme(<CharacterStats ocid="test-ocid" />);

    // Flush promises to ensure async operations complete
    await flushPromises();

    // Wait for loading to complete first
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Accordion should be collapsed by default
    const accordionSummary = screen.getByRole('button', { name: /角色能力值/ });
    expect(accordionSummary).toHaveAttribute('aria-expanded', 'false');

    // Click to expand the accordion
    fireEvent.click(accordionSummary);

    // Wait for the stats to be displayed
    await waitFor(() => {
      expect(screen.getByText('戰鬥力')).toBeInTheDocument();
    });

    // Now check for the specific stats values
    expect(screen.getByText('100.00萬')).toBeInTheDocument();
    expect(screen.getByText('攻擊力')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();

    // Check for table structure - now we have multiple tables for different groups
    expect(screen.getByText('角色能力值')).toBeInTheDocument();

    // Check that at least one table exists (other stats table in this case)
    expect(
      screen.getByRole('table', { name: 'Other stats table' })
    ).toBeInTheDocument();
  });

  it('should handle loading state', async () => {
    // Mock fetch to delay response
    let resolveFetch;
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve;
    });

    fetch.mockImplementationOnce(() => fetchPromise);

    renderWithTheme(<CharacterStats ocid="test-ocid" />);

    // Initially should show loading - check for CircularProgress component
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Resolve the fetch
    await act(async () => {
      resolveFetch({
        ok: true,
        json: () => mockStatsData,
      });
    });

    // Flush promises
    await flushPromises();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
