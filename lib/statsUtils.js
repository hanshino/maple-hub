export const processStatsData = statsData => {
  const { final_stat } = statsData;

  if (!final_stat || !Array.isArray(final_stat)) {
    return [];
  }

  // Filter out stats that start with "AP配點" and group stats into pairs for table display
  const stats = final_stat
    .filter(stat => !stat.stat_name.startsWith('AP配點'))
    .map(stat => ({
      name: stat.stat_name,
      value: stat.stat_value,
    }));

  // Merge min/max stat pairs (e.g., 最低屬性攻擊力 and 最高屬性攻擊力)
  const mergedStats = [];
  const processedIndices = new Set();

  for (let i = 0; i < stats.length; i++) {
    if (processedIndices.has(i)) continue;

    const stat = stats[i];
    const minMatch = stat.name.match(/^最低(.+)$/);
    const maxMatch = stat.name.match(/^最高(.+)$/);

    if (minMatch) {
      // Look for corresponding max stat
      const maxStatName = `最高${minMatch[1]}`;
      const maxIndex = stats.findIndex(
        (s, idx) => idx > i && s.name === maxStatName
      );

      if (maxIndex !== -1) {
        // Merge min and max into a range
        mergedStats.push({
          name: minMatch[1],
          value: `${stat.value}-${stats[maxIndex].value}`,
          isRange: true,
        });
        processedIndices.add(i);
        processedIndices.add(maxIndex);
        continue;
      }
    } else if (maxMatch) {
      // Look for corresponding min stat
      const minStatName = `最低${maxMatch[1]}`;
      const minIndex = stats.findIndex(
        (s, idx) => idx > i && s.name === minStatName
      );

      if (minIndex !== -1) {
        // Merge min and max into a range
        mergedStats.push({
          name: maxMatch[1],
          value: `${stats[minIndex].value}-${stat.value}`,
          isRange: true,
        });
        processedIndices.add(i);
        processedIndices.add(minIndex);
        continue;
      }
    }

    // Regular stat
    mergedStats.push(stat);
    processedIndices.add(i);
  }

  return mergedStats;
};

export const getBattlePower = stats => {
  const battlePowerStat = stats.find(stat => stat.name === '戰鬥力');
  return battlePowerStat ? battlePowerStat.value : null;
};

export const formatStatValue = value => {
  // Handle range values (e.g., "268850795-298723102")
  if (typeof value === 'string' && value.includes('-')) {
    const [min, max] = value.split('-');
    const formattedMin = formatSingleNumber(min);
    const formattedMax = formatSingleNumber(max);
    return `${formattedMin}-${formattedMax}`;
  }

  // Handle single numbers
  return formatSingleNumber(value);
};

const formatSingleNumber = value => {
  // Handle numeric strings
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const num = parseInt(value);
    return formatChineseNumber(num);
  }

  // Handle numbers
  if (typeof value === 'number') {
    return formatChineseNumber(value);
  }

  // Return as-is for other types
  return value;
};

const formatChineseNumber = num => {
  // Use Chinese units: 萬 (10^4) and 億 (10^8), only for numbers >= 1,000,000
  if (num >= 100000000) {
    // 億 (100 million)
    const yi = num / 100000000;
    return `${yi.toFixed(2)}億`;
  } else if (num >= 1000000) {
    // 萬 (1 million)
    const wan = num / 10000;
    return `${wan.toFixed(2)}萬`;
  } else {
    return num.toString();
  }
};
