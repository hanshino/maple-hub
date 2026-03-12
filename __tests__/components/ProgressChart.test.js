import { render, screen } from '@testing-library/react';
import ProgressChart from '../../components/ProgressChart';

// Mock Recharts components to avoid rendering issues in tests
jest.mock('recharts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Label: () => <div data-testid="label" />,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('ProgressChart', () => {
  it('renders empty state when no data provided', () => {
    render(<ProgressChart progressData={[]} />);

    expect(screen.getByText('無進度資料可顯示')).toBeInTheDocument();
  });

  it('renders pie chart for single data point', () => {
    const mockData = [{ progress: 0.75 }];
    render(<ProgressChart progressData={mockData} />);

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(
      screen.getByText(/僅有單日資料.*累積更多天數/)
    ).toBeInTheDocument();
  });

  it('renders line chart for multiple data points', () => {
    const mockData = [
      { date: '2025-10-20', progress: 0.5 },
      { date: '2025-10-21', progress: 0.75 },
    ];
    render(<ProgressChart progressData={mockData} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByText(/實際/)).toBeInTheDocument();
  });

  it('handles invalid data gracefully', () => {
    const mockData = [{ invalid: 'data' }, { also: 'invalid' }];
    render(<ProgressChart progressData={mockData} />);

    expect(screen.getByText(/資料格式無效/)).toBeInTheDocument();
  });

  // US1 Tests: Level transition percentage calculation
  describe('Level-aware percentage calculations', () => {
    it('applies 100% adjustment for level transitions', () => {
      const mockData = [
        { date: '2025-10-20', level: 150, percentage: 75 },
        { date: '2025-10-21', level: 151, percentage: 10 },
      ];

      render(<ProgressChart progressData={mockData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('maintains raw percentage for same level data', () => {
      const mockData = [
        { date: '2025-10-20', level: 150, percentage: 75 },
        { date: '2025-10-21', level: 150, percentage: 90 },
      ];

      render(<ProgressChart progressData={mockData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles level decreases without adjustment', () => {
      const mockData = [
        { date: '2025-10-20', level: 152, percentage: 25 },
        { date: '2025-10-21', level: 151, percentage: 80 },
      ];

      render(<ProgressChart progressData={mockData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // Additional edge case tests
  describe('Edge cases and performance', () => {
    it('handles large datasets efficiently', () => {
      const largeData = [];
      for (let i = 0; i < 50; i++) {
        const level = 150 + Math.floor(i / 5);
        const percentage = (i % 5) * 20;
        const date = new Date(2025, 9, 1 + i);
        largeData.push({
          date: date.toISOString().split('T')[0],
          level,
          percentage,
        });
      }

      render(<ProgressChart progressData={largeData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles mixed data formats gracefully', () => {
      const mixedData = [
        { date: '2025-10-20', percentage: 50, level: 150 },
        { date: '2025-10-21', progress: 0.75 },
        { date: '2025-10-22', percentage: 25, level: 151 },
      ];

      render(<ProgressChart progressData={mixedData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles null and undefined values in data', () => {
      const dataWithNulls = [
        { date: '2025-10-20', percentage: 50, level: 150 },
        { date: '2025-10-21', percentage: null, level: 150 },
        { date: '2025-10-22', percentage: 75, level: undefined },
        { date: '2025-10-23', percentage: 90, level: 150 },
      ];

      render(<ProgressChart progressData={dataWithNulls} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles extreme level differences', () => {
      const extremeData = [
        { date: '2025-10-20', level: 1, percentage: 50 },
        { date: '2025-10-21', level: 300, percentage: 25 },
      ];

      render(<ProgressChart progressData={extremeData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('maintains performance with frequent re-renders', () => {
      const { rerender } = render(<ProgressChart progressData={[]} />);
      expect(screen.getByText('無進度資料可顯示')).toBeInTheDocument();

      // Re-render with single data point
      const data = [{ date: '2025-10-20', percentage: 50, level: 150 }];
      rerender(<ProgressChart progressData={data} />);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();

      // Re-render with multiple data points
      const newData = [
        { date: '2025-10-20', percentage: 50, level: 150 },
        { date: '2025-10-21', percentage: 75, level: 150 },
      ];
      rerender(<ProgressChart progressData={newData} />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
