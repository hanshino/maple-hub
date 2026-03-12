'use client';

import { memo, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
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
  Label,
} from 'recharts';

const CHART_COLORS = {
  completed: '#f7931e',
  remainingLight: '#E5E7EB',
  remainingDark: '#3a2f2a',
  actual: '#f7931e',
  prediction: '#8c6239',
};

const PREDICTION_CONFIG = {
  days: 10,
  maxPercentage: 300,
  maxPercentageLegacy: 100,
};

const LEVEL_ADJUSTMENT = {
  perLevel: 100,
};

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
      percentage: null,
      prediction: currentProgress,
      isPrediction: true,
    });
  }

  return predictionData;
};

const processLevelAwareData = validData => {
  const baselineLevel = validData[0].level;

  const processedData = validData.map(item => {
    const rawPercentage =
      item.percentage !== undefined
        ? item.percentage
        : item.progress !== undefined
          ? item.progress * 100
          : 0;

    const levelDiff = Math.max(0, item.level - baselineLevel);
    const levelAdjustment = levelDiff * LEVEL_ADJUSTMENT.perLevel;
    const adjustedPercentage = rawPercentage + levelAdjustment;

    return {
      ...item,
      percentage: adjustedPercentage,
      progress: adjustedPercentage,
      rawPercentage,
      levelAdjustment,
    };
  });

  const predictionData = calculatePredictions(processedData, true);

  const actualData = processedData.map((item, index) => ({
    ...item,
    // Connect the last actual point to the prediction line
    prediction:
      predictionData.length > 0 && index === processedData.length - 1
        ? item.progress
        : null,
  }));

  const combinedData = [...actualData, ...predictionData];

  return {
    type: 'line',
    combinedData,
    hasPrediction: predictionData.length > 0,
    hasLevelData: true,
  };
};

const processLegacyData = validData => {
  const processedData = validData.map(item => ({
    ...item,
    percentage:
      item.percentage !== undefined
        ? item.percentage
        : item.progress !== undefined
          ? item.progress * 100
          : 0,
    progress:
      item.percentage !== undefined
        ? item.percentage
        : item.progress !== undefined
          ? item.progress * 100
          : 0,
  }));

  const predictionData = calculatePredictions(processedData, false);

  const actualData = processedData.map((item, index) => ({
    ...item,
    prediction:
      predictionData.length > 0 && index === processedData.length - 1
        ? item.progress
        : null,
  }));

  const combinedData = [...actualData, ...predictionData];

  return {
    type: 'line',
    combinedData,
    hasPrediction: predictionData.length > 0,
    hasLevelData: false,
  };
};

/** Custom center label for the donut chart */
const DonutCenterLabel = ({ viewBox, percentage, theme }) => {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '20px',
          fontWeight: 800,
          fill: theme.palette.primary.main,
          fontFamily: '"Comic Neue", cursive',
        }}
      >
        {percentage.toFixed(1)}%
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '11px',
          fontWeight: 500,
          fill: theme.palette.text.secondary,
        }}
      >
        經驗進度
      </text>
    </g>
  );
};

