/**
 * @jest-environment node
 */

// Mock next/server before importing the route
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, options = {}) => ({
      status: options.status || 200,
      json: async () => data,
    }),
  },
}));

const mockGetFilterOptions = jest.fn();

jest.mock('../../lib/googleSheets', () => {
  return jest.fn().mockImplementation(() => ({
    getFilterOptions: mockGetFilterOptions,
  }));
});

import { GET } from '../../app/api/leaderboard/filters/route';

describe('GET /api/leaderboard/filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return filter options', async () => {
    mockGetFilterOptions.mockResolvedValue({
      worlds: ['殺人鯨', '青橡'],
      classes: ['冒險家 - 乘風破浪', '冒險家 - 劍豪'],
    });

    const response = await GET();
    const data = await response.json();

    expect(data.worlds).toEqual(['殺人鯨', '青橡']);
    expect(data.classes).toEqual(['冒險家 - 乘風破浪', '冒險家 - 劍豪']);
  });

  it('should return 500 on error', async () => {
    mockGetFilterOptions.mockRejectedValue(new Error('Sheet error'));

    const response = await GET();

    expect(response.status).toBe(500);
  });
});
