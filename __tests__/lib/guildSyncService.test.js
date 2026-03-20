import {
  syncGuildMemberBasic,
  startGuildSync,
  getSyncStatus,
  searchAndSyncGuild,
} from '../../lib/guildSyncService.js';

jest.mock('../../lib/nexonApi.js', () => ({
  getCharacterOcid: jest.fn(),
  getCharacterBasicInfo: jest.fn(),
  getCharacterStats: jest.fn(),
  getGuildId: jest.fn(),
  getGuildBasic: jest.fn(),
}));

jest.mock('../../lib/db/guildQueries.js', () => ({
  upsertGuild: jest.fn(),
  upsertGuildSkills: jest.fn(),
  syncGuildMembers: jest.fn(),
  updateGuildMemberOcid: jest.fn(),
  getUnsyncedGuildMembers: jest.fn(),
  upsertCharacterBasicOnly: jest.fn(),
  upsertExpSnapshot: jest.fn().mockResolvedValue(),
}));

jest.mock('../../lib/redis.js', () => ({
  getRedis: jest.fn(() => ({
    hgetall: jest.fn().mockResolvedValue(null),
    hmset: jest.fn().mockResolvedValue('OK'),
    expire: jest.fn().mockResolvedValue(1),
  })),
}));

jest.mock('../../lib/rateLimiter.js', () => ({
  getGlobalRateLimiter: jest.fn(() => ({
    execute: jest.fn(fn => fn()),
  })),
}));

