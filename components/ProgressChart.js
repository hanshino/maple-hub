'use client';

import { memo, useMemo } from 'react';
import { Box } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Constants for chart configuration
const CHART_COLORS = {
  completed: '#f7931e', // Primary orange (theme)
  remaining: '#E5E7EB',
  actual: '#f7931e', // Primary orange
  prediction: '#8c6239', // Secondary brown (theme)
};

const PREDICTION_CONFIG = {
  days: 10,
  maxPercentage: 300, // For level-aware charts
  maxPercentageLegacy: 100, // For legacy charts
};

const LEVEL_ADJUSTMENT = {
  perLevel: 100, // Add 100% per level gained
};

/**
 * Calculate prediction data for future progress based on historical data
 * @param {Array} data - Historical progress data
 * @param {boolean} isLevelAware - Whether to use level-aware calculations
 * @returns {Array} Prediction data points
 */
const calculatePredictions = (data, isLevelAware = false) => {
  if (!data || data.length < 2) return [];

  const sortedData = data
    .filter(item => item && typeof item.percentage === 'number')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sortedData.length < 2) return [];

  const firstData = sortedData[0];
  const lastData = sortedData[sortedData.length - 1];
  const daysDiff = Math.max(
    1,
    (new Date(lastData.date) - new Date(firstData.date)) / (1000 * 60 * 60 * 24)
  );
  const totalProgressGain = lastData.percentage - firstData.percentage;
  const dailyGrowthRate = totalProgressGain / daysDiff;

  const maxPercentage = isLevelAware
    ? PREDICTION_CONFIG.maxPercentage
    : PREDICTION_CONFIG.maxPercentageLegacy;

  const predictionData = [];
  const lastDate = new Date(lastData.date);
  let currentProgress = lastData.percentage;

  for (let i = 1; i <= PREDICTION_CONFIG.days; i++) {
    const predictionDate = new Date(lastDate);
    predictionDate.setDate(lastDate.getDate() + i);
    currentProgress = Math.min(
      maxPercentage,
      currentProgress + dailyGrowthRate
    );

    predictionData.push({
      date: predictionDate.toISOString().split('T')[0],
      percentage: null, // Actual data is null for predictions
      prediction: currentProgress,
      isPrediction: true,
    });
  }

  return predictionData;
};

/**
 * Process data for level-aware charts with percentage adjustments
 * @param {Array} validData - Validated progress data
 * @returns {Object} Processed chart data
 */
const processLevelAwareData = validData => {
  const baselineLevel = validData[0].level;

  const processedData = validData.map(item => {
    const rawPercentage =
      item.percentage !== undefined
        ? item.percentage
        : item.progress !== undefined
          ? item.progress * 100
          : 0;

    // Calculate level difference (only apply for level gains)
    const levelDiff = Math.max(0, item.level - baselineLevel);
    const levelAdjustment = levelDiff * LEVEL_ADJUSTMENT.perLevel;
    const adjustedPercentage = rawPercentage + levelAdjustment;

    return {
      ...item,
      percentage: adjustedPercentage,
      progress: adjustedPercentage, // Keep progress field in percentage range for chart compatibility
      rawPercentage,
      levelAdjustment,
    };
  });

  const predictionData = calculatePredictions(processedData, true);

  // Combine actual and prediction data
  const combinedData = [
    ...processedData.map(item => ({ ...item, prediction: null })),
    ...predictionData,
  ];

  return {
    type: 'line',
    combinedData,
    hasPrediction: predictionData.length > 0,
    hasLevelData: true,
  };
};

/**
 * Process data for legacy charts without level information
 * @param {Array} validData - Validated progress data
 * @returns {Object} Processed chart data
 */
const processLegacyData = validData => {
  const processedData = validData.map(item => ({
    ...item,
    percentage:
      item.percentage !== undefined
        ? item.percentage
        : item.progress !== undefined
          ? item.progress * 100
          : 0,
    // Keep progress field in percentage range for chart compatibility
    progress:
      item.percentage !== undefined
        ? item.percentage
        : item.progress !== undefined
          ? item.progress * 100
          : 0,
  }));

  const predictionData = calculatePredictions(processedData, false);

  // Combine actual and prediction data
  const combinedData = [
    ...processedData.map(item => ({ ...item, prediction: null })),
    ...predictionData,
  ];

  return {
    type: 'line',
    combinedData,
    hasPrediction: predictionData.length > 0,
    hasLevelData: false,
  };
};

