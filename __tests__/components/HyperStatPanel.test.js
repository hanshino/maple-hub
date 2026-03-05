// __tests__/components/HyperStatPanel.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HyperStatPanel from '../../components/HyperStatPanel';

jest.mock('../../components/panel/PanelSkeleton', () => {
  return function Mock() {
    return <div data-testid="panel-skeleton" />;
  };
});
jest.mock('../../components/panel/PanelError', () => {
  return function Mock({ message }) {
    return <div data-testid="panel-error">{message}</div>;
  };
});
jest.mock('../../components/panel/PanelEmpty', () => {
  return function Mock({ message }) {
    return <div data-testid="panel-empty">{message}</div>;
  };
});
jest.mock('../../components/panel/SectionHeader', () => {
  return function Mock() {
    return <div data-testid="section-header" />;
  };
});

const mockData = {
  use_preset_no: '2',
  hyper_stat_preset_1: [
    { stat_type: '力量', stat_level: 10, stat_increase: '+30,000' },
  ],
  hyper_stat_preset_2: [
    { stat_type: '敏捷', stat_level: 5, stat_increase: '+15,000' },
  ],
  hyper_stat_preset_3: [],
};

describe('HyperStatPanel', () => {
  it('shows skeleton when loading', () => {
    render(<HyperStatPanel loading={true} data={null} />);
    expect(screen.getByTestId('panel-skeleton')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<HyperStatPanel error="載入失敗" />);
    expect(screen.getByTestId('panel-error')).toBeInTheDocument();
  });

  it('renders ToggleButtonGroup instead of Tabs', () => {
    render(<HyperStatPanel data={mockData} />);
    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-label',
      '極限屬性預設選擇'
    );
  });

  it('shows 使用中 chip on active preset', () => {
    render(<HyperStatPanel data={mockData} />);
    expect(screen.getByText('使用中')).toBeInTheDocument();
  });

  it('switches preset on toggle button click', async () => {
    render(<HyperStatPanel data={mockData} />);
    await userEvent.click(screen.getByText(/預設 1/));
    expect(screen.getByText('力量')).toBeInTheDocument();
  });

  it('shows empty message for preset with no stats', async () => {
    render(<HyperStatPanel data={mockData} />);
    await userEvent.click(screen.getByText(/預設 3/));
    expect(screen.getByTestId('panel-empty')).toBeInTheDocument();
  });
});
