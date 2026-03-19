// Mock next/server before importing route
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, options = {}) => ({
      status: options.status || 200,
      json: async () => data,
    }),
  },
}));

jest.mock('../../../lib/guildSyncService.js');
jest.mock('../../../lib/redis.js');

import { GET } from '../../../app/api/guild/search/route.js';

describe('GET /api/guild/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if name is missing', async () => {
    const request = new Request(
      'http://localhost/api/guild/search?world=%E8%89%BE%E9%BA%97%E4%BA%9E'
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 if world is missing', async () => {
    const request = new Request(
      'http://localhost/api/guild/search?name=TestGuild'
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 if both name and world are missing', async () => {
    const request = new Request('http://localhost/api/guild/search');
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('should return guild data on success', async () => {
    const { searchAndSyncGuild, startGuildSync } = await import(
      '../../../lib/guildSyncService.js'
    );
    const { getCached, setCache } = await import('../../../lib/redis.js');

    getCached.mockResolvedValue(null);
    setCache.mockResolvedValue(undefined);
    searchAndSyncGuild.mockResolvedValue({
      oguildId: 'guild123',
      guildInfo: {
        guild_name: 'TestGuild',
        world_name: '艾麗亞',
        guild_level: 30,
        guild_fame: 100,
        guild_point: 5000,
        guild_master_name: 'Master',
      },
      memberCount: 50,
    });
    startGuildSync.mockResolvedValue({
      total: 50,
      synced: 0,
      failed: 0,
      inProgress: true,
    });

    const request = new Request(
      'http://localhost/api/guild/search?name=TestGuild&world=%E8%89%BE%E9%BA%97%E4%BA%9E'
    );
    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.oguildId).toBe('guild123');
    expect(data.guildName).toBe('TestGuild');
    expect(data.memberCount).toBe(50);
  });

  it('should return 404 when guild not found', async () => {
    const { searchAndSyncGuild } = await import(
      '../../../lib/guildSyncService.js'
    );
    const { getCached } = await import('../../../lib/redis.js');

    getCached.mockResolvedValue(null);
    searchAndSyncGuild.mockRejectedValue(new Error('404: Guild not found'));

    const request = new Request(
      'http://localhost/api/guild/search?name=NonExistent&world=%E8%89%BE%E9%BA%97%E4%BA%9E'
    );
    const response = await GET(request);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe('找不到此工會');
  });

  it('should return cached result if available', async () => {
    const { getCached } = await import('../../../lib/redis.js');

    const cachedData = {
      oguildId: 'cached123',
      guildName: 'CachedGuild',
      worldName: '艾麗亞',
    };
    getCached.mockResolvedValue(cachedData);

    const request = new Request(
      'http://localhost/api/guild/search?name=CachedGuild&world=%E8%89%BE%E9%BA%97%E4%BA%9E'
    );
    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.oguildId).toBe('cached123');
  });
});
