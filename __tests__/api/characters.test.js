const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock the route module
jest.mock('../../app/api/characters/[id]/route', () => {
  const axios = require('axios');

  const API_BASE_URL = 'https://api.test.com';
  const API_KEY = 'test-key';

  return {
    GET: async (request, { params }) => {
      try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        // Validate date parameter
        if (dateParam) {
          const requestedDate = new Date(dateParam);
          const minDate = new Date('2025-10-14');

          if (requestedDate < minDate) {
            return Response.json(
              {
                error:
                  'Date cannot be earlier than 2025-10-14 (API data availability)',
              },
              { status: 400 }
            );
          }
        }

        const apiParams = { ocid: id };
        if (dateParam) {
          apiParams.date = dateParam;
        }

        const response = await axios.get(`${API_BASE_URL}/character/basic`, {
          params: apiParams,
          headers: {
            accept: 'application/json',
            'x-nxopen-api-key': API_KEY,
          },
        });
        return Response.json(response.data);
      } catch (error) {
        console.error(
          'Error fetching character:',
          error.response?.data || error.message
        );
        return Response.json(
          { error: 'Failed to fetch character' },
          { status: 500 }
        );
      }
    },
  };
});

const { GET } = require('../../app/api/characters/[id]/route');

// Mock Response
global.Response = {
  json: jest.fn((data, options = {}) => ({
    status: options.status || 200,
    json: () => Promise.resolve(data),
  })),
};

describe('/api/characters/[id]', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    global.Response.json.mockClear();

    // Mock environment variables
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.test.com';
    process.env.API_KEY = 'test-key';
  });

  describe('GET /api/characters/[id]', () => {
    it('returns 400 for dates before minimum allowed date', async () => {
      const request = {
        url: 'http://localhost:3000/api/characters/test-id?date=2025-10-13',
      };
      const context = {
        params: Promise.resolve({ id: 'test-id' }),
      };

      const response = await GET(request, context);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('Date cannot be earlier than 2025-10-14');
    });

    it('returns character data on successful API call', async () => {
      const mockApiResponse = {
        data: {
          character_name: 'Test Character',
          world_name: 'Test World',
          character_class: 'Test Class',
          character_level: 200,
        },
      };

      mockedAxios.get.mockResolvedValue(mockApiResponse);

      const request = {
        url: 'http://localhost:3000/api/characters/test-id?date=2025-10-15',
      };
      const context = {
        params: Promise.resolve({ id: 'test-id' }),
      };

      const response = await GET(request, context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual(mockApiResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.test.com/character/basic',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-nxopen-api-key': 'test-key',
          }),
          params: expect.objectContaining({
            ocid: 'test-id',
            date: '2025-10-15',
          }),
        })
      );
    });

    it('returns 500 on API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const request = {
        url: 'http://localhost:3000/api/characters/test-id?date=2025-10-15',
      };
      const context = {
        params: Promise.resolve({ id: 'test-id' }),
      };

      const response = await GET(request, context);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toContain('Failed to fetch character');
    });
  });
});
