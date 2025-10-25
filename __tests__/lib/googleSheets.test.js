import GoogleSheetsClient from '../../lib/googleSheets';

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({
        // mock auth
      })),
    },
    sheets: jest.fn().mockImplementation(() => ({
      spreadsheets: {
        values: {
          get: jest.fn(),
          append: jest.fn(),
        },
      },
    })),
  },
}));

describe('GoogleSheetsClient', () => {
  let client;
  let mockSheets;

  beforeEach(() => {
    // Reset environment variables
    process.env.GOOGLE_SHEETS_PROJECT_ID = 'test-project';
    process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID = 'test-key-id';
    process.env.GOOGLE_SHEETS_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n';
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL = 'test@test.com';
    process.env.GOOGLE_SHEETS_CLIENT_ID = '123456789';
    process.env.GOOGLE_SHEETS_CLIENT_X509_CERT_URL =
      'https://www.googleapis.com/robot/v1/metadata/x509/test%40test.com';
    process.env.SPREADSHEET_ID = 'test-spreadsheet-id';

    client = new GoogleSheetsClient();
    mockSheets = client.sheets.spreadsheets.values;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ocidExists', () => {
    test('should return true if OCID exists in sheet', async () => {
      mockSheets.get.mockResolvedValue({
        data: {
          values: [['1234567890'], ['0987654321']],
        },
      });

      const result = await client.ocidExists('1234567890');

      expect(result).toBe(true);
      expect(mockSheets.get).toHaveBeenCalledWith({
        spreadsheetId: 'test-spreadsheet-id',
        range: 'A:A',
      });
    });

    test('should return false if OCID does not exist in sheet', async () => {
      mockSheets.get.mockResolvedValue({
        data: {
          values: [['1234567890'], ['0987654321']],
        },
      });

      const result = await client.ocidExists('1111111111');

      expect(result).toBe(false);
    });

    test('should return false if sheet is empty', async () => {
      mockSheets.get.mockResolvedValue({
        data: {
          values: [],
        },
      });

      const result = await client.ocidExists('1234567890');

      expect(result).toBe(false);
    });

    test('should return false on API error', async () => {
      mockSheets.get.mockRejectedValue(new Error('API Error'));

      const result = await client.ocidExists('1234567890');

      expect(result).toBe(false);
    });
  });

  describe('appendOcids', () => {
    test('should append OCIDs to sheet', async () => {
      mockSheets.append.mockResolvedValue({});

      await client.appendOcids(['1234567890', '0987654321']);

      expect(mockSheets.append).toHaveBeenCalledWith({
        spreadsheetId: 'test-spreadsheet-id',
        range: 'A:A',
        valueInputOption: 'RAW',
        resource: {
          values: [['1234567890'], ['0987654321']],
        },
      });
    });

    test('should do nothing if ocids array is empty', async () => {
      await client.appendOcids([]);

      expect(mockSheets.append).not.toHaveBeenCalled();
    });
  });
});
