import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SetEffectSummaryCard from '../../../components/summary/SetEffectSummaryCard';

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('SetEffectSummaryCard', () => {
  it('shows an empty state when there is no set effect data', () => {
    render(
      <TestWrapper>
        <SetEffectSummaryCard data={null} />
      </TestWrapper>
    );
    expect(screen.getByText('尚無套裝效果資料')).toBeInTheDocument();
  });

  it('lists set names and piece counts, largest first', () => {
    const data = {
      set_effect: [
        { set_name: 'absolab', total_set_count: 4 },
        { set_name: 'arcane umbra', total_set_count: 6 },
      ],
    };
    render(
      <TestWrapper>
        <SetEffectSummaryCard data={data} />
      </TestWrapper>
    );

    expect(screen.getByText('arcane umbra')).toBeInTheDocument();
    expect(screen.getByText('6 件')).toBeInTheDocument();
    expect(screen.getByText('absolab')).toBeInTheDocument();
    expect(screen.getByText('4 件')).toBeInTheDocument();
  });
});
