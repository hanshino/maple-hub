// Progress calculation utilities

export function calculateProgressPercentage(character) {
  return parseFloat(character.character_exp_rate || 0);
}

export function calculateEstimatedTimeToLevel(
  remainingPercentage,
  expRatePerHour = 5,
  historicalData = null
) {
  if (remainingPercentage <= 0) return 0;

  // 如果有歷史數據，使用平均每日成長率計算
  if (historicalData && historicalData.length >= 2) {
    const sortedData = historicalData
      .filter(item => item && typeof item.progress === 'number')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedData.length >= 2) {
      const firstData = sortedData[0];
      const lastData = sortedData[sortedData.length - 1];
      const daysDiff = Math.max(
        1,
        (new Date(lastData.date) - new Date(firstData.date)) /
          (1000 * 60 * 60 * 24)
      );
      const totalProgressGain = lastData.progress - firstData.progress;
      const dailyGrowthRate = totalProgressGain / daysDiff;

      if (dailyGrowthRate > 0) {
        // 計算達到100%所需的天數
        const daysNeeded = remainingPercentage / dailyGrowthRate;
        return daysNeeded * 24; // 轉換為小時
      }
    }
  }

  // 回退到舊邏輯：假設每小時固定獲得expRatePerHour%的經驗值
  return remainingPercentage / expRatePerHour;
}

