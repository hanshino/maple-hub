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

  it('shows estimated time to level up', () => {
    render(<ProgressBar progress={0.5} expRate={10} />);

    expect(screen.getByText(/預計升級: 5.0 小時/)).toBeInTheDocument();
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
