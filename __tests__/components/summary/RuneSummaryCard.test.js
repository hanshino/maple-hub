import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RuneSummaryCard from '../../../components/summary/RuneSummaryCard';

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('RuneSummaryCard', () => {
  it('shows an empty state when there are no runes', () => {
    render(
      <TestWrapper>
        <RuneSummaryCard runes={[]} />
      </TestWrapper>
    );
    expect(screen.getByText('尚無符文系統資料')).toBeInTheDocument();
  });

  it('shows count and highest level per rune type', () => {
    const runes = [
      { symbol_name: '祕法符文 : 消失城市', symbol_level: 10 },
      { symbol_name: '祕法符文 : 阿爾卡納', symbol_level: 15 },
      { symbol_name: '真實符文 : 陽平原', symbol_level: 5 },
    ];
    render(
      <TestWrapper>
        <RuneSummaryCard runes={runes} />
      </TestWrapper>
    );

    expect(screen.getByText('秘法符文')).toBeInTheDocument();
    expect(screen.getByText('2 件')).toBeInTheDocument();
    expect(screen.getByText('最高 Lv.15')).toBeInTheDocument();
    expect(screen.getByText('真實符文')).toBeInTheDocument();
    expect(screen.getByText('1 件')).toBeInTheDocument();
    expect(screen.queryByText('豪華真實符文')).not.toBeInTheDocument();
  });
});
