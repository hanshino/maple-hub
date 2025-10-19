import {
  calculateTotalCostUpToLevel,
  getMaxLevelTotalCost,
} from './hexaMatrixData.js';

// Mapping from API core types to cost data keys
const CORE_TYPE_MAPPING = {
  技能核心: 'skill_core',
  強化核心: 'enhancement_core',
  精通核心: 'mastery_core',
  共享核心: 'shared_core',
  共用核心: 'shared_core', // Alternative name for shared core
};

/**
 * Calculate progress for a single Hexa Matrix core
 * @param {Object} core - Core data from API
 * @returns {Object} Progress information
 */
function calculateCoreProgress(core) {
  const level = core.hexa_core_level;
  const coreTypeKey = CORE_TYPE_MAPPING[core.hexa_core_type];

  // Return zero progress for unknown core types
  if (!coreTypeKey) {
    return {
      name: core.hexa_core_name,
      type: core.hexa_core_type,
      level,
      progress: 0,
      spent: { soul_elder: 0, soul_elder_fragment: 0 },
      required: { soul_elder: 0, soul_elder_fragment: 0 },
    };
  }

  const spent = calculateTotalCostUpToLevel(level, coreTypeKey);
  const required = getMaxLevelTotalCost(coreTypeKey);
  const progress =
    required.soul_elder > 0
      ? (spent.soul_elder / required.soul_elder) * 100
      : 0;

  return {
    name: core.hexa_core_name,
    type: core.hexa_core_type,
    level,
    progress: Math.min(progress, 100),
    spent,
    required,
  };
}

/**
 * Calculate overall Hexa Matrix progress
 * @param {Array} cores - Array of core data from API
 * @returns {Object} Overall progress information
 */
export function calculateOverallProgress(cores) {
  if (!cores || cores.length === 0) {
    return {
      totalProgress: 0,
      totalSpent: { soul_elder: 0, soul_elder_fragment: 0 },
      totalRequired: { soul_elder: 0, soul_elder_fragment: 0 },
      coreProgress: [],
    };
  }

  let totalSpentSoulElder = 0;
  let totalSpentSoulElderFragment = 0;
  let totalRequiredSoulElder = 0;
  let totalRequiredSoulElderFragment = 0;
  const coreProgress = [];

  cores.forEach(core => {
    const progress = calculateCoreProgress(core);
    coreProgress.push({
      name: core.hexa_core_name,
      type: core.hexa_core_type,
      ...progress,
    });

    totalSpentSoulElder += progress.spent.soul_elder;
    totalSpentSoulElderFragment += progress.spent.soul_elder_fragment;
    totalRequiredSoulElder += progress.required.soul_elder;
    totalRequiredSoulElderFragment += progress.required.soul_elder_fragment;
  });

  const totalProgress =
    totalRequiredSoulElder > 0
      ? (totalSpentSoulElder / totalRequiredSoulElder) * 100
      : 0;

  return {
    totalProgress: Math.min(totalProgress, 100),
    totalSpent: {
      soul_elder: totalSpentSoulElder,
      soul_elder_fragment: totalSpentSoulElderFragment,
    },
    totalRequired: {
      soul_elder: totalRequiredSoulElder,
      soul_elder_fragment: totalRequiredSoulElderFragment,
    },
    coreProgress,
  };
}

/**
 * Format resource amounts for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted string
 */
export function formatResourceAmount(amount) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
}

/**
 * Format progress percentage for display
 * @param {number} progress - Progress percentage
 * @returns {string} Formatted string
 */
export function formatProgress(progress) {
  return `${progress.toFixed(1)}%`;
}

export { calculateCoreProgress };

/**
 * Filter hexa core skills to remove irrelevant data for current class
 * @param {Array} hexaCoreData - Array of hexa core data from API
 * @returns {Array} Filtered array of hexa core data
 */
export function filterHexaCoreSkills(hexaCoreData) {
  if (!hexaCoreData || !Array.isArray(hexaCoreData)) {
    return [];
  }

  const masteryCount = hexaCoreData.filter(
    c => c.hexa_core_type === '精通核心'
  ).length;
  const enhanceCount = hexaCoreData.filter(
    c => c.hexa_core_type === '強化核心'
  ).length;

  // Special case: cross-class data detected (more than 4 cores of same type)
  if (masteryCount > 4 || enhanceCount > 4) {
    return hexaCoreData.filter(c => c.hexa_core_level > 0);
  }

  // Normal case: all data is valid
  return hexaCoreData;
}

/**
 * Calculate overall progress with automatic filtering
 * @param {Array} cores - Raw core data from API
 * @returns {Object} Filtered progress information
 */
export function calculateFilteredOverallProgress(cores) {
  const filteredCores = filterHexaCoreSkills(cores);
  return calculateOverallProgress(filteredCores);
}
