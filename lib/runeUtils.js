// Rune utility functions for MapleStory rune system

/**
 * Filters runes by type
 * @param {Array} runes - Array of rune objects from API
 * @param {string} type - 'secret', 'true', or 'luxury'
 * @returns {Array} Filtered runes
 */
export function filterRunesByType(runes, type) {
  const typeMap = {
    secret: '祕法符文',
    true: '真實符文',
    luxury: '豪華真實符文',
  };

  return runes.filter(rune => rune.symbol_name.startsWith(typeMap[type]));
}

/**
 * Calculates upgrade progress for a rune
 * @param {Object} rune - Rune object from API
 * @returns {number} Progress percentage (0-100)
 */
export function calculateRuneProgress(rune) {
  const { symbol_level, symbol_growth_count, symbol_require_growth_count } =
    rune;

  const maxLevel = getMaxLevel(rune);

  if (symbol_level >= maxLevel) {
    return 100;
  }

  // Calculate overall progress across all levels
  const totalLevelIntervals = maxLevel - 1; // Number of level transitions
  const completedIntervals = symbol_level - 1; // Levels already completed
  const currentLevelProgress =
    symbol_growth_count / symbol_require_growth_count;

  // Overall progress = completed intervals + current level progress
  const overallProgress =
    (completedIntervals + currentLevelProgress) / totalLevelIntervals;

  return Math.min(overallProgress * 100, 100);
}

/**
 * Gets the maximum level for a rune type
 * @param {Object} rune - Rune object
 * @returns {number} Max level
 */
export function getMaxLevel(rune) {
  if (rune.symbol_name.startsWith('祕法符文')) {
    return 20;
  } else if (
    rune.symbol_name.startsWith('真實符文') ||
    rune.symbol_name.startsWith('豪華真實符文')
  ) {
    return 11;
  }
  return 20; // default
}

/**
 * Gets the rune type from name
 * @param {Object} rune - Rune object
 * @returns {string} 'secret', 'true', or 'luxury'
 */
export function getRuneType(rune) {
  if (rune.symbol_name.startsWith('祕法符文')) return 'secret';
  if (rune.symbol_name.startsWith('豪華真實符文')) return 'luxury';
  if (rune.symbol_name.startsWith('真實符文')) return 'true';
  return 'unknown';
}
