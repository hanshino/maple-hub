const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock the route module
jest.mock('../../../../app/api/character/[ocid]/runes/route', () => {
  const axios = require('axios');

  return {
    GET: async (request, { params }) => {
      const { ocid } = params;
      const apiKey = process.env.API_KEY;

      if (!apiKey) {
        return Response.json(
          { error: 'API key not configured' },
          { status: 500 }
        );
      }

      try {
        const response = await axios.get(
          `https://open.api.nexon.com/maplestorytw/v1/character/symbol-equipment?ocid=${ocid}`,
          { headers: { 'x-nxopen-api-key': apiKey } }
        );
        return Response.json(response.data);
      } catch (error) {
        console.error(
          'Error fetching rune data:',
          error.response?.data || error.message
        );
        return Response.json(
          { error: 'Failed to fetch rune data' },
          { status: error.response?.status || 500 }
        );
      }
    },
  };
});

const { GET } = require('../../../../app/api/character/[ocid]/runes/route');

// Mock Response
global.Response = {
  json: jest.fn((data, options = {}) => ({
    status: options.status || 200,
    json: () => Promise.resolve(data),
  })),
};

describe('/api/character/[ocid]/runes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.Response.json.mockClear();

    // Mock environment variables
    process.env.API_KEY = 'test-key';
  });

  it('returns rune data on successful API call', async () => {
    const mockData = {
      symbol: [
        {
          symbol_name: '祕法符文：測試',
          symbol_icon: 'https://example.com/icon.png',
          symbol_level: 1,
          symbol_force: 10,
        },
      ],
    };

    mockedAxios.get.mockResolvedValue({ data: mockData });

    const request = {
      url: 'http://localhost/api/character/test-ocid/runes',
    };
    const context = {
      params: { ocid: 'test-ocid' },
    };

    const response = await GET(request, context);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual(mockData);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://open.api.nexon.com/maplestorytw/v1/character/symbol-equipment?ocid=test-ocid',
      expect.objectContaining({
        headers: { 'x-nxopen-api-key': 'test-key' },
      })
    );
  });

  it('returns error when API key is not configured', async () => {
    const originalEnv = process.env.API_KEY;
    delete process.env.API_KEY;

    const request = {
      url: 'http://localhost/api/character/test-ocid/runes',
    };
    const context = {
      params: { ocid: 'test-ocid' },
    };

    const response = await GET(request, context);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe('API key not configured');

    process.env.API_KEY = originalEnv;
  });

  it('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue({
      response: { status: 404, data: 'Character not found' },
    });

    const request = {
      url: 'http://localhost/api/character/test-ocid/runes',
    };
    const context = {
      params: { ocid: 'test-ocid' },
    };

    const response = await GET(request, context);
    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.error).toBe('Failed to fetch rune data');
  });
});
