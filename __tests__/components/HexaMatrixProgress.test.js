import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import HexaMatrixProgress from '../../components/HexaMatrixProgress';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Tooltip: () => <div />,
  RadarChart: ({ children }) => <div>{children}</div>,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  Radar: () => <div />,
}));

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const hexaCoreData = {
  character_hexa_core_equipment: [
    {
      hexa_core_name: '第六感',
      hexa_core_level: 1,
      hexa_core_type: '技能核心',
    },
  ],
};

describe('HexaMatrixProgress', () => {
  it('keeps equipment completion and resource totals unchanged when stat cores change', () => {
    const { rerender } = render(
      <TestWrapper>
        <HexaMatrixProgress
          character={{ character_class_level: 6 }}
          hexaCoreData={hexaCoreData}
          hexaStatData={null}
        />
      </TestWrapper>
    );
    const equipmentOnlyPercentage =
      screen.getByText('裝備核心完成度').previousSibling.textContent;
    const equipmentOnlySoulElder = screen.getByText(/靈魂艾爾達/).textContent;
    const equipmentOnlyFragments = screen.getByText(/碎片/).textContent;

    rerender(
      <TestWrapper>
        <HexaMatrixProgress
          character={{ character_class_level: 6 }}
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
    expect(screen.getByText(equipmentOnlySoulElder)).toBeInTheDocument();
    expect(screen.getByText(equipmentOnlyFragments)).toBeInTheDocument();
  });
});
