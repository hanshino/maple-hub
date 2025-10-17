// Local storage utilities for character data

const CHARACTERS_KEY = 'game_characters';
const SELECTED_CHARACTER_KEY = 'selected_character';

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