describe('guildSyncService', () => {
  it('should export syncGuildMemberBasic', () => {
    expect(typeof syncGuildMemberBasic).toBe('function');
  });

  it('should export startGuildSync', () => {
    expect(typeof startGuildSync).toBe('function');
  });

  it('should export getSyncStatus', () => {
    expect(typeof getSyncStatus).toBe('function');
  });

  it('should export searchAndSyncGuild', () => {
    expect(typeof searchAndSyncGuild).toBe('function');
  });

  describe('getSyncStatus', () => {
    it('should return null when no status exists in Redis', async () => {
      const { getRedis } = await import('../../lib/redis.js');
      getRedis.mockReturnValue({
        hgetall: jest.fn().mockResolvedValue(null),
        hmset: jest.fn(),
        expire: jest.fn(),
      });

      const result = await getSyncStatus('guild123');
      expect(result).toBeNull();
    });

    it('should parse status from Redis hash', async () => {
      const { getRedis } = await import('../../lib/redis.js');
      getRedis.mockReturnValue({
        hgetall: jest.fn().mockResolvedValue({
          total: '10',
          synced: '5',
          failed: '1',
          inProgress: 'true',
          startedAt: '2026-01-01T00:00:00.000Z',
        }),
        hmset: jest.fn(),
        expire: jest.fn(),
      });

      const result = await getSyncStatus('guild123');
      expect(result).toEqual({
        total: 10,
        synced: 5,
        failed: 1,
        inProgress: true,
        startedAt: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('syncGuildMemberBasic', () => {
    it('should call rate limiter for both OCID and basic info', async () => {
      const { getCharacterOcid, getCharacterBasicInfo, getCharacterStats } =
        await import('../../lib/nexonApi.js');
      const { upsertCharacterBasicOnly, updateGuildMemberOcid } =
        await import('../../lib/db/guildQueries.js');
      const { getGlobalRateLimiter } = await import('../../lib/rateLimiter.js');

      const mockExecute = jest.fn(fn => fn());
      getGlobalRateLimiter.mockReturnValue({ execute: mockExecute });

      getCharacterOcid.mockResolvedValue('ocid-abc');
      getCharacterStats.mockResolvedValue({
        final_stat: [{ stat_name: '戰鬥力', stat_value: '12345678' }],
      });
      getCharacterBasicInfo.mockResolvedValue({
        character_name: 'TestChar',
        character_level: 260,
        character_class: '聖騎士',
        character_class_level: '6',
        character_guild_name: 'TestGuild',
        character_image: 'https://example.com/img.png',
        character_exp_rate: '99.99',
        character_gender: '남',
        world_name: '艾麗亞',
      });
      upsertCharacterBasicOnly.mockResolvedValue();
      updateGuildMemberOcid.mockResolvedValue();

      const result = await syncGuildMemberBasic('guild123', 'TestChar');

      // 3 rate-limited calls: OCID + basic + stats
      expect(mockExecute).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.characterName).toBe('TestChar');
      expect(result.ocid).toBe('ocid-abc');
      expect(upsertCharacterBasicOnly).toHaveBeenCalledWith(
        expect.objectContaining({
          ocid: 'ocid-abc',
          characterName: 'TestChar',
          combatPower: '12345678',
        })
      );
      expect(updateGuildMemberOcid).toHaveBeenCalledWith(
        'guild123',
        'TestChar',
        'ocid-abc'
      );
    });

    it('should return failure result when API throws', async () => {
      const { getCharacterOcid } = await import('../../lib/nexonApi.js');
      const { getGlobalRateLimiter } = await import('../../lib/rateLimiter.js');

      getGlobalRateLimiter.mockReturnValue({
        execute: jest.fn(fn => fn()),
      });
      getCharacterOcid.mockRejectedValue(new Error('API error'));

      const result = await syncGuildMemberBasic('guild123', 'FailChar');
      expect(result.success).toBe(false);
      expect(result.characterName).toBe('FailChar');
      expect(result.error).toBe('API error');
    });
  });

  describe('startGuildSync', () => {
    it('should return existing status if sync is already in progress', async () => {
      const { getRedis } = await import('../../lib/redis.js');
      getRedis.mockReturnValue({
        hgetall: jest.fn().mockResolvedValue({
          total: '50',
          synced: '10',
          failed: '0',
          inProgress: 'true',
          startedAt: '2026-01-01T00:00:00.000Z',
        }),
        hmset: jest.fn(),
        expire: jest.fn(),
      });

      const result = await startGuildSync('guild123');
      expect(result.inProgress).toBe(true);
      expect(result.total).toBe(50);
    });

    it('should return zero status when no unsynced members', async () => {
      const { getRedis } = await import('../../lib/redis.js');
      const { getUnsyncedGuildMembers } =
        await import('../../lib/db/guildQueries.js');

      getRedis.mockReturnValue({
        hgetall: jest.fn().mockResolvedValue(null),
        hmset: jest.fn(),
        expire: jest.fn(),
      });
      getUnsyncedGuildMembers.mockResolvedValue([]);

      const result = await startGuildSync('guild456');
      expect(result).toEqual({
        total: 0,
        synced: 0,
        failed: 0,
        inProgress: false,
      });
    });
  });

  describe('searchAndSyncGuild', () => {
    it('should call guild API and upsert all guild data', async () => {
      const { getGuildId, getGuildBasic } =
        await import('../../lib/nexonApi.js');
      const { upsertGuild, upsertGuildSkills, syncGuildMembers } =
        await import('../../lib/db/guildQueries.js');
      const { getGlobalRateLimiter } = await import('../../lib/rateLimiter.js');

      getGlobalRateLimiter.mockReturnValue({
        execute: jest.fn(fn => fn()),
      });

      getGuildId.mockResolvedValue('oguild-xyz');
      getGuildBasic.mockResolvedValue({
        guild_name: 'TestGuild',
        world_name: '艾麗亞',
        guild_level: 30,
        guild_fame: 12345,
        guild_point: 67890,
        guild_master_name: 'GuildMaster',
        guild_member_count: 2,
        guild_mark: null,
        guild_mark_custom: null,
        guild_skill: [],
        guild_noblesse_skill: [],
        guild_member: ['Member1', 'Member2'],
      });
      upsertGuild.mockResolvedValue();
      upsertGuildSkills.mockResolvedValue();
      syncGuildMembers.mockResolvedValue({ added: 2, removed: 0 });

      const result = await searchAndSyncGuild('TestGuild', '艾麗亞');

      expect(getGuildId).toHaveBeenCalledWith('TestGuild', '艾麗亞');
      expect(getGuildBasic).toHaveBeenCalledWith('oguild-xyz');
      expect(upsertGuild).toHaveBeenCalledWith(
        expect.objectContaining({
          oguildId: 'oguild-xyz',
          guildName: 'TestGuild',
        })
      );
      expect(upsertGuildSkills).toHaveBeenCalledWith(
        'oguild-xyz',
        [],
        'regular'
      );
      expect(upsertGuildSkills).toHaveBeenCalledWith(
        'oguild-xyz',
        [],
        'noblesse'
      );
      expect(syncGuildMembers).toHaveBeenCalledWith('oguild-xyz', [
        'Member1',
        'Member2',
      ]);
      expect(result.oguildId).toBe('oguild-xyz');
      expect(result.memberCount).toBe(2);
    });
  });
});
