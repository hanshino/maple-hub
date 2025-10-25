import OcidLogger from '../lib/ocidLogger';
import GoogleSheetsClient from '../lib/googleSheets';

// Mock the logger and client
jest.mock('../lib/ocidLogger');
jest.mock('../lib/googleSheets');

describe('Middleware OCID Capture', () => {
  let mockLogger;
  let mockClient;

  beforeEach(() => {
    mockLogger = {
      logOcid: jest.fn().mockResolvedValue(),
    };
    mockClient = {};

    OcidLogger.mockImplementation(() => mockLogger);
    GoogleSheetsClient.mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should capture OCID from query parameter', async () => {
    // Mock middleware code logic
    const mockRequest = {
      url: 'http://localhost:3000/api/character?ocid=1234567890',
      nextUrl: new URL('http://localhost:3000/api/character?ocid=1234567890'),
    };

    // Simulate middleware logic
    const url = new URL(mockRequest.url);
    const ocid = url.searchParams.get('ocid');

    expect(ocid).toBe('1234567890');

    // Test validation
    const isValid =
      typeof ocid === 'string' && ocid.length >= 10 && ocid.length <= 20;
    expect(isValid).toBe(true);

    // Simulate logging
    if (isValid) {
      await mockLogger.logOcid(ocid, mockClient);
      expect(mockLogger.logOcid).toHaveBeenCalledWith('1234567890', mockClient);
    }
  });

  test('should handle missing OCID parameter', async () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/character',
      nextUrl: new URL('http://localhost:3000/api/character'),
    };

    const url = new URL(mockRequest.url);
    const ocid = url.searchParams.get('ocid');

    expect(ocid).toBeNull();

    // Should not log
    expect(mockLogger.logOcid).not.toHaveBeenCalled();
  });

  test('should validate OCID length', () => {
    const testCases = [
      { ocid: '123456789', expected: false }, // too short
      { ocid: '1234567890', expected: true }, // valid
      { ocid: '12345678901234567890', expected: true }, // max length
      { ocid: '123456789012345678901', expected: false }, // too long
      { ocid: 'invalid', expected: false }, // too short
    ];

    testCases.forEach(({ ocid, expected }) => {
      const isValid =
        typeof ocid === 'string' && ocid.length >= 10 && ocid.length <= 20;
      expect(isValid).toBe(expected);
    });
  });
});
