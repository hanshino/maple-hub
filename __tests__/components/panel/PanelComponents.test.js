import { render, screen, fireEvent } from '@testing-library/react';
import PanelSkeleton from '../../../components/panel/PanelSkeleton';
import PanelError from '../../../components/panel/PanelError';
import PanelEmpty from '../../../components/panel/PanelEmpty';
import SectionHeader from '../../../components/panel/SectionHeader';

describe('PanelSkeleton', () => {
  it('renders default 4 rows', () => {
    render(<PanelSkeleton />);
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons).toHaveLength(4);
  });

  it('renders custom row count', () => {
    render(<PanelSkeleton rows={7} />);
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons).toHaveLength(7);
  });

  it('has aria-busy attribute', () => {
    render(<PanelSkeleton />);
    const container = document.querySelector('[aria-busy="true"]');
    expect(container).toBeInTheDocument();
  });
});

describe('PanelError', () => {
  it('renders message', () => {
    render(<PanelError message="發生錯誤" />);
    expect(screen.getByText('發生錯誤')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    render(<PanelError message="錯誤" onRetry={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: '重新載入' })
    ).toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', () => {
    const mockRetry = jest.fn();
    render(<PanelError message="錯誤" onRetry={mockRetry} />);
    fireEvent.click(screen.getByRole('button', { name: '重新載入' }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is null', () => {
    render(<PanelError message="錯誤" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('PanelEmpty', () => {
  it('renders message', () => {
    render(<PanelEmpty message="沒有資料" />);
    expect(screen.getByText('沒有資料')).toBeInTheDocument();
  });
});

describe('SectionHeader', () => {
  it('renders description text', () => {
    render(<SectionHeader description="這是說明文字" />);
    expect(screen.getByText('這是說明文字')).toBeInTheDocument();
  });
});
