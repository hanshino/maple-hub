// Local storage utilities for character data

const CHARACTERS_KEY = 'game_characters';
const SELECTED_CHARACTER_KEY = 'selected_character';
const HISTORY_KEY = 'characterSearchHistory';
const MAX_HISTORY = 10;

export function saveCharacters(characters) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
  }
}

export function loadCharacters() {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(CHARACTERS_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
}

export function saveSelectedCharacter(characterId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SELECTED_CHARACTER_KEY, characterId);
  }
}

export function loadSelectedCharacter() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SELECTED_CHARACTER_KEY);
  }
  return null;
}

export function clearStoredData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CHARACTERS_KEY);
    localStorage.removeItem(SELECTED_CHARACTER_KEY);
  }
}

// History management functions
export const saveSearchHistory = (characterName, ocid) => {
  if (typeof window === 'undefined') return;

  try {
    const history = getSearchHistory();
    const newEntry = {
      characterName: characterName.trim(),
      ocid,
      timestamp: new Date().toISOString(),
    };

    // Remove existing entry for same character
    const filtered = history.filter(
      item => item.characterName !== characterName
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
