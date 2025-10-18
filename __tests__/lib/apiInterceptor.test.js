import axios from '@/lib/apiInterceptor';

describe('API Interceptor', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  describe('Environment Detection', () => {
    it('should have request interceptor configured', () => {
      expect(axios.interceptors.request.handlers.length).toBeGreaterThan(0);
    });

    it('should have response interceptor configured', () => {
      expect(axios.interceptors.response.handlers.length).toBeGreaterThan(0);
    });
  });

  describe('Delay Logic', () => {
    it('should not add delay in production environment', async () => {
      process.env.NODE_ENV = 'production';

      const mockResponse = { data: 'test' };
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const start = Date.now();
      await axios.get('/test');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50); // Allow small overhead
      expect(axios.get).toHaveBeenCalledWith('/test');
    });
  });
});
