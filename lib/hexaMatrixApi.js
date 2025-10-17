import axios from 'axios';

// Nexon MapleStory API configuration
const NEXON_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://open.api.nexon.com';
const API_KEY = process.env.API_KEY;

// Cache key for localStorage
const HEXA_MATRIX_CACHE_KEY = 'hexa_matrix_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch Hexa Matrix data for a character
 * @param {string} ocid - Character OCID
 * @returns {Promise<Object>} Hexa Matrix data
 */
export async function fetchHexaMatrixData(ocid) {
  if (!ocid) {
    throw new Error('Character OCID is required');
  }

  // Check cache first
  const cached = getCachedHexaMatrixData(ocid);
  if (cached) {
    return cached;
  }

  try {
    // Call our local API endpoint instead of Nexon API directly
    const response = await axios.get(`/api/hexa-matrix`, {
      params: { ocid },
      headers: {
        accept: 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Cache the result
    cacheHexaMatrixData(ocid, response.data);

    return response.data;
  } catch (error) {
    if (error.response) {
      // API returned an error
      throw new Error(
        `API Error: ${error.response.status} - ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`
      );
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      throw new Error('Request timeout - please try again');
    } else {
      // Network or other error
      throw new Error('Network error - please check your connection');
    }
  }
}

/**
 * Get cached Hexa Matrix data for a character
 * @param {string} ocid - Character OCID
 * @returns {Object|null} Cached data or null if not found/expired
 */
function getCachedHexaMatrixData(ocid) {
  try {
    const cache = JSON.parse(
      localStorage.getItem(HEXA_MATRIX_CACHE_KEY) || '{}'
    );
    const characterCache = cache[ocid];

    if (!characterCache) return null;

    const now = Date.now();
    if (now - characterCache.timestamp > CACHE_DURATION) {
      // Cache expired, remove it
      delete cache[ocid];
      localStorage.setItem(HEXA_MATRIX_CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    return characterCache.data;
  } catch (error) {
    // If there's any error reading cache, ignore it
    return null;
  }
}

/**
 * Cache Hexa Matrix data for a character
 * @param {string} ocid - Character OCID
 * @param {Object} data - Data to cache
 */
function cacheHexaMatrixData(ocid, data) {
  try {
    const cache = JSON.parse(
      localStorage.getItem(HEXA_MATRIX_CACHE_KEY) || '{}'
    );
    cache[ocid] = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(HEXA_MATRIX_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // If caching fails, silently continue
    console.warn('Failed to cache Hexa Matrix data:', error);
  }
}

/**
 * Clear all cached Hexa Matrix data
 */
export function clearHexaMatrixCache() {
  try {
    localStorage.removeItem(HEXA_MATRIX_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear Hexa Matrix cache:', error);
  }
}
