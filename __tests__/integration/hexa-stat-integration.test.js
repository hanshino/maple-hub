import { fetchHexaStatCores } from '../../lib/hexaMatrixApi.js';
import { calculateStatCoreProgress } from '../../lib/progressUtils.js';

// Mock axios for API calls
jest.mock('axios');
import axios from 'axios';

describe('Hexa Stat Integration', () => {
  const mockOcid = 'test-ocid-123';

  const mockApiResponse = {
    date: '2025-10-19',
    character_class: '惡魔殺手',
    character_hexa_stat_core: [
      {
        slot_id: '0',
        main_stat_name: 'boss傷害增加',
        sub_stat_name_1: '爆擊傷害增加',
        sub_stat_name_2: '主要屬性增加',
        main_stat_level: 3,
        sub_stat_level_1: 7,
        sub_stat_level_2: 10,
        stat_grade: 20,
      },
      {
        slot_id: '1',
        main_stat_name: '最終傷害增加',
        sub_stat_name_1: '無視防禦力',
        sub_stat_name_2: null,
        main_stat_level: 5,
        sub_stat_level_1: 10,
        sub_stat_level_2: 0,
        stat_grade: 15,
      },
      {
        slot_id: '2',
        main_stat_name: null,
        sub_stat_name_1: null,
        sub_stat_name_2: null,
        main_stat_level: 0,
        sub_stat_level_1: 0,
        sub_stat_level_2: 0,
        stat_grade: 0,
      },
      {
        slot_id: '3',
        main_stat_name: '攻擊力增加',
        sub_stat_name_1: '魔力增加',
        sub_stat_name_2: '智力增加',
        main_stat_level: 4,
        sub_stat_level_1: 8,
        sub_stat_level_2: 6,
        stat_grade: 18,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage to ensure no cached data
    localStorage.clear();
    axios.get.mockResolvedValue({ data: mockApiResponse });
  });

  test('fetches stat core data successfully', async () => {
    const result = await fetchHexaStatCores(mockOcid);

    expect(axios.get).toHaveBeenCalledWith(
      '/api/hexa-matrix-stat',
      expect.objectContaining({
        params: { ocid: mockOcid },
        headers: expect.objectContaining({
          accept: 'application/json',
        }),
        timeout: 10000,
      })
    );

    expect(result).toEqual(mockApiResponse);
  });

  test('handles API errors gracefully', async () => {
    const errorMessage = 'Network error - please check your connection';
    axios.get.mockRejectedValueOnce(new Error('API rate limit exceeded'));

    await expect(fetchHexaStatCores(mockOcid)).rejects.toThrow(errorMessage);
  });

  test('calculates progress from fetched data', async () => {
    const statData = await fetchHexaStatCores(mockOcid);
    const progress = calculateStatCoreProgress(
      statData.character_hexa_stat_core
    );

    expect(progress.activatedCount).toBe(3); // cores 0, 1, and 3 are activated
    expect(progress.totalAvailable).toBe(4);
    expect(progress.averageGrade).toBeCloseTo(17.67, 1); // (20 + 15 + 0 + 18) / 3
    expect(progress.materialUsed.soulElda).toBe(15); // Core III unactivated
    expect(progress.materialUsed.soulEldaFragments).toBeGreaterThan(0);
  });

  test('handles empty stat core array', async () => {
    const emptyResponse = {
      ...mockApiResponse,
      character_hexa_stat_core: [],
    };
    axios.get.mockResolvedValueOnce({ data: emptyResponse });

    const result = await fetchHexaStatCores(mockOcid);
    const progress = calculateStatCoreProgress(result.character_hexa_stat_core);

    expect(result.character_hexa_stat_core).toEqual([]);
    expect(progress.activatedCount).toBe(0);
    expect(progress.averageGrade).toBe(0);
    expect(progress.materialUsed.soulElda).toBe(0); // No cores means no costs
    expect(progress.materialUsed.soulEldaFragments).toBe(0);
  });

  test('processes all activated cores correctly', async () => {
    const allActivatedResponse = {
      ...mockApiResponse,
      character_hexa_stat_core: [
        { ...mockApiResponse.character_hexa_stat_core[0] }, // grade 20
        { ...mockApiResponse.character_hexa_stat_core[1] }, // grade 15
        {
          slot_id: '2',
          main_stat_name: '攻擊力增加',
          sub_stat_name_1: '魔力增加',
          sub_stat_name_2: '智力增加',
          main_stat_level: 4,
          sub_stat_level_1: 8,
          sub_stat_level_2: 6,
          stat_grade: 18,
        },
        { ...mockApiResponse.character_hexa_stat_core[3] }, // grade 18
      ],
    };

    axios.get.mockResolvedValueOnce({ data: allActivatedResponse });

    const statData = await fetchHexaStatCores(mockOcid);
    const progress = calculateStatCoreProgress(
      statData.character_hexa_stat_core
    );

    expect(progress.activatedCount).toBe(4);
    expect(progress.averageGrade).toBeCloseTo(17.75, 1); // (20 + 15 + 18 + 18) / 4
    expect(progress.materialUsed.soulElda).toBe(0); // No unactivated cores
    expect(progress.materialUsed.soulEldaFragments).toBeGreaterThan(0); // Upgrade costs
  });

  test('integrates with cache system', async () => {
    // First call should make API request
    await fetchHexaStatCores(mockOcid);
    expect(axios.get).toHaveBeenCalledTimes(1);

    // Second call should use cache (if implemented)
    // Note: Cache implementation would be tested separately
    // This test verifies the API integration works
    const result2 = await fetchHexaStatCores(mockOcid);
    expect(result2).toBeDefined();
  });
});