/**
 * ProgressChart component with level-aware percentage adjustments
 *
 * Displays experience progress data using pie charts (single data point) or line charts (multiple data points).
 * For cross-level visualization, adds 100% to the percentage for each level gained above baseline.
 *
 * Supports both legacy format (progress: 0-1) and new format (percentage: 0-100, level: number).
 * When level data is present, applies level-aware calculations for continuous chart visualization.
 *
 * @param {Object|Array} progressData - Progress data to display
 * @param {string} progressData.date - ISO date string (for arrays)
 * @param {number} progressData.percentage - Raw percentage within level (0-100, preferred)
 * @param {number} progressData.progress - Legacy progress value (0-1, still supported)
 * @param {number} progressData.level - Character level (enables level-aware calculations)
 * @returns {JSX.Element} Chart component
 */
const ProgressChart = memo(function ProgressChart({ progressData }) {
  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    // If no data, show message
    if (!progressData || progressData.length === 0) {
      return { type: 'empty' };
    }

    // If single data point or single progress value, prepare pie chart data
    if (!Array.isArray(progressData) || progressData.length === 1) {
      const item = Array.isArray(progressData) ? progressData[0] : progressData;
      // Support both old 'progress' format and new 'percentage' + 'level' format
      const percentage =
        item.percentage !== undefined
          ? item.percentage
          : item.progress !== undefined
            ? item.progress * 100
            : 0;
      const remaining = 100 - percentage;

      return {
        type: 'pie',
        percentage,
        data: [
          {
            name: 'Completed',
            value: percentage,
            color: CHART_COLORS.completed,
          },
          {
            name: 'Remaining',
            value: remaining,
            color: CHART_COLORS.remaining,
          },
        ],
      };
    }

    // Validate data format for line chart - support both formats
    const validData = progressData.filter(
      item =>
        item &&
        typeof item === 'object' &&
        'date' in item &&
        ('percentage' in item || 'progress' in item)
    );

    if (validData.length === 0) {
      return { type: 'invalid' };
    }

    // Check if data includes level information for level-aware calculations
    const hasLevelData = validData.some(item => 'level' in item);

    const processedData = hasLevelData
      ? processLevelAwareData(validData)
      : processLegacyData(validData);

    return processedData;
  }, [progressData]);

  // Early return for empty data
  if (chartData.type === 'empty') {
    return (
      <div
        className="w-full h-64 flex items-center justify-center text-gray-500"
        role="region"
        aria-label="進度圖表 - 無資料可顯示"
      >
        <p>無進度資料可顯示</p>
      </div>
    );
  }

  // Pie chart for single data point
  if (chartData.type === 'pie') {
    return (
      <figure
        className="w-full h-32 sm:h-40"
        role="region"
        aria-labelledby="pie-chart-title"
      >
        <figcaption id="pie-chart-title" className="sr-only">
          目前進度圓餅圖顯示 {chartData.percentage.toFixed(1)}% 完成度
        </figcaption>
        <div className="text-xs text-gray-600 mb-2 text-center sm:text-left">
          目前進度: {chartData.percentage.toFixed(1)}%
        </div>
        <div className="flex justify-center">
          <div
            style={{ width: '250px', height: '120px' }}
            role="img"
            aria-label={`進度圖表: ${chartData.percentage.toFixed(1)}% 已完成, ${chartData.data[1].value.toFixed(1)}% 剩餘`}
          >
            <PieChart width={250} height={120}>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={value => `${value.toFixed(1)}%`} />
            </PieChart>
          </div>
        </div>
      </figure>
    );
  }

  // Invalid data
  if (chartData.type === 'invalid') {
    return (
      <div
        className="w-full h-64 flex items-center justify-center text-gray-500"
        role="region"
        aria-label="進度圖表 - 資料格式無效"
      >
        <p>圖表資料格式無效</p>
      </div>
    );
  }

  // Line chart for multiple data points
  return (
    <figure
      className="w-full h-64 sm:h-80"
      role="region"
      aria-label="進度趨勢圖表"
    >
      <Box
        sx={{
          fontSize: '0.75rem',
          color: 'text.secondary',
          mb: 3,
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        實際資料點數量:{' '}
        {chartData.combinedData.filter(d => d.progress !== null).length}
        {chartData.hasPrediction ? ' | 灰色虛線: 未來10天預測進度' : ''}
      </Box>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData.combinedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            domain={
              chartData.hasLevelData
                ? [
                    0,
                    dataMax => {
                      const calculatedMax = Math.ceil(dataMax / 100) * 100;
                      return calculatedMax;
                    },
                  ]
                : ['dataMin', 'dataMax']
            }
          />
          <Tooltip
            formatter={(value, name) => [
              `${value?.toFixed(2)}%`,
              name === 'progress' ? '實際進度' : '預測進度',
            ]}
            labelFormatter={label => `日期: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="progress"
            stroke={CHART_COLORS.actual}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.actual, strokeWidth: 2, r: 3 }}
            connectNulls={false}
          />
          {chartData.hasPrediction && (
            <Line
              type="monotone"
              dataKey="prediction"
              stroke={CHART_COLORS.prediction}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: CHART_COLORS.prediction, strokeWidth: 2, r: 2 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
});

export default ProgressChart;
