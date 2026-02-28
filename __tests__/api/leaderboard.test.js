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

const mockGetLeaderboardData = jest.fn();
const mockGetCharacterInfoCache = jest.fn();
const mockGetExistingCombatPowerRecords = jest.fn();
const mockUpsertCharacterInfoCache = jest.fn();

jest.mock('../../lib/googleSheets', () => {
  return jest.fn().mockImplementation(() => ({
    getLeaderboardData: mockGetLeaderboardData,
    getCharacterInfoCache: mockGetCharacterInfoCache,
    getExistingCombatPowerRecords: mockGetExistingCombatPowerRecords,
    upsertCharacterInfoCache: mockUpsertCharacterInfoCache,
  }));
});

jest.mock('../../lib/characterInfoService', () => ({
  fetchCharacterInfo: jest.fn(),
}));

import { GET } from '../../app/api/leaderboard/route';

describe('GET /api/leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated leaderboard data without filters', async () => {
    const characterInfoMap = new Map([
      [
        'ocid1',
        {
          character_name: 'Player1',
          character_level: 250,
          character_image: 'img1',
          world_name: '殺人鯨',
          character_class: '冒險家',
          cached_at: '2026-01-01',
        },
      ],
    ]);

    mockGetLeaderboardData.mockResolvedValue({
      entries: [
        {
          ocid: 'ocid1',
          combat_power: 50000,
          updated_at: '2026-01-01',
        },
      ],
      totalCount: 1,
      hasMore: false,
    });
    mockGetCharacterInfoCache.mockResolvedValue(characterInfoMap);

    const url = 'http://localhost/api/leaderboard?offset=0&limit=20';
    const request = new Request(url);
    const response = await GET(request);
    const data = await response.json();

    expect(mockGetExistingCombatPowerRecords).not.toHaveBeenCalled();
    expect(mockGetLeaderboardData).toHaveBeenCalledWith(0, 20, {
      search: null,
      worldName: null,
      characterClass: null,
      characterInfoMap: undefined,
    });
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].character_name).toBe('Player1');
    expect(data.entries[0].rank).toBe(1);
  });

  it('should pass filter params to getLeaderboardData', async () => {
    const characterInfoMap = new Map([
      [
        'ocid1',
        {
          character_name: 'TestPlayer',
          character_level: 275,
          character_image: 'img1',
          world_name: '殺人鯨',
          character_class: '冒險家 - 乘風破浪',
          cached_at: '2026-01-01',
        },
      ],
    ]);

    mockGetExistingCombatPowerRecords.mockResolvedValue(
      new Map([
        [
          'ocid1',
          {
            combat_power: '50000',
            updated_at: '2026-01-01',
            status: 'success',
          },
        ],
      ])
    );
    mockGetCharacterInfoCache.mockResolvedValue(characterInfoMap);
    mockGetLeaderboardData.mockResolvedValue({
      entries: [
        {
          ocid: 'ocid1',
          combat_power: 50000,
          updated_at: '2026-01-01',
        },
      ],
      totalCount: 1,
      hasMore: false,
    });

    const url =
      'http://localhost/api/leaderboard?search=Test&worldName=殺人鯨&characterClass=乘風破浪';
    const request = new Request(url);
    const response = await GET(request);
    const data = await response.json();

    expect(mockGetExistingCombatPowerRecords).toHaveBeenCalled();
    expect(mockGetCharacterInfoCache).toHaveBeenCalledWith(['ocid1']);
    expect(mockGetLeaderboardData).toHaveBeenCalledWith(
      0,
      20,
      expect.objectContaining({
        search: 'Test',
        worldName: '殺人鯨',
        characterClass: '乘風破浪',
      })
    );

    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].character_name).toBe('TestPlayer');
    expect(data.totalCount).toBe(1);
  });

  it('should not fetch all character info when no filters', async () => {
    mockGetCharacterInfoCache.mockResolvedValue(new Map());
    mockGetLeaderboardData.mockResolvedValue({
      entries: [],
      totalCount: 0,
      hasMore: false,
    });

    const url = 'http://localhost/api/leaderboard';
    const request = new Request(url);
    await GET(request);

    expect(mockGetExistingCombatPowerRecords).not.toHaveBeenCalled();
    expect(mockGetLeaderboardData).toHaveBeenCalledWith(0, 20, {
      search: null,
      worldName: null,
      characterClass: null,
      characterInfoMap: undefined,
    });
  });

  it('should return empty entries when filtered results are empty', async () => {
    mockGetExistingCombatPowerRecords.mockResolvedValue(
      new Map([
        [
          'ocid1',
          {
            combat_power: '50000',
            updated_at: '2026-01-01',
            status: 'success',
          },
        ],
      ])
    );
    mockGetCharacterInfoCache.mockResolvedValue(new Map());
    mockGetLeaderboardData.mockResolvedValue({
      entries: [],
      totalCount: 0,
      hasMore: false,
    });

    const url = 'http://localhost/api/leaderboard?search=NonExistent';
    const request = new Request(url);
    const response = await GET(request);
    const data = await response.json();

    expect(data.entries).toHaveLength(0);
    expect(data.totalCount).toBe(0);
    expect(data.hasMore).toBe(false);
  });

  it('should clamp limit to 100 max', async () => {
    mockGetCharacterInfoCache.mockResolvedValue(new Map());
    mockGetLeaderboardData.mockResolvedValue({
      entries: [],
      totalCount: 0,
      hasMore: false,
    });

    const url = 'http://localhost/api/leaderboard?limit=200';
    const request = new Request(url);
    await GET(request);

    expect(mockGetLeaderboardData).toHaveBeenCalledWith(
      0,
      100,
      expect.any(Object)
    );
  });

  it('should return 500 on error', async () => {
    mockGetLeaderboardData.mockRejectedValue(new Error('Sheet error'));

    const url = 'http://localhost/api/leaderboard';
    const request = new Request(url);
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch leaderboard data');
  });
});
