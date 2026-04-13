import { getUnionChampion } from '../../lib/nexonApi';

let mockGet;

jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
  };
  return {
    create: jest.fn(() => mockInstance),
    __mockInstance: mockInstance,
  };
});

beforeEach(() => {
  const axios = require('axios');
  mockGet = axios.__mockInstance.get;
  mockGet.mockReset();
});

describe('getUnionChampion', () => {
  it('should fetch union champion data', async () => {
    const mockData = {
      date: '2026-04-12',
      union_champion: [
        {
          champion_name: '影之愛衣',
          champion_slot: 1,
          champion_grade: 'SSS',
          champion_class: '暗夜行者',
          champion_badge_info: [{ stat: '增加全屬性 20、最大HP/MP 1000' }],
        },
      ],
      champion_badge_total_info: [{ stat: '增加全屬性 20、最大HP/MP 1000' }],
    };
    mockGet.mockResolvedValue({ data: mockData });

    const result = await getUnionChampion('test-ocid');

    expect(mockGet).toHaveBeenCalledWith(
      '/user/union-champion?ocid=test-ocid'
    );
    expect(result).toEqual(mockData);
  });

  it('should throw on failure', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(getUnionChampion('test-ocid')).rejects.toThrow(
      'Failed to fetch union champion'
    );
  });
});
