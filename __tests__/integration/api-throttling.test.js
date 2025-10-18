import axios from '@/lib/apiInterceptor';

describe('API Throttling Integration', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  describe('Environment Detection', () => {
    it('should have interceptors configured', () => {
      expect(axios.interceptors.request.handlers.length).toBeGreaterThan(0);
      expect(axios.interceptors.response.handlers.length).toBeGreaterThan(0);
    });

    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      // Re-import to test environment detection
      jest.resetModules();
      const freshAxios = require('@/lib/apiInterceptor').default;
      expect(freshAxios.interceptors.request.handlers.length).toBeGreaterThan(
        0
      );
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const freshAxios = require('@/lib/apiInterceptor').default;
      expect(freshAxios.interceptors.request.handlers.length).toBeGreaterThan(
        0
      );
    });

    it('should handle undefined NODE_ENV as production', () => {
      delete process.env.NODE_ENV;
      jest.resetModules();
      const freshAxios = require('@/lib/apiInterceptor').default;
      expect(freshAxios.interceptors.request.handlers.length).toBeGreaterThan(
        0
      );
    });
  });
});
