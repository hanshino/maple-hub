// Mock NextRequest
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url) {
      this.url = url;
    }
  },
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

jest.mock('../../lib/googleSheets');
jest.mock('../../lib/sharedLogger', () => ({
  ocidLogger: {
    getAllOcids: jest.fn(),
    clear: jest.fn(),
  },
}));

import { POST } from '../../app/api/sync-ocids/route';
import { NextRequest } from 'next/server';
import GoogleSheetsClient from '../../lib/googleSheets';
import { ocidLogger } from '../../lib/sharedLogger';

describe('Sync OCIDs API', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      appendOcids: jest.fn().mockResolvedValue(),
    };
    GoogleSheetsClient.mockImplementation(() => mockClient);

    ocidLogger.getAllOcids.mockReturnValue(['1234567890', '0987654321']);
    ocidLogger.clear.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should sync OCIDs successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/sync-ocids', {
      method: 'POST',
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual({
      success: true,
      syncedCount: 2,
      errors: [],
    });

    expect(mockClient.appendOcids).toHaveBeenCalledWith([
      '1234567890',
      '0987654321',
    ]);
    expect(ocidLogger.clear).toHaveBeenCalled();
  });

  test('should handle sync failure', async () => {
    mockClient.appendOcids.mockRejectedValue(
      new Error('Google Sheets API error')
    );

    const request = new NextRequest('http://localhost:3000/api/sync-ocids', {
      method: 'POST',
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result).toEqual({
      success: false,
      error: 'Google Sheets API error',
      syncedCount: 0,
    });

    expect(ocidLogger.clear).not.toHaveBeenCalled();
  });

  test('should handle empty OCID list', async () => {
    ocidLogger.getAllOcids.mockReturnValue([]);

    const request = new NextRequest('http://localhost:3000/api/sync-ocids', {
      method: 'POST',
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual({
      success: true,
      syncedCount: 0,
      errors: [],
    });

    expect(mockClient.appendOcids).toHaveBeenCalledWith([]);
    expect(ocidLogger.clear).toHaveBeenCalled();
  });
});
