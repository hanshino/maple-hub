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

import { GET } from '../../app/api/character/cashitem-equipment/route';

jest.mock('../../lib/nexonApi', () => ({
  getCharacterCashItemEquipment: jest.fn(),
}));

jest.mock('../../lib/cache', () => ({
  getCachedData: jest.fn(() => null),
  setCachedData: jest.fn(),
}));

jest.mock('../../lib/apiErrorHandler', () => ({
  handleApiError: jest.fn(err => ({
    message: err.message || 'Internal server error',
    status: 500,
  })),
}));

import { getCharacterCashItemEquipment } from '../../lib/nexonApi';

describe('GET /api/character/cashitem-equipment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if ocid is missing', async () => {
    const request = new Request(
      'http://localhost/api/character/cashitem-equipment'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('OCID parameter is required');
  });

  it('should return cash item equipment data', async () => {
    const mockData = {
      cash_item_equipment_base: [{ cash_item_name: 'Test' }],
    };
    getCharacterCashItemEquipment.mockResolvedValue(mockData);

    const request = new Request(
      'http://localhost/api/character/cashitem-equipment?ocid=test-ocid'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockData);
  });
});
