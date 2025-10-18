// API Interceptor for request throttling
// This file implements delay logic for API calls in development environment

import axios from 'axios';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';

// Delay utility function with cancellation support
const delay = (ms, signal) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Request cancelled'));
      });
    }
  });
};

// Request interceptor
axios.interceptors.request.use(async config => {
  if (isDevelopment) {
    try {
      await delay(200, config.signal); // Minimum 0.2 second delay, cancellable
    } catch (error) {
      if (error.message === 'Request cancelled') {
        // Create a cancelled error that axios recognizes
        const cancelError = new Error('Request cancelled');
        cancelError.name = 'AbortError';
        throw cancelError;
      }
      throw error;
    }
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
