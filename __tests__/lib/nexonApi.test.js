/**
 * @jest-environment node
 */

const mockGet = jest.fn();

jest.mock('axios', () => {
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => ({
        get: mockGet,
      })),
    },
  };
});

describe('nexonApi', () => {
  let getCharacterBasicInfo;
  let getCharacterStats;
  let getCharacterEquipment;

  beforeAll(async () => {
    const mod = await import('../../lib/nexonApi');
    getCharacterBasicInfo = mod.getCharacterBasicInfo;
    getCharacterStats = mod.getCharacterStats;
    getCharacterEquipment = mod.getCharacterEquipment;
  });

  beforeEach(() => {
    mockGet.mockClear();
  });

  describe('getCharacterBasicInfo', () => {
    it('should return character basic info on success', async () => {
      const mockData = {
        character_name: 'TestChar',
        character_class: 'Hero',
        character_level: 250,
        world_name: 'Reboot',
      };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await getCharacterBasicInfo('test-ocid');

      expect(mockGet).toHaveBeenCalledWith(
        '/character/basic?ocid=test-ocid'
      );
      expect(result).toEqual(mockData);
    });

    it('should throw an error on failure', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(
        getCharacterBasicInfo('test-ocid')
      ).rejects.toThrow(
        'Failed to fetch character basic info: Network Error'
      );
    });
  });

  describe('getCharacterStats', () => {
    it('should return character stats on success', async () => {
      const mockData = {
        final_stat: [{ stat_name: 'STR', stat_value: '100' }],
      };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await getCharacterStats('test-ocid');

      expect(mockGet).toHaveBeenCalledWith(
        '/character/stat?ocid=test-ocid'
      );
      expect(result).toEqual(mockData);
    });

    it('should throw an error on failure', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(getCharacterStats('test-ocid')).rejects.toThrow(
        'Failed to fetch character stats: Network Error'
      );
    });
  });

  describe('getCharacterEquipment', () => {
    it('should return character equipment on success', async () => {
      const mockData = { item_equipment: [] };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await getCharacterEquipment('test-ocid');

      expect(mockGet).toHaveBeenCalledWith(
        '/character/item-equipment?ocid=test-ocid'
      );
      expect(result).toEqual(mockData);
    });

    it('should throw an error on failure', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(
        getCharacterEquipment('test-ocid')
      ).rejects.toThrow(
        'Failed to fetch character equipment: Network Error'
      );
    });
  });
});
