import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import HexaSummaryCard from '../../../components/summary/HexaSummaryCard';

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('HexaSummaryCard', () => {
  it('shows an empty state when there is no hexa core data', () => {
    render(
      <TestWrapper>
        <HexaSummaryCard hexaCoreData={null} hexaStatData={null} />
      </TestWrapper>
    );
    expect(screen.getByText('尚無六轉核心資料')).toBeInTheDocument();
  });

  it('shows unlocked badge and completion percentage when cores exist', () => {
    const hexaCoreData = {
      character_hexa_core_equipment: [
        {
          hexa_core_name: '第六感',
          hexa_core_level: 1,
          hexa_core_type: '技能核心',
        },
      ],
    };
    render(
      <TestWrapper>
        <HexaSummaryCard hexaCoreData={hexaCoreData} hexaStatData={null} />
      </TestWrapper>
    );

    expect(screen.getByText('六轉已解鎖')).toBeInTheDocument();
    expect(screen.getByText('裝備核心完成度')).toBeInTheDocument();
  });

  it('keeps equipment completion percentage unchanged when stat cores change', () => {
    const hexaCoreData = {
      character_hexa_core_equipment: [
        {
          hexa_core_name: '第六感',
          hexa_core_level: 1,
          hexa_core_type: '技能核心',
        },
      ],
    };
    const { rerender } = render(
      <TestWrapper>
        <HexaSummaryCard hexaCoreData={hexaCoreData} hexaStatData={null} />
      </TestWrapper>
    );
    const equipmentOnlyPercentage =
      screen.getByText('裝備核心完成度').previousSibling.textContent;

    rerender(
      <TestWrapper>
        <HexaSummaryCard
          hexaCoreData={hexaCoreData}
          hexaStatData={{
            character_hexa_stat_core: [{ stat_grade: 10 }, { stat_grade: 10 }],
          }}
        />
      </TestWrapper>
    );

    expect(
      screen.getByText(
        (_, element) => element?.textContent === equipmentOnlyPercentage
      )
    ).toBeInTheDocument();
  });

  it('shows maxed core count when a core reaches level 30', () => {
    const hexaCoreData = {
      character_hexa_core_equipment: [
        {
          hexa_core_name: '第六感',
          hexa_core_level: 30,
          hexa_core_type: '技能核心',
        },
      ],
    };
    render(
      <TestWrapper>
        <HexaSummaryCard hexaCoreData={hexaCoreData} hexaStatData={null} />
      </TestWrapper>
    );

    expect(screen.getByText('核心滿級 x1')).toBeInTheDocument();
  });
});
