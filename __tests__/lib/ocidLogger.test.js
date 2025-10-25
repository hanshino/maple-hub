import OcidLogger from '../../lib/ocidLogger';

// Mock GoogleSheetsClient
const mockGoogleSheetsClient = {
  ocidExists: jest.fn(),
};

describe('OcidLogger', () => {
  let logger;

  beforeEach(() => {
    logger = new OcidLogger();
    jest.clearAllMocks();
  });

  test('should initialize with empty set', () => {
    expect(logger.getAllOcids()).toEqual([]);
  });

  test('should add OCID if not exists in Google Sheets and not in local set', async () => {
    mockGoogleSheetsClient.ocidExists.mockResolvedValue(false);

    await logger.logOcid('1234567890', mockGoogleSheetsClient);

    expect(logger.getAllOcids()).toEqual(['1234567890']);
    expect(mockGoogleSheetsClient.ocidExists).toHaveBeenCalledWith(
      '1234567890'
    );
  });

  test('should not add OCID if already exists in Google Sheets', async () => {
    mockGoogleSheetsClient.ocidExists.mockResolvedValue(true);

    await logger.logOcid('1234567890', mockGoogleSheetsClient);

    expect(logger.getAllOcids()).toEqual([]);
    expect(mockGoogleSheetsClient.ocidExists).toHaveBeenCalledWith(
      '1234567890'
    );
  });

  test('should not add duplicate OCID to local set', async () => {
    mockGoogleSheetsClient.ocidExists.mockResolvedValue(false);

    await logger.logOcid('1234567890', mockGoogleSheetsClient);
    await logger.logOcid('1234567890', mockGoogleSheetsClient);

    expect(logger.getAllOcids()).toEqual(['1234567890']);
  });

  test('should clear all OCIDs', async () => {
    mockGoogleSheetsClient.ocidExists.mockResolvedValue(false);

    await logger.logOcid('1234567890', mockGoogleSheetsClient);
    await logger.logOcid('0987654321', mockGoogleSheetsClient);

    expect(logger.getAllOcids()).toEqual(['1234567890', '0987654321']);

    logger.clear();

    expect(logger.getAllOcids()).toEqual([]);
  });
});
