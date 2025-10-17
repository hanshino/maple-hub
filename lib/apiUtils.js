// API utilities with test delay

// Add 0.2 second delay for testing purposes (will be removed later)
const TEST_DELAY = 200; // milliseconds

export async function fetchWithDelay(url, options = {}) {
  // Add delay before making the request
  await new Promise(resolve => setTimeout(resolve, TEST_DELAY));

  return fetch(url, options);
}

// Wrapper for API calls with consistent delay
export async function apiCall(url, options = {}) {
  return fetchWithDelay(url, options);
}

// Sequential API calls with delay between each call
export async function sequentialApiCalls(urls, options = {}) {
  const results = [];

  for (const url of urls) {
    try {
      const response = await fetchWithDelay(url, options);
      results.push(response);
    } catch (error) {
      results.push(null); // Push null for failed requests
    }
  }

  return results;
}
