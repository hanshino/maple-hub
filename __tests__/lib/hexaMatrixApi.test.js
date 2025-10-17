import {
  fetchHexaMatrixData,
  clearHexaMatrixCache,
} from '../../lib/hexaMatrixApi.js';

// Mock axios
jest.mock('axios');
import axios from 'axios';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('HexaMatrixApi', () => {
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  beforeAll(() => {
    process.env.API_KEY = 'test-key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchHexaMatrixData', () => {
    const mockOcid = 'test-ocid-123';
    const cacheKey = `hexa_matrix_cache_${mockOcid}`;
    const mockApiResponse = {
      date: null,
      character_hexa_core_equipment: [
        {
          hexa_core_name: 'Test Core',
          hexa_core_level: 30,
          hexa_core_type: '技能核心',
          linked_skill: [{ hexa_skill_id: 'Test Skill' }],
        },
      ],
    };

    test('fetches data successfully from API', async () => {
      axios.get.mockResolvedValue({ data: mockApiResponse });

      const result = await fetchHexaMatrixData(mockOcid);

      expect(axios.get).toHaveBeenCalledWith('/api/hexa-matrix', {
        params: { ocid: mockOcid },
        headers: {
          accept: 'application/json',
        },
        timeout: 10000,
      });
      expect(result).toEqual(mockApiResponse);
    });

    test('returns cached data when available and not expired', async () => {
      localStorage.getItem.mockReturnValue(
        JSON.stringify({
          [mockOcid]: {
            data: mockApiResponse,
            timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
          },
        })
      );

      const result = await fetchHexaMatrixData(mockOcid);

      expect(axios.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockApiResponse);
    });

    test('fetches from API when cache is expired', async () => {
      // Set up expired cache - use a timestamp far in the past
      localStorage.getItem.mockReturnValue(
        JSON.stringify({
          [mockOcid]: {
            data: mockApiResponse,
            timestamp: Date.now() - CACHE_DURATION - 10000, // Definitely expired
          },
        })
      );
      // Set up axios mock for this test
      axios.get.mockResolvedValue({ data: mockApiResponse });

      await fetchHexaMatrixData(mockOcid);

      expect(axios.get).toHaveBeenCalled();
    });

    test('caches API response', async () => {
      // Set up empty cache
      localStorage.getItem.mockReturnValue(null);
      // Set up axios mock for this test
      axios.get.mockResolvedValue({ data: mockApiResponse });

      await fetchHexaMatrixData(mockOcid);

      // Check that localStorage.setItem was called with the cached data
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'hexa_matrix_cache',
        expect.stringContaining('"test-ocid-123"')
      );
      const setItemCall = localStorage.setItem.mock.calls[0];
      const cachedData = JSON.parse(setItemCall[1]);
      expect(cachedData).toHaveProperty('test-ocid-123');
      expect(cachedData['test-ocid-123']).toHaveProperty('data');
      expect(cachedData['test-ocid-123']).toHaveProperty('timestamp');
      expect(typeof cachedData['test-ocid-123'].timestamp).toBe('number');
    });

    test('throws error when OCID is not provided', async () => {
      await expect(fetchHexaMatrixData('')).rejects.toThrow(
        'Character OCID is required'
      );
      await expect(fetchHexaMatrixData(null)).rejects.toThrow(
        'Character OCID is required'
      );
    });

    test('throws API error with proper message', async () => {
      // Ensure no cache initially
      localStorage.getItem.mockReturnValue(null);
      // Set up axios mock to reject for this test
      axios.get.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid OCID' },
        },
      });

      await expect(fetchHexaMatrixData(mockOcid)).rejects.toThrow(
        'API Error: 400 - Invalid OCID'
      );
    });

    test('throws timeout error', async () => {
      // Ensure no cache initially
      localStorage.getItem.mockReturnValue(null);
      // Set up axios mock to reject with timeout for this test
      axios.get.mockRejectedValue({ code: 'ECONNABORTED' });

      await expect(fetchHexaMatrixData(mockOcid)).rejects.toThrow(
        'Request timeout - please try again'
      );
    });

    test('throws network error for other failures', async () => {
      // Ensure no cache initially
      localStorage.getItem.mockReturnValue(null);
      // Set up axios mock to reject with network error for this test
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(fetchHexaMatrixData(mockOcid)).rejects.toThrow(
        'Network error - please check your connection'
      );
    });
  });

  describe('clearHexaMatrixCache', () => {
    test('clears cache from localStorage', () => {
      clearHexaMatrixCache();

      expect(localStorage.removeItem).toHaveBeenCalledWith('hexa_matrix_cache');
    });

    test('handles localStorage errors gracefully', () => {
      localStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => clearHexaMatrixCache()).not.toThrow();
    });
  });
});
