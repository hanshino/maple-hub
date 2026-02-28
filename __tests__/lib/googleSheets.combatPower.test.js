/**
 * @jest-environment node
 */

import GoogleSheetsClient from '../../lib/googleSheets';

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({})),
    },
    sheets: jest.fn().mockReturnValue({
      spreadsheets: {
        values: {
          get: jest.fn(),
          update: jest.fn(),
          append: jest.fn(),
          batchUpdate: jest.fn(),
        },
        get: jest.fn(),
        batchUpdate: jest.fn(),
      },
    }),
  },
}));

describe('GoogleSheetsClient - Combat Power Methods', () => {
  let client;
  let mockSheets;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup environment variables
    process.env.GOOGLE_SHEETS_PROJECT_ID = 'test-project';
    process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID = 'test-key-id';
    process.env.GOOGLE_SHEETS_PRIVATE_KEY = 'test-private-key';
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL =
      'test@test.iam.gserviceaccount.com';
    process.env.GOOGLE_SHEETS_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_SHEETS_CLIENT_X509_CERT_URL = 'https://test.cert.url';
    process.env.SPREADSHEET_ID = 'test-spreadsheet-id';

    client = new GoogleSheetsClient();
    mockSheets = client.sheets;
  });

  describe('getAllOcids', () => {
    it('should return paginated OCIDs with correct metadata', async () => {
      const mockOcids = [
        ['ocid'], // header
        ['ocid1'],
        ['ocid2'],
        ['ocid3'],
        ['ocid4'],
        ['ocid5'],
      ];

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockOcids },
      });

      const result = await client.getAllOcids(0, 3);

      expect(result.ocids).toEqual(['ocid1', 'ocid2', 'ocid3']);
      expect(result.totalCount).toBe(5);
      expect(result.hasMore).toBe(true);
    });

    it('should handle offset correctly', async () => {
      const mockOcids = [
        ['ocid'], // header
        ['ocid1'],
        ['ocid2'],
        ['ocid3'],
        ['ocid4'],
        ['ocid5'],
      ];

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockOcids },
      });

      const result = await client.getAllOcids(3, 3);

      expect(result.ocids).toEqual(['ocid4', 'ocid5']);
      expect(result.totalCount).toBe(5);
      expect(result.hasMore).toBe(false);
    });

    it('should return empty array when no OCIDs exist', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: [] },
      });

      const result = await client.getAllOcids();

      expect(result.ocids).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should filter out empty rows', async () => {
      const mockOcids = [['ocid1'], [''], ['ocid2'], [null], ['ocid3']];

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockOcids },
      });

      const result = await client.getAllOcids();

      expect(result.ocids).toEqual(['ocid1', 'ocid2', 'ocid3']);
      expect(result.totalCount).toBe(3);
    });
  });

  describe('getCombatPowerSheet', () => {
    it('should return existing sheet info if sheet exists', async () => {
      mockSheets.spreadsheets.get.mockResolvedValue({
        data: {
          sheets: [
            { properties: { sheetId: 123, title: 'CombatPower' } },
            { properties: { sheetId: 456, title: 'Sheet1' } },
          ],
        },
      });

      const result = await client.getCombatPowerSheet();

      expect(result.sheetId).toBe(123);
      expect(result.sheetName).toBe('CombatPower');
      expect(mockSheets.spreadsheets.batchUpdate).not.toHaveBeenCalled();
    });

    it('should create new sheet with headers if not exists', async () => {
      mockSheets.spreadsheets.get.mockResolvedValue({
        data: {
          sheets: [{ properties: { sheetId: 456, title: 'Sheet1' } }],
        },
      });

      mockSheets.spreadsheets.batchUpdate.mockResolvedValue({
        data: {
          replies: [{ addSheet: { properties: { sheetId: 789 } } }],
        },
      });

      mockSheets.spreadsheets.values.update.mockResolvedValue({});

      const result = await client.getCombatPowerSheet();

      expect(result.sheetId).toBe(789);
      expect(result.sheetName).toBe('CombatPower');
      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalled();
      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith(
        expect.objectContaining({
          range: 'CombatPower!A1:D1',
          resource: {
            values: [['ocid', 'combat_power', 'updated_at', 'status']],
          },
        })
      );
    });
  });

  describe('upsertCombatPowerRecords', () => {
    it('should return early for empty records array', async () => {
      const result = await client.upsertCombatPowerRecords([]);

      expect(result).toEqual({ updated: 0, inserted: 0 });
      expect(mockSheets.spreadsheets.values.get).not.toHaveBeenCalled();
    });

    it('should update existing records', async () => {
      const existingData = [
        ['ocid', 'combat_power', 'updated_at', 'status'],
        ['ocid1', '1000000', '2025-12-05T00:00:00.000Z', 'success'],
      ];

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: existingData },
      });

      mockSheets.spreadsheets.values.batchUpdate.mockResolvedValue({});

      const records = [
        {
          ocid: 'ocid1',
          combat_power: '2000000',
          updated_at: '2025-12-06T00:00:00.000Z',
          status: 'success',
        },
      ];

      const result = await client.upsertCombatPowerRecords(records);

      expect(result.updated).toBe(1);
      expect(result.inserted).toBe(0);
      expect(mockSheets.spreadsheets.values.batchUpdate).toHaveBeenCalled();
    });

    it('should insert new records', async () => {
      const existingData = [['ocid', 'combat_power', 'updated_at', 'status']];

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: existingData },
      });

      mockSheets.spreadsheets.values.append.mockResolvedValue({});

      const records = [
        {
          ocid: 'ocid1',
          combat_power: '1000000',
          updated_at: '2025-12-06T00:00:00.000Z',
          status: 'success',
        },
      ];

      const result = await client.upsertCombatPowerRecords(records);

      expect(result.updated).toBe(0);
      expect(result.inserted).toBe(1);
      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalled();
    });

    it('should handle mixed update and insert', async () => {
      const existingData = [
        ['ocid', 'combat_power', 'updated_at', 'status'],
        ['ocid1', '1000000', '2025-12-05T00:00:00.000Z', 'success'],
      ];

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: existingData },
      });

      mockSheets.spreadsheets.values.batchUpdate.mockResolvedValue({});
      mockSheets.spreadsheets.values.append.mockResolvedValue({});

      const records = [
        {
          ocid: 'ocid1',
          combat_power: '2000000',
          updated_at: '2025-12-06T00:00:00.000Z',
          status: 'success',
        },
        {
          ocid: 'ocid2',
          combat_power: '1500000',
          updated_at: '2025-12-06T00:00:00.000Z',
          status: 'success',
        },
      ];

      const result = await client.upsertCombatPowerRecords(records);

      expect(result.updated).toBe(1);
      expect(result.inserted).toBe(1);
    });
  });

  describe('getLeaderboardData', () => {
    it('should filter by worldName when characterInfo is provided', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [
            ['ocid', 'combat_power', 'updated_at', 'status'],
            ['ocid1', '50000', '2026-01-01', 'success'],
            ['ocid2', '40000', '2026-01-01', 'success'],
            ['ocid3', '30000', '2026-01-01', 'success'],
          ],
        },
      });

      const characterInfoMap = new Map([
        [
          'ocid1',
          {
            character_name: 'A',
            world_name: '殺人鯨',
            character_class: '冒險家',
          },
        ],
        [
          'ocid2',
          {
            character_name: 'B',
            world_name: '青橡',
            character_class: '冒險家',
          },
        ],
        [
          'ocid3',
          {
            character_name: 'C',
            world_name: '殺人鯨',
            character_class: '騎士',
          },
        ],
      ]);

      const result = await client.getLeaderboardData(0, 20, {
        worldName: '殺人鯨',
        characterInfoMap,
      });

      expect(result.entries.length).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.entries[0].ocid).toBe('ocid1');
      expect(result.entries[1].ocid).toBe('ocid3');
    });

    it('should filter by search (character name) case-insensitively', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [
            ['ocid', 'combat_power', 'updated_at', 'status'],
            ['ocid1', '50000', '2026-01-01', 'success'],
            ['ocid2', '40000', '2026-01-01', 'success'],
          ],
        },
      });

      const characterInfoMap = new Map([
        [
          'ocid1',
          {
            character_name: 'HelloWorld',
            world_name: '殺人鯨',
            character_class: '冒險家',
          },
        ],
        [
          'ocid2',
          {
            character_name: 'GoodBye',
            world_name: '青橡',
            character_class: '冒險家',
          },
        ],
      ]);

      const result = await client.getLeaderboardData(0, 20, {
        search: 'hello',
        characterInfoMap,
      });

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].ocid).toBe('ocid1');
    });

    it('should filter by characterClass with substring match', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [
            ['ocid', 'combat_power', 'updated_at', 'status'],
            ['ocid1', '50000', '2026-01-01', 'success'],
            ['ocid2', '40000', '2026-01-01', 'success'],
          ],
        },
      });

      const characterInfoMap = new Map([
        [
          'ocid1',
          {
            character_name: 'A',
            world_name: '殺人鯨',
            character_class: '冒險家 - 乘風破浪',
          },
        ],
        [
          'ocid2',
          {
            character_name: 'B',
            world_name: '青橡',
            character_class: '冒險家 - 劍豪',
          },
        ],
      ]);

      const result = await client.getLeaderboardData(0, 20, {
        characterClass: '乘風破浪',
        characterInfoMap,
      });

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].ocid).toBe('ocid1');
    });

    it('should combine multiple filters', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [
            ['ocid', 'combat_power', 'updated_at', 'status'],
            ['ocid1', '50000', '2026-01-01', 'success'],
            ['ocid2', '40000', '2026-01-01', 'success'],
            ['ocid3', '30000', '2026-01-01', 'success'],
          ],
        },
      });

      const characterInfoMap = new Map([
        [
          'ocid1',
          {
            character_name: 'A',
            world_name: '殺人鯨',
            character_class: '冒險家 - 乘風破浪',
          },
        ],
        [
          'ocid2',
          {
            character_name: 'B',
            world_name: '殺人鯨',
            character_class: '冒險家 - 劍豪',
          },
        ],
        [
          'ocid3',
          {
            character_name: 'C',
            world_name: '青橡',
            character_class: '冒險家 - 乘風破浪',
          },
        ],
      ]);

      const result = await client.getLeaderboardData(0, 20, {
        worldName: '殺人鯨',
        characterClass: '乘風破浪',
        characterInfoMap,
      });

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].ocid).toBe('ocid1');
    });
  });

  describe('getFilterOptions', () => {
    it('should return deduplicated and sorted worlds and classes', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [
            [
              'ocid',
              'character_name',
              'character_level',
              'character_image',
              'world_name',
              'character_class',
              'cached_at',
            ],
            [
              'ocid1',
              'Player1',
              '275',
              'img1',
              '殺人鯨',
              '冒險家 - 乘風破浪',
              '2026-01-01',
            ],
            [
              'ocid2',
              'Player2',
              '280',
              'img2',
              '青橡',
              '冒險家 - 乘風破浪',
              '2026-01-01',
            ],
            [
              'ocid3',
              'Player3',
              '270',
              'img3',
              '殺人鯨',
              '冒險家 - 乘風破浪',
              '2026-01-01',
            ],
            [
              'ocid4',
              'Player4',
              '260',
              'img4',
              '青橡',
              '冒險家 - 乘風破浪',
              '2026-01-01',
            ],
          ],
        },
      });

      jest
        .spyOn(client, 'getOrCreateCharacterInfoSheet')
        .mockResolvedValue({
          sheetId: 1,
          sheetName: 'CharacterInfo',
        });

      const result = await client.getFilterOptions();

      expect(result.worlds).toEqual(['殺人鯨', '青橡']);
      expect(result.classes).toEqual(['冒險家 - 乘風破浪']);
      // Should be deduplicated
      expect(result.worlds.length).toBe(2);
    });

    it('should return empty arrays when no data exists', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [
            [
              'ocid',
              'character_name',
              'character_level',
              'character_image',
              'world_name',
              'character_class',
              'cached_at',
            ],
          ],
        },
      });

      jest
        .spyOn(client, 'getOrCreateCharacterInfoSheet')
        .mockResolvedValue({
          sheetId: 1,
          sheetName: 'CharacterInfo',
        });

      const result = await client.getFilterOptions();

      expect(result.worlds).toEqual([]);
      expect(result.classes).toEqual([]);
    });
  });
});
