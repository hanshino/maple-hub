import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SpecialEquipmentPanel, {
  isSpecialEquipmentSlot,
} from '../../../components/equipment/SpecialEquipmentPanel';

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const makePuzzlePiece = (n, overrides = {}) => ({
  item_name: `拼圖${n}名稱`,
  item_equipment_slot: `拼圖${n}`,
  item_icon: `puzzle-${n}.png`,
  item_total_option: {},
  ...overrides,
});

describe('isSpecialEquipmentSlot', () => {
  it('matches puzzle, totem, ring, and gem slots', () => {
    expect(isSpecialEquipmentSlot('拼圖1')).toBe(true);
    expect(isSpecialEquipmentSlot('拼圖12')).toBe(true);
    expect(isSpecialEquipmentSlot('圖騰1')).toBe(true);
    expect(isSpecialEquipmentSlot('圖騰2')).toBe(true);
    expect(isSpecialEquipmentSlot('輔助特殊技能戒指')).toBe(true);
    expect(isSpecialEquipmentSlot('寶石')).toBe(true);
  });

  it('does not match normal slots or falsy input', () => {
    expect(isSpecialEquipmentSlot('帽子')).toBe(false);
    expect(isSpecialEquipmentSlot('輔助武器')).toBe(false);
    expect(isSpecialEquipmentSlot(undefined)).toBe(false);
    expect(isSpecialEquipmentSlot('')).toBe(false);
  });
});

describe('SpecialEquipmentPanel', () => {
  it('returns null when items is empty', () => {
    const { container } = render(
      <TestWrapper>
        <SpecialEquipmentPanel items={[]} />
      </TestWrapper>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders 12 puzzle pieces placed by slot number, not array order', () => {
    const items = [
      makePuzzlePiece(12),
      makePuzzlePiece(1),
      makePuzzlePiece(4),
      ...[2, 3, 5, 6, 7, 8, 9, 10, 11].map(n => makePuzzlePiece(n)),
    ];
    render(
      <TestWrapper>
        <SpecialEquipmentPanel items={items} />
      </TestWrapper>
    );

    const piece1 = screen.getByAltText('拼圖1名稱');
    const piece4 = screen.getByAltText('拼圖4名稱');
    const piece12 = screen.getByAltText('拼圖12名稱');

    expect(piece1).toHaveAttribute('src', 'puzzle-1.png');
    expect(getComputedStyle(piece1).gridColumn).toBe('1');
    expect(getComputedStyle(piece1).gridRow).toBe('1');

    expect(getComputedStyle(piece4).gridColumn).toBe('1');
    expect(getComputedStyle(piece4).gridRow).toBe('2');

    expect(getComputedStyle(piece12).gridColumn).toBe('3');
    expect(getComputedStyle(piece12).gridRow).toBe('4');

    expect(screen.getByText('12 / 12 片')).toBeInTheDocument();
  });

  it('leaves a hole for a missing piece instead of shifting the layout', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map(n =>
      makePuzzlePiece(n)
    );
    render(
      <TestWrapper>
        <SpecialEquipmentPanel items={items} />
      </TestWrapper>
    );

    expect(screen.getAllByRole('img')).toHaveLength(11);
    expect(screen.queryByAltText('拼圖11名稱')).not.toBeInTheDocument();

    const piece12 = screen.getByAltText('拼圖12名稱');
    expect(getComputedStyle(piece12).gridColumn).toBe('3');
    expect(getComputedStyle(piece12).gridRow).toBe('4');
    expect(screen.getByText('11 / 12 片')).toBeInTheDocument();
  });

  it('sums attack and magic separately, each under its own label', () => {
    const items = [
      makePuzzlePiece(1, {
        item_total_option: { attack_power: '10', magic_power: '0' },
      }),
      makePuzzlePiece(2, {
        item_total_option: { attack_power: '20', magic_power: '0' },
      }),
      makePuzzlePiece(3, {
        item_total_option: { attack_power: '0', magic_power: '5' },
      }),
    ];
    render(
      <TestWrapper>
        <SpecialEquipmentPanel items={items} />
      </TestWrapper>
    );

    expect(screen.getByText('攻擊力合計 +30、魔力合計 +5')).toBeInTheDocument();
  });

  it('labels a magic-only puzzle set as 魔力, never 攻擊力', () => {
    const items = [1, 2, 3].map(n =>
      makePuzzlePiece(n, {
        item_total_option: { attack_power: '0', magic_power: '20' },
      })
    );
    render(
      <TestWrapper>
        <SpecialEquipmentPanel items={items} />
      </TestWrapper>
    );

    expect(screen.getByText('魔力合計 +60')).toBeInTheDocument();
    expect(screen.queryByText(/攻擊力合計/)).not.toBeInTheDocument();
  });

  it('omits the totals line when all pieces carry zero attack and magic', () => {
    const items = [1, 2].map(n => makePuzzlePiece(n));
    render(
      <TestWrapper>
        <SpecialEquipmentPanel items={items} />
      </TestWrapper>
    );

    expect(screen.getByText('2 / 12 片')).toBeInTheDocument();
    expect(screen.queryByText(/合計/)).not.toBeInTheDocument();
  });

  it('renders totem/ring/gem tiles with name and a derived stat line', () => {
    const items = [
      {
        item_name: '獨立圖騰',
        item_equipment_slot: '圖騰1',
        item_icon: 'totem.png',
        item_total_option: { str: '10', all_stat: '5' },
      },
      {
        item_name: '永續戒指',
        item_equipment_slot: '輔助特殊技能戒指',
        item_icon: 'ring.png',
        item_total_option: {},
      },
      {
        item_name: '伊妮絲的寶玉',
        item_equipment_slot: '寶石',
        item_icon: 'gem.png',
        item_total_option: { attack_power: '7' },
      },
    ];
    render(
      <TestWrapper>
        <SpecialEquipmentPanel items={items} />
      </TestWrapper>
    );

    expect(screen.getByText('獨立圖騰')).toBeInTheDocument();
    expect(screen.getByText('STR +10、全屬性 +5%')).toBeInTheDocument();

    expect(screen.getByText('永續戒指')).toBeInTheDocument();
    expect(screen.getByText('無屬性加成')).toBeInTheDocument();

    expect(screen.getByText('伊妮絲的寶玉')).toBeInTheDocument();
    expect(screen.getByText('攻擊力 +7')).toBeInTheDocument();
  });

  it('does not attach click handlers or open any dialog/drawer on tile click', () => {
    const items = [
      {
        item_name: '獨立圖騰',
        item_equipment_slot: '圖騰1',
        item_icon: 'totem.png',
        item_total_option: {},
      },
    ];
    render(
      <TestWrapper>
        <SpecialEquipmentPanel items={items} />
      </TestWrapper>
    );

    expect(() => fireEvent.click(screen.getByText('獨立圖騰'))).not.toThrow();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('excludes non-special items such as the sub-weapon (part=寶石, slot=輔助武器)', () => {
    const items = [
      {
        item_name: '副武器',
        item_equipment_slot: '輔助武器',
        item_equipment_part: '寶石',
        item_icon: 'sub-weapon.png',
        item_total_option: {},
      },
    ];
    const { container } = render(
      <TestWrapper>
        <SpecialEquipmentPanel items={items} />
      </TestWrapper>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
