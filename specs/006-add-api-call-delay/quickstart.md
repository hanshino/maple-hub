# Quickstart: Add API Call Delay

**Feature**: Add API Call Delay  
**Date**: 2025-10-18

## Implementation Overview

This feature adds a 0.2 second delay to all API calls in development environment to comply with the 5 requests/second rate limit, while maintaining no delay in production.

## Prerequisites

- Next.js 14+ application
- Axios for API calls
- NODE_ENV environment variable configured

## Implementation Steps

### 1. Create API Interceptor

Create `lib/apiInterceptor.js`:

```javascript
import axios from 'axios';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';

// Delay utility
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor
axios.interceptors.request.use(async config => {
  if (isDevelopment) {
    // Add minimum 0.2s delay
    await delay(200);
  }
  return config;
});

// Response interceptor (optional, for logging)
axios.interceptors.response.use(
  response => response,
  error => {
    // Handle errors if needed
    return Promise.reject(error);
  }
);

export default axios;
```

### 2. Update API Calls

Replace direct axios imports with the interceptor:

```javascript
// Before
import axios from 'axios';

// After
import axios from '@/lib/apiInterceptor';
```

### 3. Handle Request Cancellation

For cancellable delays, use AbortController:

```javascript
// In component
const controller = new AbortController();

const fetchData = async () => {
  try {
    const response = await axios.get('/api/data', {
      signal: controller.signal,
    });
    // Handle response
  } catch (error) {
    if (axios.isCancel(error)) {
      // Request was cancelled
    }
  }
};

// Cancel on unmount or user action
controller.abort();
```

## Testing

### Unit Tests

```javascript
// __tests__/apiInterceptor.test.js
import axios from '@/lib/apiInterceptor';

jest.mock('axios', () => ({
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
}));

describe('API Interceptor', () => {
  it('adds delay in development', async () => {
    process.env.NODE_ENV = 'development';
    const start = Date.now();
    await axios.get('/test');
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(200);
  });

  it('no delay in production', async () => {
    process.env.NODE_ENV = 'production';
    const start = Date.now();
    await axios.get('/test');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(50); // Allow small overhead
  });
});
```

## Deployment

- Development: Delay applied (5 req/s effective limit)
- Production: No delay (full 500 req/s available)

## Troubleshooting

- If delay not working: Check NODE_ENV value
- If requests timing out: Ensure delay is cancellable
- Rate limit errors: Verify delay duration matches API limits
