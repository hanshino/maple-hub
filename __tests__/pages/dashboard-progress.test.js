import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DashboardProgress from '../../app/dashboard-progress/page';

// Mock the API utilities
jest.mock('../../lib/apiUtils.js');
import { apiCall, sequentialApiCalls } from '../../lib/apiUtils.js';

describe('Dashboard Progress', () => {
  const mockCharacter = {
    character_name: 'Test Character',
    character_level: 50,
    character_exp_rate: '75.5',
    date: '2023-10-01T00:00:00Z',
    ocid: 'test-ocid-123',
  };

  const mockOcidResponse = { ocid: 'test-ocid-123' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the API calls
    apiCall.mockImplementation(url => {
      if (url.includes('/api/character/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOcidResponse),
        });
      } else if (url.includes('/api/characters/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCharacter),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    sequentialApiCalls.mockResolvedValue([
      { ok: true, json: () => Promise.resolve(mockCharacter) },
    ]);
  });

  it('renders search form', () => {
    render(<DashboardProgress />);

    expect(screen.getByPlaceholderText('輸入角色名稱')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '搜尋' })).toBeInTheDocument();
  });

  it('shows error on fetch failure', async () => {
    // Mock fetch to reject for this specific test
    apiCall.mockRejectedValue(new Error('Network error'));

    render(<DashboardProgress />);

    const input = screen.getByPlaceholderText('輸入角色名稱');
    fireEvent.change(input, { target: { value: 'Test Character' } });

    const button = screen.getByRole('button', { name: '搜尋' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /重試/i })).toBeInTheDocument();
    });
  });
});
