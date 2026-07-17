import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StatHighlightStrip from '../../components/StatHighlightStrip';

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const statsData = {
  final_stat: [
    { stat_name: '戰鬥力', stat_value: '1000000' },
    { stat_name: 'STR', stat_value: '4000' },
    { stat_name: 'DEX', stat_value: '500' },
    { stat_name: 'INT', stat_value: '100' },
    { stat_name: 'LUK', stat_value: '200' },
    { stat_name: 'Boss攻擊時傷害', stat_value: '300' },
    { stat_name: '爆擊傷害', stat_value: '77' },
    { stat_name: '無視防禦率', stat_value: '95' },
  ],
};

describe('StatHighlightStrip', () => {
  it('renders nothing when no stats and no battle power are available', () => {
    const { container } = render(
      <TestWrapper>
        <StatHighlightStrip battlePower={null} statsData={null} />
      </TestWrapper>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders battle power, main stat, boss/crit damage, and ignore defense', () => {
    render(
      <TestWrapper>
        <StatHighlightStrip battlePower={12345678} statsData={statsData} />
      </TestWrapper>
    );
    expect(screen.getByText('戰鬥力')).toBeInTheDocument();
    expect(screen.getByText('12,345,678')).toBeInTheDocument();
    expect(screen.getByText('主屬性 STR')).toBeInTheDocument();
    expect(screen.getByText('300%')).toBeInTheDocument();
    expect(screen.getByText('爆擊傷害 77%')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('uses HP as the Demon Avenger main stat while other classes keep their highest primary stat', () => {
    const demonAvengerStats = {
      ...statsData,
      final_stat: [
        ...statsData.final_stat,
        { stat_name: 'HP', stat_value: '125000' },
      ],
    };
    const { rerender } = render(
      <TestWrapper>
        <StatHighlightStrip
          battlePower={12345678}
          statsData={demonAvengerStats}
          characterClass="惡魔復仇者"
        />
      </TestWrapper>
    );

    expect(screen.getByText('主屬性 HP')).toBeInTheDocument();
    expect(screen.getByText('125000')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <StatHighlightStrip
          battlePower={12345678}
          statsData={demonAvengerStats}
          characterClass="英雄"
        />
      </TestWrapper>
    );

    expect(screen.getByText('主屬性 STR')).toBeInTheDocument();
    expect(screen.getByText('4000')).toBeInTheDocument();
  });

  it('shows a dash for battle power when unavailable but stats exist', () => {
    render(
      <TestWrapper>
        <StatHighlightStrip battlePower={null} statsData={statsData} />
      </TestWrapper>
    );
    expect(screen.getByText('戰鬥力')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
