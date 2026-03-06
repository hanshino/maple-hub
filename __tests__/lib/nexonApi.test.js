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
  let getCharacterCashItemEquipment;
  let getCharacterHyperStat;
  let getCharacterSetEffect;
  let getUnionRaider;
  let getUnionArtifact;

  beforeAll(async () => {
    const mod = await import('../../lib/nexonApi');
    getCharacterBasicInfo = mod.getCharacterBasicInfo;
    getCharacterStats = mod.getCharacterStats;
    getCharacterEquipment = mod.getCharacterEquipment;
    getCharacterCashItemEquipment = mod.getCharacterCashItemEquipment;
    getCharacterHyperStat = mod.getCharacterHyperStat;
    getCharacterSetEffect = mod.getCharacterSetEffect;
    getUnionRaider = mod.getUnionRaider;
    getUnionArtifact = mod.getUnionArtifact;
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

      expect(mockGet).toHaveBeenCalledWith('/character/basic?ocid=test-ocid');
      expect(result).toEqual(mockData);
    });

    it('should throw an error on failure', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(getCharacterBasicInfo('test-ocid')).rejects.toThrow(
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

      expect(mockGet).toHaveBeenCalledWith('/character/stat?ocid=test-ocid');
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

      await expect(getCharacterEquipment('test-ocid')).rejects.toThrow(
        'Failed to fetch character equipment: Network Error'
      );
    });
  });

  describe('getCharacterCashItemEquipment', () => {
    it('should return cash item equipment on success', async () => {
      const mockData = { cash_item_equipment_base: [] };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await getCharacterCashItemEquipment('test-ocid');

      expect(mockGet).toHaveBeenCalledWith(
        '/character/cashitem-equipment?ocid=test-ocid'
      );
      expect(result).toEqual(mockData);
    });

    it('should throw an error on failure', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(getCharacterCashItemEquipment('test-ocid')).rejects.toThrow(
        'Failed to fetch cash item equipment: Network Error'
      );
    });
  });

  describe('getCharacterHyperStat', () => {
    it('should return character hyper stat on success', async () => {
      const mockData = { hyper_stat_preset_1: [] };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await getCharacterHyperStat('test-ocid');

      expect(mockGet).toHaveBeenCalledWith(
        '/character/hyper-stat?ocid=test-ocid'
      );
      expect(result).toEqual(mockData);
    });

    it('should throw an error on failure', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(getCharacterHyperStat('test-ocid')).rejects.toThrow(
        'Failed to fetch character hyper stat: Network Error'
      );
    });
  });

  describe('getCharacterSetEffect', () => {
    it('should return character set effect on success', async () => {
      const mockData = { set_effect: [] };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await getCharacterSetEffect('test-ocid');

      expect(mockGet).toHaveBeenCalledWith(
        '/character/set-effect?ocid=test-ocid'
      );
      expect(result).toEqual(mockData);
    });

    it('should throw an error on failure', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(getCharacterSetEffect('test-ocid')).rejects.toThrow(
        'Failed to fetch character set effect: Network Error'
      );
    });
  });

  describe('getUnionRaider', () => {
    it('should return union raider on success', async () => {
      const mockData = { union_raider_stat: [] };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await getUnionRaider('test-ocid');

      expect(mockGet).toHaveBeenCalledWith('/user/union-raider?ocid=test-ocid');
      expect(result).toEqual(mockData);
    });

    it('should throw an error on failure', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(getUnionRaider('test-ocid')).rejects.toThrow(
        'Failed to fetch union raider: Network Error'
      );
    });
  });

  describe('getUnionArtifact', () => {
    it('should return union artifact on success', async () => {
      const mockData = { union_artifact_effect: [] };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await getUnionArtifact('test-ocid');

      expect(mockGet).toHaveBeenCalledWith(
        '/user/union-artifact?ocid=test-ocid'
      );
      expect(result).toEqual(mockData);
    });

    it('should throw an error on failure', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(getUnionArtifact('test-ocid')).rejects.toThrow(
        'Failed to fetch union artifact: Network Error'
      );
    });
  });
});
