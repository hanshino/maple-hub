const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export const getCachedData = key => {
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
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
};
