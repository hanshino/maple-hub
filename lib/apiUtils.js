// API utilities with throttling interceptor

import axios from './apiInterceptor';

// Remove old delay logic - now handled by interceptor
// const TEST_DELAY = 200; // milliseconds

// Wrapper for API calls using throttled axios
export async function apiCall(url, options = {}) {
  try {
    const response = await axios({
      url,
      ...options,
    });
    return response;
  } catch (error) {
    if (axios.isCancel(error)) {
      throw new Error('Request cancelled');
    }
    throw error;
  }
}

// API calls with environment-based execution strategy
// Production: parallel execution for performance
// Development: sequential execution with throttling
export async function batchApiCalls(urls, options = {}) {
  const results = [];

  // In production, use Promise.all for parallel execution
  // In development, use sequential execution to respect rate limits
  if (process.env.NODE_ENV === 'production') {
    const promises = urls.map(url =>
      apiCall(url, options).catch(_error => null)
    );
    results.push(...(await Promise.all(promises)));
  } else {
    // Development: sequential execution with throttling
    for (const url of urls) {
      try {
        const response = await apiCall(url, options);
        results.push(response);
      } catch (_error) {
        results.push(null); // Push null for failed requests
      }
    }
  }

  return results;
}

// Legacy fetch wrapper - deprecated, use apiCall instead
export async function fetchWithDelay(url, options = {}) {
  console.warn('fetchWithDelay is deprecated. Use apiCall instead.');
  return apiCall(url, options);
}
