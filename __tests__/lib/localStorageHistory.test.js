import { saveSearchHistory, getSearchHistory } from '../../lib/localStorage';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

describe('localStorage history functions', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Default return value for getItem
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    // Restore original localStorage
    delete window.localStorage;
  });

  describe('saveSearchHistory', () => {
    it('should save search history to localStorage', () => {
      const characterName = 'TestCharacter';
      const ocid = '123456789';

      saveSearchHistory(characterName, ocid);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'characterSearchHistory',
        expect.stringContaining('"characterName":"TestCharacter"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'characterSearchHistory',
        expect.stringContaining('"ocid":"123456789"')
      );
    });

    it('should limit history to 10 items', () => {
      // Mock existing history with 10 items
      const existingHistory = Array.from({ length: 10 }, (_, i) => ({
        characterName: `Char${i}`,
        ocid: `ocid${i}`,
        timestamp: new Date().toISOString(),
      }));
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistory));

      saveSearchHistory('NewChar', 'newOcid');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'characterSearchHistory',
        expect.any(String)
      );
      const callArgs = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(callArgs[1]);
      expect(savedData).toHaveLength(10);
      expect(savedData[0].characterName).toBe('NewChar');
      expect(savedData[0].ocid).toBe('newOcid');
    });

    it('should update existing character entry', () => {
      const existingHistory = [
        {
          characterName: 'TestCharacter',
          ocid: 'oldOcid',
          timestamp: new Date(Date.now() - 1000).toISOString(),
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistory));

      saveSearchHistory('TestCharacter', 'newOcid');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'characterSearchHistory',
        expect.any(String)
      );
      const callArgs = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(callArgs[1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].ocid).toBe('newOcid');
      expect(savedData[0].characterName).toBe('TestCharacter');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => saveSearchHistory('Test', '123')).not.toThrow();
    });
  });

  describe('getSearchHistory', () => {
    it('should return empty array when no history exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getSearchHistory();

      expect(result).toEqual([]);
    });

    it('should return parsed history from localStorage', () => {
      const mockHistory = [
        {
          characterName: 'Test',
          ocid: '123',
          timestamp: new Date().toISOString(),
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const result = getSearchHistory();

      expect(result).toEqual(mockHistory);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = getSearchHistory();

      expect(result).toEqual([]);
    });
  });
});