export function formatTime(hours) {
  if (hours < 1) {
    return `${Math.round(hours * 60)} 分鐘`;
  } else if (hours < 24) {
    return `${hours.toFixed(1)} 小時`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} 天 ${remainingHours.toFixed(1)} 小時`;
  }
}

export function generateDateRange(days = 5) {
  const dateConfigs = [];
  const today = new Date();
  // Use local date instead of UTC to avoid timezone issues
  const todayString =
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0');
  const minDate = new Date(2025, 9, 14); // October 14, 2025 (month is 0-based, local date)

  // Generate dates for the last 'days' days, but not before minDate
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    // Use local date components
    const dateString =
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0');

    // Only include dates that are on or after minDate
    if (date >= minDate) {
      dateConfigs.push({
        date: dateString,
        needsDateParam: dateString !== todayString, // Don't specify date param for today
      });
    }
  }

  return dateConfigs;
}

// SearchHistory validation utilities
export const validateSearchHistoryEntry = entry => {
  if (!entry || typeof entry !== 'object') return false;

  const { characterName, ocid, timestamp } = entry;

  // characterName: non-empty string, max 50 chars
  if (
    !characterName ||
    typeof characterName !== 'string' ||
    characterName.trim().length === 0 ||
    characterName.length > 50
  ) {
    return false;
  }

  // ocid: non-empty string
  if (!ocid || typeof ocid !== 'string' || ocid.trim().length === 0) {
    return false;
  }

  // timestamp: valid ISO string, not in future
  if (!timestamp || typeof timestamp !== 'string') return false;
  const ts = new Date(timestamp);
  if (isNaN(ts.getTime()) || ts > new Date()) return false;

  return true;
};

export const validateSearchHistory = history => {
  if (!Array.isArray(history)) return false;
  if (history.length > 10) return false; // max 10 items

  // All entries must be valid
  return history.every(validateSearchHistoryEntry);
};

/**
 * Calculate progress for hexa stat cores
 * @param {Array} statCores - Array of stat core data
 * @returns {Object} Progress information for stat cores
 */
export function calculateStatCoreProgress(statCores) {
  if (!statCores || !Array.isArray(statCores)) {
    return {
      activatedCount: 0,
      totalAvailable: 0,
      materialUsed: { soulElda: 0, soulEldaFragments: 0 },
      averageGrade: 0,
    };
  }

  const activatedCores = statCores.filter(c => c.stat_grade > 0);

  let materialUsed = {
    soulElda: 0,
    soulEldaFragments: 0,
  };

  statCores.forEach((core, index) => {
    if (core.stat_grade === 0) {
      // Unactivated: add activation cost based on core tier
      // Assume cores are ordered by tier (I, II, III, etc.)
      const costs = [
        { elda: 5, fragments: 10 }, // Core I
        { elda: 10, fragments: 200 }, // Core II
        { elda: 15, fragments: 350 }, // Core III
        { elda: 20, fragments: 500 }, // Core IV (if exists)
        { elda: 25, fragments: 700 }, // Core V (if exists)
      ];
      materialUsed.soulElda +=
        costs[index]?.elda || costs[costs.length - 1].elda;
      materialUsed.soulEldaFragments +=
        costs[index]?.fragments || costs[costs.length - 1].fragments;
    } else if (core.stat_grade === 20) {
      // Fully maxed: calculate actual usage based on upgrade costs
      materialUsed.soulEldaFragments += calculateUpgradeCosts(core);
    }
    // Partial activations: deferred (stat_grade between 1-19)
  });

  return {
    activatedCount: activatedCores.length,
    totalAvailable: statCores.length,
    materialUsed,
    averageGrade:
      activatedCores.length > 0
        ? activatedCores.reduce((sum, c) => sum + c.stat_grade, 0) /
          activatedCores.length
        : 0,
  };
}

/**
 * Calculate upgrade costs for a fully maxed stat core
 * @param {Object} core - Stat core data
 * @returns {number} Total fragments used for upgrades
 */
function calculateUpgradeCosts(core) {
  // Simplified calculation based on research.md table
  // This is a placeholder - actual implementation would need detailed cost tracking
  // For now, estimate based on typical upgrade patterns
  let totalFragments = 0;

  // Activation cost already included above
  // Add upgrade costs for levels 1-9 based on the table
  // Level 0-2: 10 fragments each (30 total)
  // Level 3-6: 20 fragments each (80 total)
  // Level 7-8: 30 fragments each (60 total)
  // Level 9: 50 fragments (50 total)
  // Total upgrade cost: 30 + 80 + 60 + 50 = 220 fragments

  // This is a rough estimate - actual implementation would track per-level costs
  return 220; // Placeholder value
}

// Hexa Matrix cost data
const HEXA_MATRIX_LEVEL_COSTS = [
  {
    level: 1,
    skill_core: { soul_elder: 0, soul_elder_fragment: 0 },
    mastery_core: { soul_elder: 3, soul_elder_fragment: 50 },
    enhancement_core: { soul_elder: 4, soul_elder_fragment: 75 },
    shared_core: { soul_elder: 7, soul_elder_fragment: 125 },
  },
  {
    level: 2,
    skill_core: { soul_elder: 1, soul_elder_fragment: 30 },
    mastery_core: { soul_elder: 1, soul_elder_fragment: 15 },
    enhancement_core: { soul_elder: 1, soul_elder_fragment: 23 },
    shared_core: { soul_elder: 2, soul_elder_fragment: 38 },
  },
  {
    level: 3,
    skill_core: { soul_elder: 1, soul_elder_fragment: 35 },
    mastery_core: { soul_elder: 1, soul_elder_fragment: 18 },
    enhancement_core: { soul_elder: 1, soul_elder_fragment: 27 },
    shared_core: { soul_elder: 2, soul_elder_fragment: 44 },
  },
  {
    level: 4,
    skill_core: { soul_elder: 1, soul_elder_fragment: 40 },
    mastery_core: { soul_elder: 1, soul_elder_fragment: 20 },
    enhancement_core: { soul_elder: 1, soul_elder_fragment: 30 },
    shared_core: { soul_elder: 2, soul_elder_fragment: 50 },
  },
  {
    level: 5,
    skill_core: { soul_elder: 2, soul_elder_fragment: 45 },
    mastery_core: { soul_elder: 1, soul_elder_fragment: 23 },
    enhancement_core: { soul_elder: 2, soul_elder_fragment: 34 },
    shared_core: { soul_elder: 3, soul_elder_fragment: 57 },
  },
  {
    level: 6,
    skill_core: { soul_elder: 2, soul_elder_fragment: 50 },
    mastery_core: { soul_elder: 1, soul_elder_fragment: 25 },
    enhancement_core: { soul_elder: 2, soul_elder_fragment: 38 },
    shared_core: { soul_elder: 3, soul_elder_fragment: 63 },
  },
  {
    level: 7,
    skill_core: { soul_elder: 2, soul_elder_fragment: 55 },
    mastery_core: { soul_elder: 1, soul_elder_fragment: 28 },
    enhancement_core: { soul_elder: 2, soul_elder_fragment: 42 },
    shared_core: { soul_elder: 3, soul_elder_fragment: 69 },
  },
  {
    level: 8,
    skill_core: { soul_elder: 3, soul_elder_fragment: 60 },
    mastery_core: { soul_elder: 2, soul_elder_fragment: 30 },
    enhancement_core: { soul_elder: 3, soul_elder_fragment: 45 },
    shared_core: { soul_elder: 5, soul_elder_fragment: 75 },
  },
  {
    level: 9,
    skill_core: { soul_elder: 3, soul_elder_fragment: 65 },
    mastery_core: { soul_elder: 2, soul_elder_fragment: 33 },
    enhancement_core: { soul_elder: 3, soul_elder_fragment: 49 },
    shared_core: { soul_elder: 5, soul_elder_fragment: 82 },
  },
  {
    level: 10,
    skill_core: { soul_elder: 10, soul_elder_fragment: 200 },
    mastery_core: { soul_elder: 5, soul_elder_fragment: 100 },
    enhancement_core: { soul_elder: 8, soul_elder_fragment: 150 },
    shared_core: { soul_elder: 14, soul_elder_fragment: 300 },
  },
  {
    level: 11,
    skill_core: { soul_elder: 3, soul_elder_fragment: 80 },
    mastery_core: { soul_elder: 2, soul_elder_fragment: 40 },
    enhancement_core: { soul_elder: 3, soul_elder_fragment: 60 },
    shared_core: { soul_elder: 5, soul_elder_fragment: 110 },
  },
  {
    level: 12,
    skill_core: { soul_elder: 3, soul_elder_fragment: 90 },
    mastery_core: { soul_elder: 2, soul_elder_fragment: 45 },
    enhancement_core: { soul_elder: 3, soul_elder_fragment: 68 },
    shared_core: { soul_elder: 5, soul_elder_fragment: 124 },
  },
  {
    level: 13,
    skill_core: { soul_elder: 4, soul_elder_fragment: 100 },
    mastery_core: { soul_elder: 2, soul_elder_fragment: 50 },
    enhancement_core: { soul_elder: 3, soul_elder_fragment: 75 },
    shared_core: { soul_elder: 6, soul_elder_fragment: 138 },
  },
  {
    level: 14,
    skill_core: { soul_elder: 4, soul_elder_fragment: 110 },
    mastery_core: { soul_elder: 2, soul_elder_fragment: 55 },
    enhancement_core: { soul_elder: 3, soul_elder_fragment: 83 },
    shared_core: { soul_elder: 6, soul_elder_fragment: 152 },
  },
  {
    level: 15,
    skill_core: { soul_elder: 4, soul_elder_fragment: 120 },
    mastery_core: { soul_elder: 2, soul_elder_fragment: 60 },
    enhancement_core: { soul_elder: 3, soul_elder_fragment: 90 },
    shared_core: { soul_elder: 6, soul_elder_fragment: 165 },
  },
  {
    level: 16,
    skill_core: { soul_elder: 4, soul_elder_fragment: 130 },
    mastery_core: { soul_elder: 2, soul_elder_fragment: 65 },
    enhancement_core: { soul_elder: 3, soul_elder_fragment: 98 },
    shared_core: { soul_elder: 6, soul_elder_fragment: 179 },
  },
  {
    level: 17,
    skill_core: { soul_elder: 4, soul_elder_fragment: 140 },
    mastery_core: { soul_elder: 2, soul_elder_fragment: 70 },
    enhancement_core: { soul_elder: 3, soul_elder_fragment: 105 },
    shared_core: { soul_elder: 6, soul_elder_fragment: 193 },
  },
  {
    level: 18,
    skill_core: { soul_elder: 4, soul_elder_fragment: 150 },
    mastery_core: { soul_elder: 2, soul_elder_fragment: 75 },
    enhancement_core: { soul_elder: 3, soul_elder_fragment: 113 },
    shared_core: { soul_elder: 6, soul_elder_fragment: 207 },
  },
  {
    level: 19,
    skill_core: { soul_elder: 5, soul_elder_fragment: 160 },
    mastery_core: { soul_elder: 3, soul_elder_fragment: 80 },
    enhancement_core: { soul_elder: 4, soul_elder_fragment: 120 },
    shared_core: { soul_elder: 7, soul_elder_fragment: 220 },
  },
  {
    level: 20,
    skill_core: { soul_elder: 15, soul_elder_fragment: 350 },
    mastery_core: { soul_elder: 8, soul_elder_fragment: 175 },
    enhancement_core: { soul_elder: 12, soul_elder_fragment: 263 },
    shared_core: { soul_elder: 17, soul_elder_fragment: 525 },
  },
  {
    level: 21,
    skill_core: { soul_elder: 5, soul_elder_fragment: 170 },
    mastery_core: { soul_elder: 3, soul_elder_fragment: 85 },
    enhancement_core: { soul_elder: 4, soul_elder_fragment: 128 },
    shared_core: { soul_elder: 7, soul_elder_fragment: 234 },
  },
  {
    level: 22,
    skill_core: { soul_elder: 5, soul_elder_fragment: 180 },
    mastery_core: { soul_elder: 3, soul_elder_fragment: 90 },
    enhancement_core: { soul_elder: 4, soul_elder_fragment: 135 },
    shared_core: { soul_elder: 7, soul_elder_fragment: 248 },
  },
  {
    level: 23,
    skill_core: { soul_elder: 5, soul_elder_fragment: 190 },
    mastery_core: { soul_elder: 3, soul_elder_fragment: 95 },
    enhancement_core: { soul_elder: 4, soul_elder_fragment: 143 },
    shared_core: { soul_elder: 7, soul_elder_fragment: 262 },
  },
  {
    level: 24,
    skill_core: { soul_elder: 5, soul_elder_fragment: 200 },
    mastery_core: { soul_elder: 3, soul_elder_fragment: 100 },
    enhancement_core: { soul_elder: 4, soul_elder_fragment: 150 },
    shared_core: { soul_elder: 7, soul_elder_fragment: 275 },
  },
  {
    level: 25,
    skill_core: { soul_elder: 5, soul_elder_fragment: 210 },
    mastery_core: { soul_elder: 3, soul_elder_fragment: 105 },
    enhancement_core: { soul_elder: 4, soul_elder_fragment: 158 },
    shared_core: { soul_elder: 7, soul_elder_fragment: 289 },
  },
  {
    level: 26,
    skill_core: { soul_elder: 6, soul_elder_fragment: 220 },
    mastery_core: { soul_elder: 3, soul_elder_fragment: 110 },
    enhancement_core: { soul_elder: 5, soul_elder_fragment: 165 },
    shared_core: { soul_elder: 9, soul_elder_fragment: 303 },
  },
  {
    level: 27,
    skill_core: { soul_elder: 6, soul_elder_fragment: 230 },
    mastery_core: { soul_elder: 3, soul_elder_fragment: 115 },
    enhancement_core: { soul_elder: 5, soul_elder_fragment: 173 },
    shared_core: { soul_elder: 9, soul_elder_fragment: 317 },
  },
  {
    level: 28,
    skill_core: { soul_elder: 6, soul_elder_fragment: 240 },
    mastery_core: { soul_elder: 3, soul_elder_fragment: 120 },
    enhancement_core: { soul_elder: 5, soul_elder_fragment: 180 },
    shared_core: { soul_elder: 9, soul_elder_fragment: 330 },
  },
  {
    level: 29,
    skill_core: { soul_elder: 7, soul_elder_fragment: 250 },
    mastery_core: { soul_elder: 4, soul_elder_fragment: 125 },
    enhancement_core: { soul_elder: 6, soul_elder_fragment: 188 },
    shared_core: { soul_elder: 10, soul_elder_fragment: 344 },
  },
  {
    level: 30,
    skill_core: { soul_elder: 20, soul_elder_fragment: 500 },
    mastery_core: { soul_elder: 10, soul_elder_fragment: 250 },
    enhancement_core: { soul_elder: 15, soul_elder_fragment: 375 },
    shared_core: { soul_elder: 20, soul_elder_fragment: 750 },
  },
];

// Stat core upgrade costs based on the provided information
const STAT_CORE_UPGRADE_COSTS = [
  { level: 0, fragments: 10 }, // 0-2 levels: 10 fragments each
  { level: 1, fragments: 10 },
  { level: 2, fragments: 10 },
  { level: 3, fragments: 20 }, // 3-6 levels: 20 fragments each
  { level: 4, fragments: 20 },
  { level: 5, fragments: 20 },
  { level: 6, fragments: 20 },
  { level: 7, fragments: 30 }, // 7-8 levels: 30 fragments each
  { level: 8, fragments: 30 },
  { level: 9, fragments: 50 }, // 9 level: 50 fragments
];

// Stat core activation costs
const STAT_CORE_ACTIVATION_COSTS = [
  { tier: 1, soul_elder: 5, fragments: 10 }, // Core I
  { tier: 2, soul_elder: 10, fragments: 200 }, // Core II
  { tier: 3, soul_elder: 15, fragments: 350 }, // Core III
];

// Mapping from API core types to cost data keys
const CORE_TYPE_MAPPING = {
  技能核心: 'skill_core',
  強化核心: 'enhancement_core',
  精通核心: 'mastery_core',
  共享核心: 'shared_core',
  共用核心: 'shared_core',
};

/**
 * Calculate maximum requirements for all available cores
 * Based on: 1 skill core, 1 shared core, 4 mastery cores, 4 enhancement cores, 3 stat cores
 * @returns {Object} Maximum requirements for soul elder and fragments
 */
function calculateMaxRequirements() {
  // Based on user's clarification: equipment cores 33208 + stat activation 560 = 33768
  // Equipment breakdown: 4400 (skill) + 6268 (shared) + 2252*4 (mastery) + 3383*4 (enhancement)
  return {
    soul_elder: 1207, // Approximate
    soul_elder_fragment: 33768, // Exact total as specified by user
  };
}

/**
 * Calculate overall hexa matrix progress including equipment cores and stat cores
 * @param {Object} hexaData - Hexa matrix data from API
 * @returns {Object} Overall progress information
 */
export function calculateHexaMatrixProgress(hexaData) {
  if (!hexaData) {
    return {
      totalProgress: 0,
      totalSpent: { soul_elder: 0, soul_elder_fragment: 0 },
      totalRequired: { soul_elder: 0, soul_elder_fragment: 0 },
      equipmentCores: [],
      statCoresCount: 0,
      statCoreCosts: { soul_elder: 0, soul_elder_fragment: 0 },
    };
  }

  const cores = hexaData.character_hexa_core_equipment || [];

  // Only count unique stat core slots - assume each stat_core_X represents a different slot
  const statCoreArrays = [
    hexaData.character_hexa_stat_core || [],
    hexaData.character_hexa_stat_core_2 || [],
    hexaData.character_hexa_stat_core_3 || [],
  ].filter(arr => arr.length > 0); // Only count non-empty arrays

  const statCoresCount = statCoreArrays.length; // Number of activated slots
  const statCores = statCoreArrays.flat(); // All cores from activated slots

  let totalSpentSoulElder = 0;
  let totalSpentSoulElderFragment = 0;
  let totalRequiredSoulElder = 0;
  let totalRequiredSoulElderFragment = 0;
  const coreProgress = [];

  // Calculate equipment core progress
  cores.forEach(core => {
    const progress = calculateEquipmentCoreProgress(core);
    coreProgress.push(progress);

    totalSpentSoulElder += progress.spent.soul_elder;
    totalSpentSoulElderFragment += progress.spent.soul_elder_fragment;
    totalRequiredSoulElder += progress.required.soul_elder;
    totalRequiredSoulElderFragment += progress.required.soul_elder_fragment;
  });

  // Calculate stat core costs - count actually activated cores (stat_grade > 0)
  const statCoreCosts = calculateStatCoreCosts(statCores);
  totalSpentSoulElder += statCoreCosts.soul_elder;
  totalSpentSoulElderFragment += statCoreCosts.soul_elder_fragment;

  // Add stat core requirements to total required (only activation costs)
  totalRequiredSoulElder += statCoreCosts.soul_elder;
  totalRequiredSoulElderFragment += statCoreCosts.soul_elder_fragment;

  // Calculate progress based on fragments across all cores (equipment + stat)
  // Progress = (total fragments spent on equipment + stat cores) / (total available fragments) * 100
  const totalProgress =
    totalRequiredSoulElderFragment > 0
      ? (totalSpentSoulElderFragment / totalRequiredSoulElderFragment) * 100
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
    equipmentCores: coreProgress,
    statCoresCount: statCoresCount,
    statCoreCosts,
  };
}

/**
 * Calculate progress for a single equipment core
 * @param {Object} core - Equipment core data
 * @returns {Object} Progress information for the core
 */
function calculateEquipmentCoreProgress(core) {
  const level = core.hexa_core_level;
  const coreTypeKey = CORE_TYPE_MAPPING[core.hexa_core_type];

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
    required.soul_elder_fragment > 0
      ? (spent.soul_elder_fragment / required.soul_elder_fragment) * 100
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
 * Calculate total cost up to a level
 * @param {number} level - Target level
 * @param {string} coreType - Core type key
 * @returns {Object} Total cost up to the level
 */
export function calculateTotalCostUpToLevel(level, coreType) {
  let totalSoulElder = 0;
  let totalSoulElderFragment = 0;

  for (let i = 1; i <= level; i++) {
    const costData = HEXA_MATRIX_LEVEL_COSTS.find(cost => cost.level === i);
    if (costData && costData[coreType]) {
      totalSoulElder += costData[coreType].soul_elder;
      totalSoulElderFragment += costData[coreType].soul_elder_fragment;
    }
  }

  return {
    soul_elder: totalSoulElder,
    soul_elder_fragment: totalSoulElderFragment,
  };
}

/**
 * Get total cost for max level (varies by core type)
 * @param {string} coreType - Core type key
 * @returns {Object} Total cost for max level
 */
function getMaxLevelTotalCost(coreType) {
  // All core types can reach level 30 according to user's table
  const maxLevel = 30;
  return calculateTotalCostUpToLevel(maxLevel, coreType);
}

/**
 * Calculate stat core costs - only activation costs for actually activated cores
 * @param {Array} allStatCores - All stat cores from all slots
 * @returns {Object} Total costs for stat cores (only activation)
 */
function calculateStatCoreCosts(allStatCores) {
  let totalSoulElder = 0;
  let totalSoulElderFragment = 0;

  // Count actually activated cores (stat_grade > 0)
  const activatedCores = allStatCores.filter(core => core.stat_grade > 0);

  // Calculate activation costs for each activated core based on tier
  activatedCores.forEach((core, index) => {
    // Activation cost based on core tier (index in activated cores)
    const activationCost =
      STAT_CORE_ACTIVATION_COSTS[index] ||
      STAT_CORE_ACTIVATION_COSTS[STAT_CORE_ACTIVATION_COSTS.length - 1];
    totalSoulElder += activationCost.soul_elder;
    totalSoulElderFragment += activationCost.fragments;
  });

  // Stat cores do not have upgrade costs - only activation costs
  return {
    soul_elder: totalSoulElder,
    soul_elder_fragment: totalSoulElderFragment,
  };
}

/**
 * Calculate upgrade cost for a stat core up to given level
 * @param {number} level - Current level of the stat core
 * @returns {number} Total fragment cost for upgrades
 */
export function calculateStatCoreUpgradeCost(level) {
  let totalCost = 0;

  // Cap stat cores at level 20 as per user clarification
  const effectiveLevel = Math.min(level, 20);

  for (let i = 0; i < effectiveLevel; i++) {
    const costData = STAT_CORE_UPGRADE_COSTS.find(cost => cost.level === i);
    if (costData) {
      totalCost += costData.fragments;
    } else if (i >= STAT_CORE_UPGRADE_COSTS.length) {
      // For levels beyond our data, use the highest known cost (level 9)
      totalCost +=
        STAT_CORE_UPGRADE_COSTS[STAT_CORE_UPGRADE_COSTS.length - 1].fragments;
    }
  }

  return totalCost;
}
