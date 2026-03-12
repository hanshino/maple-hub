// Local storage utilities for search history

const STORAGE_VERSION_KEY = 'app_storage_version';
const CURRENT_VERSION = '2';
const HISTORY_KEY = 'characterSearchHistory';
const MAX_HISTORY = 10;

export const migrateStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (storedVersion === CURRENT_VERSION) return;

    // Clear everything and start fresh
    localStorage.clear();

    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
  } catch (error) {
    console.warn('Failed to migrate storage:', error);
  }
};

export const saveSearchHistory = character => {
  if (typeof window === 'undefined') return;

  try {
    const history = getSearchHistory();
    const newEntry = {
      characterName: character.character_name,
      ocid: character.ocid,
      characterImage: character.character_image || null,
      characterClass: character.character_class || null,
      characterLevel: character.character_level || null,
      worldName: character.world_name || null,
      timestamp: new Date().toISOString(),
    };

    // Remove existing entry for same character
    const filtered = history.filter(
      item => item.characterName !== character.character_name
    );
    filtered.unshift(newEntry);

    // Limit to max items
    const limited = filtered.slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    console.warn('Failed to save search history:', error);
  }
};

export const getSearchHistory = () => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load search history:', error);
    return [];
  }
};
