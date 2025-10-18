// API error handling utilities

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export function handleApiError(error) {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    console.error(`API Error ${status}:`, data);
    return new ApiError(`API request failed: ${status}`, status, data);
  } else if (error.request) {
    // Network error
    console.error('Network error:', error.message);
    return new ApiError(
      'Network error - please check your connection',
      0,
      null
    );
  } else {
    // Other error
    console.error('Request error:', error.message);
    return new ApiError(`Request failed: ${error.message}`, 0, null);
  }
}
