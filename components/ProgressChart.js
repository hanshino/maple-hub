'use client';

import { memo, useMemo } from 'react';
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
} from 'recharts';

const ProgressChart = memo(function ProgressChart({ progressData }) {
  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    // If no data, show message
    if (!progressData || progressData.length === 0) {
      return { type: 'empty' };
    }

    // If single data point or single progress value, prepare pie chart data
    if (!Array.isArray(progressData) || progressData.length === 1) {
      const percentage = Array.isArray(progressData)
        ? progressData[0].progress
        : Math.max(0, Math.min(progressData * 100, 100));
      const remaining = 100 - percentage;

      return {
        type: 'pie',
        percentage,
        data: [
          { name: 'Completed', value: percentage, color: '#3B82F6' },
          { name: 'Remaining', value: remaining, color: '#E5E7EB' },
        ],
      };
    }

    // Validate data format for line chart
    const validData = progressData.filter(
      item =>
        item && typeof item === 'object' && 'date' in item && 'progress' in item
    );

    if (validData.length === 0) {
      return { type: 'invalid' };
    }

    // Calculate prediction data for next 10 days
    const predictionData = [];
    if (validData.length >= 2) {
      const sortedData = validData
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

        // Generate prediction for next 10 days
        const lastDate = new Date(lastData.date);
        let currentProgress = lastData.progress;

        for (let i = 1; i <= 10; i++) {
          const predictionDate = new Date(lastDate);
          predictionDate.setDate(lastDate.getDate() + i);
          currentProgress = Math.min(100, currentProgress + dailyGrowthRate); // Cap at 100%

          predictionData.push({
            date: predictionDate.toISOString().split('T')[0],
            progress: null, // 實際數據為null
            prediction: currentProgress, // 預測數據
            isPrediction: true,
          });
        }
      }
    }

    // Combine actual and prediction data
    const combinedData = [
      ...validData.map(item => ({ ...item, prediction: null })), // 實際數據的預測字段為null
      ...predictionData,
    ];

    return {
      type: 'line',
      combinedData,
      hasPrediction: predictionData.length > 0,
    };
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
      aria-labelledby="line-chart-title"
    >
      <figcaption id="line-chart-title" className="sr-only">
        進度趨勢線圖表包含{' '}
        {chartData.combinedData.filter(d => d.progress !== null).length}{' '}
        個實際資料點及{chartData.hasPrediction ? '10天預測' : '無預測'}
      </figcaption>
      <div className="text-xs text-gray-600 mb-2 text-center sm:text-left">
        資料點數量:{' '}
        {chartData.combinedData.filter(d => d.progress !== null).length}{' '}
        {chartData.hasPrediction ? '| 預測: 10天' : ''}
      </div>
      <div className="overflow-x-auto">
        <div
          style={{ width: '100%', minWidth: '300px', height: '200px' }}
          role="img"
          aria-label={`進度趨勢圖表顯示歷史資料及未來預測趨勢`}
        >
          <LineChart
            width={Math.max(400, chartData.combinedData.length * 40)}
            height={200}
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
              interval={Math.max(
                0,
                Math.floor(chartData.combinedData.length / 10) - 1
              )}
            />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
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
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
              connectNulls={false}
            />
            {chartData.hasPrediction && (
              <Line
                type="monotone"
                dataKey="prediction"
                stroke="#9CA3AF"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#9CA3AF', strokeWidth: 2, r: 2 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </div>
      </div>
    </figure>
  );
});

export default ProgressChart;
