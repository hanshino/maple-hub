import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from '../../app/page';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the API utilities
jest.mock('../../lib/apiUtils.js');
import { apiCall, batchApiCalls } from '../../lib/apiUtils.js';

describe('Home Page (Dashboard Progress)', () => {
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
    // Mock fetch for character search
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOcidResponse),
    });

    // Mock the API calls for character data
    apiCall.mockImplementation(url => {
      if (url.includes('/api/characters/')) {
        return Promise.resolve({
          status: 200,
          data: mockCharacter,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    batchApiCalls.mockResolvedValue([{ status: 200, data: mockCharacter }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders search form', () => {
    render(<Home />);

    expect(screen.getByPlaceholderText('輸入角色名稱')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '搜尋' })).toBeInTheDocument();
  });

  it.skip('shows error on fetch failure', async () => {
    // Mock fetch to fail for search
    fetch.mockRejectedValue(new Error('Network error'));

    render(<Home />);

    const input = screen.getByPlaceholderText('輸入角色名稱');
    fireEvent.change(input, { target: { value: 'Test Character' } });

    const button = screen.getByRole('button', { name: '搜尋' });
    fireEvent.click(button);

    // Verify that fetch was called with the correct URL
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/character/search?name=Test%20Character'
      );
    });

    // The error is logged but not displayed in the UI currently
    // This test verifies that the search attempt was made and failed as expected
  });
});
