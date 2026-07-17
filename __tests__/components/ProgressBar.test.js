import { render, screen } from '@testing-library/react';
import ProgressBar from '../../components/ProgressBar';

describe('ProgressBar', () => {
  it('renders progress bar with percentage', () => {
    render(<ProgressBar progress={0.75} />);

    expect(screen.getByText('75.00')).toBeInTheDocument();
  });

  it('renders progress bar with 0% for invalid progress', () => {
    render(<ProgressBar progress={-0.1} />);

    expect(screen.getByText('0.00')).toBeInTheDocument();
  });

  it('renders progress bar with 100% for progress over 1', () => {
    render(<ProgressBar progress={1.5} />);

    expect(screen.getByText('100.00')).toBeInTheDocument();
  });

  it('hides the ETA without sufficient increasing historical data', () => {
    const { rerender } = render(<ProgressBar progress={0.5} expRate={10} />);

    expect(screen.queryByText(/預計升級/)).not.toBeInTheDocument();

    rerender(
      <ProgressBar
        progress={0.5}
        historicalData={[{ date: '2025-10-20', percentage: 50, level: 200 }]}
      />
    );
    expect(screen.queryByText(/預計升級/)).not.toBeInTheDocument();

    rerender(
      <ProgressBar
        progress={0.5}
        historicalData={[
          { date: '2025-10-20', percentage: 50, level: 200 },
          { date: '2025-10-20', percentage: 60, level: 200 },
        ]}
      />
    );
    expect(screen.queryByText(/預計升級/)).not.toBeInTheDocument();

    rerender(
      <ProgressBar
        progress={0.5}
        historicalData={[
          { date: '2025-10-20', percentage: 60, level: 200 },
          { date: '2025-10-21', percentage: 50, level: 200 },
        ]}
      />
    );
    expect(screen.queryByText(/預計升級/)).not.toBeInTheDocument();
  });

  it('shows history-derived daily growth and ETA when cumulative progress increases', () => {
    render(
      <ProgressBar
        progress={0.6}
        historicalData={[
          { date: '2025-10-20', percentage: 50, level: 200 },
          { date: '2025-10-21', percentage: 60, level: 200 },
        ]}
      />
    );

    expect(screen.getByText('+10.00%/天')).toBeInTheDocument();
    expect(screen.getByText(/預計升級:/)).toHaveTextContent(
      '預計升級: 4 天 0.0 小時'
    );
  });

  it('derives ETA from valid dated points when invalid history entries are present', () => {
    render(
      <ProgressBar
        progress={0.6}
        historicalData={[
          { date: 'not-a-date', percentage: 0, level: 1 },
          { date: '2025-10-20', percentage: 50, level: 200 },
          { date: '2025-10-21', percentage: 60, level: 200 },
        ]}
      />
    );

    expect(screen.getByText('+10.00%/天')).toBeInTheDocument();
    expect(screen.getByText(/預計升級:/)).toHaveTextContent(
      '預計升級: 4 天 0.0 小時'
    );
  });

  it.each([
    [
      'non-finite percentages',
      [
        { date: '2025-10-20', percentage: Infinity, level: 200 },
        { date: '2025-10-21', percentage: 10, level: 200 },
      ],
    ],
    [
      'non-finite levels',
      [
        { date: '2025-10-20', percentage: 50, level: 200 },
        { date: '2025-10-21', percentage: 60, level: Infinity },
      ],
    ],
  ])('hides growth and ETA for %s', (_label, historicalData) => {
    render(<ProgressBar progress={0.5} historicalData={historicalData} />);

    expect(screen.queryByText(/預計升級/)).not.toBeInTheDocument();
    expect(screen.queryByText(/%\/天/)).not.toBeInTheDocument();
  });

  it('displays level when provided', () => {
    render(<ProgressBar progress={0.5} level={200} />);

    expect(screen.getByText('Lv.200')).toBeInTheDocument();
  });

  it('shows daily growth rate when historical data available', () => {
    const historicalData = [
      { date: '2025-10-20', percentage: 50, level: 200 },
      { date: '2025-10-21', percentage: 60, level: 200 },
    ];
    render(
      <ProgressBar progress={0.6} historicalData={historicalData} level={200} />
    );

    expect(screen.getByText(/\+.*%\/天/)).toBeInTheDocument();
  });
});
