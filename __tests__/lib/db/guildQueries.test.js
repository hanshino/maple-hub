import {
  upsertGuild,
  upsertGuildSkills,
  syncGuildMembers,
  getGuildByOguildId,
  getGuildWithMembers,
  updateGuildMemberOcid,
  getGuildsByRecentActivity,
  getUnsyncedGuildMembers,
  upsertCharacterBasicOnly,
} from '../../../lib/db/guildQueries.js';

// Mock getDb
jest.mock('../../../lib/db/index.js', () => ({
  getDb: jest.fn(),
}));

describe('guildQueries exports', () => {
  it('should export upsertGuild', () => {
    expect(typeof upsertGuild).toBe('function');
  });

  it('should export upsertGuildSkills', () => {
    expect(typeof upsertGuildSkills).toBe('function');
  });

  it('should export syncGuildMembers', () => {
    expect(typeof syncGuildMembers).toBe('function');
  });

  it('should export getGuildByOguildId', () => {
    expect(typeof getGuildByOguildId).toBe('function');
  });

  it('should export getGuildWithMembers', () => {
    expect(typeof getGuildWithMembers).toBe('function');
  });

  it('should export updateGuildMemberOcid', () => {
    expect(typeof updateGuildMemberOcid).toBe('function');
  });

  it('should export getGuildsByRecentActivity', () => {
    expect(typeof getGuildsByRecentActivity).toBe('function');
  });

  it('should export getUnsyncedGuildMembers', () => {
    expect(typeof getUnsyncedGuildMembers).toBe('function');
  });

  it('should export upsertCharacterBasicOnly', () => {
    expect(typeof upsertCharacterBasicOnly).toBe('function');
  });
});

describe('syncGuildMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add new members and remove departed ones', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const deleteFn = jest.fn().mockReturnThis();
    const whereFn = jest.fn().mockReturnThis();
    const insertFn = jest.fn().mockReturnThis();
    const valuesFn = jest.fn().mockResolvedValue(undefined);
    const selectFn = jest.fn().mockReturnThis();
    const fromFn = jest.fn().mockReturnThis();

    // First call: select existing members
    // Second call: delete departed
    // Third call: insert new

    let selectCallCount = 0;
    const mockDb = {
      select: jest.fn(() => {
        selectCallCount++;
        return {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([
            { id: 1, characterName: 'Alice' },
            { id: 2, characterName: 'Bob' },
          ]),
        };
      }),
      delete: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(undefined),
      })),
      insert: jest.fn(() => ({
        values: jest.fn().mockResolvedValue(undefined),
      })),
    };

    getDb.mockReturnValue(mockDb);

    // New member list: Bob stays, Alice leaves, Charlie joins
    const result = await syncGuildMembers('guild1', ['Bob', 'Charlie']);

    expect(result.added).toBe(1);
    expect(result.removed).toBe(1);
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it('should not call delete when no members departed', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const mockDb = {
      select: jest.fn(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          { id: 1, characterName: 'Alice' },
        ]),
      })),
      delete: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(undefined),
      })),
      insert: jest.fn(() => ({
        values: jest.fn().mockResolvedValue(undefined),
      })),
    };

    getDb.mockReturnValue(mockDb);

    const result = await syncGuildMembers('guild1', ['Alice', 'NewMember']);

    expect(result.removed).toBe(0);
    expect(result.added).toBe(1);
    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it('should not call insert when no new members', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const mockDb = {
      select: jest.fn(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          { id: 1, characterName: 'Alice' },
          { id: 2, characterName: 'Bob' },
        ]),
      })),
      delete: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(undefined),
      })),
      insert: jest.fn(() => ({
        values: jest.fn().mockResolvedValue(undefined),
      })),
    };

    getDb.mockReturnValue(mockDb);

    // Alice leaves, no new members
    const result = await syncGuildMembers('guild1', ['Bob']);

    expect(result.removed).toBe(1);
    expect(result.added).toBe(0);
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
