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
