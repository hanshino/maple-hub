import '@testing-library/jest-dom';

// Mock fetch for Node.js environment
import { jest } from '@jest/globals';
global.fetch = jest.fn();

// Mock Response for Next.js API routes
global.Response = class {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = options.headers || {};
  }

  static json(data, options = {}) {
    return new Response(JSON.stringify(data), {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

// Mock ResizeObserver for Recharts
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