const ProgressChart = memo(function ProgressChart({ progressData }) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    if (!progressData || progressData.length === 0) {
      return { type: 'empty' };
    }

    if (!Array.isArray(progressData) || progressData.length === 1) {
      const item = Array.isArray(progressData) ? progressData[0] : progressData;
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
            color:
              theme.palette.mode === 'dark'
                ? CHART_COLORS.remainingDark
                : CHART_COLORS.remainingLight,
          },
        ],
      };
    }

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

    const hasLevelData = validData.some(item => 'level' in item);

    return hasLevelData
      ? processLevelAwareData(validData)
      : processLegacyData(validData);
  }, [progressData, theme.palette.mode]);

  if (chartData.type === 'empty') {
    return (
      <Box
        sx={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          borderRadius: 2,
          bgcolor: theme => alpha(theme.palette.primary.main, 0.03),
        }}
        role="region"
        aria-label="進度圖表 - 無資料可顯示"
      >
        <Typography variant="body2" sx={{ opacity: 0.6 }}>
          無進度資料可顯示
        </Typography>
      </Box>
    );
  }

  if (chartData.type === 'pie') {
    return (
      <figure
        className="w-full"
        role="region"
        aria-labelledby="pie-chart-title"
        style={{ margin: 0 }}
      >
        <figcaption id="pie-chart-title" className="sr-only">
          目前進度圓餅圖顯示 {chartData.percentage.toFixed(1)}% 完成度
        </figcaption>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {chartData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <Label
                  content={
                    <DonutCenterLabel
                      percentage={chartData.percentage}
                      theme={theme}
                    />
                  }
                  position="center"
                />
              </Pie>
              <Tooltip formatter={value => `${value.toFixed(1)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary',
            mt: 0.5,
            opacity: 0.7,
          }}
        >
          僅有單日資料，累積更多天數後將顯示趨勢圖
        </Typography>
      </figure>
    );
  }

  if (chartData.type === 'invalid') {
    return (
      <Box
        sx={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
        role="region"
        aria-label="進度圖表 - 資料格式無效"
      >
        <Typography variant="body2" sx={{ opacity: 0.6 }}>
          圖表資料格式無效
        </Typography>
      </Box>
    );
  }

  // Line chart
  const actualCount = chartData.combinedData.filter(
    d => d.progress !== null
  ).length;

  return (
    <figure
      className="w-full"
      role="region"
      aria-label="進度趨勢圖表"
      style={{ margin: 0 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 0.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 3,
                borderRadius: 1,
                bgcolor: CHART_COLORS.actual,
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontSize: '0.7rem' }}
            >
              實際 ({actualCount}筆)
            </Typography>
          </Box>
          {chartData.hasPrediction && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 3,
                  borderRadius: 1,
                  bgcolor: CHART_COLORS.prediction,
                  opacity: 0.6,
                  backgroundImage: `repeating-linear-gradient(90deg, ${CHART_COLORS.prediction} 0px, ${CHART_COLORS.prediction} 3px, transparent 3px, transparent 6px)`,
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontSize: '0.7rem' }}
              >
                預測 (10天)
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={chartData.combinedData}
          margin={{ top: 5, right: 16, left: 0, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.divider, 0.15)
                : alpha(theme.palette.divider, 0.3)
            }
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            tickFormatter={value => {
              const d = new Date(value);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
            height={40}
            interval="preserveStartEnd"
            axisLine={{ stroke: theme.palette.divider }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
            domain={
              chartData.hasLevelData
                ? [
                    0,
                    dataMax => {
                      return Math.ceil(dataMax / 100) * 100;
                    },
                  ]
                : ['dataMin', 'dataMax']
            }
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value, name) => [
              `${value?.toFixed(2)}%`,
              name === 'progress' ? '實際進度' : '預測進度',
            ]}
            labelFormatter={label => `日期: ${label}`}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              color: theme.palette.text.primary,
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Line
            type="monotone"
            dataKey="progress"
            stroke={CHART_COLORS.actual}
            strokeWidth={2.5}
            dot={{
              fill: CHART_COLORS.actual,
              strokeWidth: 2,
              r: 4,
              stroke: theme.palette.background.paper,
            }}
            activeDot={{
              fill: CHART_COLORS.actual,
              strokeWidth: 2,
              r: 6,
              stroke: theme.palette.background.paper,
            }}
            connectNulls={false}
          />
          {chartData.hasPrediction && (
            <Line
              type="monotone"
              dataKey="prediction"
              stroke={CHART_COLORS.prediction}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{
                fill: CHART_COLORS.prediction,
                strokeWidth: 2,
                r: 3,
                stroke: theme.palette.background.paper,
              }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
});

export default ProgressChart;
