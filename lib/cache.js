const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export const getCachedData = key => {
  // Skip caching on server-side
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
};

export const setCachedData = (key, data) => {
  // Skip caching on server-side
  if (typeof window === 'undefined') return;

  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn('Error writing to cache:', error);
  }
};

export const clearCache = key => {
  // Skip caching on server-side
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
};

// Hexa Stat Core specific cache utilities
const HEXA_STAT_CORE_CACHE_KEY_PREFIX = 'hexa_stat_core_';

export const getHexaStatCoreCache = ocid => {
  const key = `${HEXA_STAT_CORE_CACHE_KEY_PREFIX}${ocid}`;
  return getCachedData(key);
};

export const setHexaStatCoreCache = (ocid, data) => {
  const key = `${HEXA_STAT_CORE_CACHE_KEY_PREFIX}${ocid}`;
  setCachedData(key, data);
};

export const clearHexaStatCoreCache = ocid => {
  const key = `${HEXA_STAT_CORE_CACHE_KEY_PREFIX}${ocid}`;
  clearCache(key);
};

export const clearAllHexaStatCoreCache = () => {
  // Skip caching on server-side
  if (typeof window === 'undefined') return;

  // Clear all hexa stat core cache entries
  try {
    const keys = Object.keys(localStorage).filter(key =>
      key.startsWith(HEXA_STAT_CORE_CACHE_KEY_PREFIX)
    );
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Error clearing all hexa stat core cache:', error);
  }
};
