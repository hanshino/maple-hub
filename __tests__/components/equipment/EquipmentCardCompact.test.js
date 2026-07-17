import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EquipmentCardCompact from '../../../components/equipment/EquipmentCardCompact';

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('EquipmentCardCompact', () => {
  it('renders an empty slot placeholder gracefully when no item exists', () => {
    render(
      <TestWrapper>
        <EquipmentCardCompact item={null} slotName="帽子" />
      </TestWrapper>
    );
    expect(screen.getByText('帽子')).toBeInTheDocument();
  });

  it('renders name, starforce, potential grade, and a percent stat summary', () => {
    const item = {
      item_name: '黑魔法師的絕望',
      item_icon: 'weapon.png',
      starforce: '22',
      potential_option_grade: '傳說',
      potential_option_1: 'LUK : +9%',
    };
    render(
      <TestWrapper>
        <EquipmentCardCompact item={item} onClick={() => {}} />
      </TestWrapper>
    );
    expect(screen.getByText('黑魔法師的絕望')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('傳說')).toBeInTheDocument();
    expect(screen.getByText('LUK +9%')).toBeInTheDocument();
  });

  it('falls back to item_total_option when no potential lines parse', () => {
    const item = {
      item_name: '祕法之痕武器',
      item_total_option: { all_stat: '15', str: '10' },
    };
    render(
      <TestWrapper>
        <EquipmentCardCompact item={item} onClick={() => {}} />
      </TestWrapper>
    );
    expect(screen.getByText('全屬性 +15%')).toBeInTheDocument();
  });

  it('shows a neutral placeholder when no potential or stat data exists', () => {
    const item = { item_name: '素質武器' };
    render(
      <TestWrapper>
        <EquipmentCardCompact item={item} onClick={() => {}} />
      </TestWrapper>
    );
    expect(screen.getByText('尚無潛能資訊')).toBeInTheDocument();
  });

  it('does not render a starforce row when starforce is absent or zero', () => {
    const item = { item_name: '無星力武器', starforce: '0' };
    render(
      <TestWrapper>
        <EquipmentCardCompact item={item} onClick={() => {}} />
      </TestWrapper>
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onClick with the item when clicked', () => {
    const handleClick = jest.fn();
    const item = { item_name: '測試武器' };
    render(
      <TestWrapper>
        <EquipmentCardCompact item={item} onClick={handleClick} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText('測試武器'));
    expect(handleClick).toHaveBeenCalledWith(item);
  });

  it('uses 24px padding for populated and empty cards', () => {
    const item = { item_name: '有裝備的卡片' };
    render(
      <TestWrapper>
        <EquipmentCardCompact item={item} />
        <EquipmentCardCompact item={null} slotName="帽子" />
      </TestWrapper>
    );

    expect(
      getComputedStyle(screen.getByRole('button', { name: '有裝備的卡片' }))
        .padding
    ).toBe('24px');
    expect(getComputedStyle(screen.getByLabelText('帽子：空')).padding).toBe(
      '24px'
    );
  });
});
