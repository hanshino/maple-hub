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
      totalAvailable: 3,
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
      // Unactivated: add activation cost
      const costs = [
        { elda: 5, fragments: 10 }, // Core I
        { elda: 10, fragments: 200 }, // Core II
        { elda: 15, fragments: 350 }, // Core III
      ];
      materialUsed.soulElda += costs[index]?.elda || 0;
      materialUsed.soulEldaFragments += costs[index]?.fragments || 0;
    } else if (core.stat_grade === 20) {
      // Fully maxed: calculate actual usage based on upgrade costs
      materialUsed.soulEldaFragments += calculateUpgradeCosts(core);
    }
    // Partial activations: deferred (stat_grade between 1-19)
  });

  return {
    activatedCount: activatedCores.length,
    totalAvailable: 3,
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
