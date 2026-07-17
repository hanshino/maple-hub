import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EquipmentSection from '../../../components/equipment/EquipmentSection';

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const makeItem = (name, slot, overrides = {}) => ({
  item_name: name,
  item_equipment_slot: slot,
  item_icon: `${name}.png`,
  ...overrides,
});

const setDesktopMediaQuery = matches => {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
};

describe('EquipmentSection', () => {
  beforeEach(() => {
    setDesktopMediaQuery(false);
  });
  it('renders cards from the new equipment_presets contract and supports switching presets', () => {
    const equipmentData = {
      equipment_presets: {
        active: 1,
        presets: {
          1: [makeItem('帽子A', '帽子')],
          2: [makeItem('帽子B', '帽子')],
        },
      },
    };
    render(
      <TestWrapper>
        <EquipmentSection equipmentData={equipmentData} />
      </TestWrapper>
    );

    expect(screen.getByText('帽子A')).toBeInTheDocument();
    expect(screen.getByText('使用中')).toBeInTheDocument();

    fireEvent.click(screen.getByText('預設 2'));
    expect(screen.getByText('帽子B')).toBeInTheDocument();
    expect(screen.queryByText('帽子A')).not.toBeInTheDocument();
  });

  it('retains independent current items in every equipment_presets preset', () => {
    const equipmentData = {
      item_equipment: [
        makeItem('使用中的帽子', '帽子'),
        makeItem('獨立圖騰一', '圖騰'),
        makeItem('獨立圖騰二', '圖騰'),
      ],
      equipment_presets: {
        active: 1,
        presets: {
          1: [makeItem('預設一帽子', '帽子')],
          2: [makeItem('預設二帽子', '帽子')],
        },
      },
    };

    render(
      <TestWrapper>
        <EquipmentSection equipmentData={equipmentData} />
      </TestWrapper>
    );

    expect(screen.getByText('預設一帽子')).toBeInTheDocument();
    expect(screen.getByText('獨立圖騰一')).toBeInTheDocument();
    expect(screen.getByText('獨立圖騰二')).toBeInTheDocument();
    expect(screen.queryByText('使用中的帽子')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('預設 2'));
    expect(screen.getByText('預設二帽子')).toBeInTheDocument();
    expect(screen.getByText('獨立圖騰一')).toBeInTheDocument();
    expect(screen.getByText('獨立圖騰二')).toBeInTheDocument();
    expect(screen.queryByText('使用中的帽子')).not.toBeInTheDocument();
  });

  it('falls back to legacy preset_no + item_equipment_preset_N fields when equipment_presets is absent', () => {
    const equipmentData = {
      preset_no: 1,
      item_equipment: [makeItem('基礎武器', '武器')],
      item_equipment_preset_1: [makeItem('武器一', '武器')],
      item_equipment_preset_2: [makeItem('武器二', '武器')],
    };
    render(
      <TestWrapper>
        <EquipmentSection equipmentData={equipmentData} />
      </TestWrapper>
    );

    expect(screen.getByText('武器一')).toBeInTheDocument();

    fireEvent.click(screen.getByText('預設 2'));
    expect(screen.getByText('武器二')).toBeInTheDocument();
  });

  it('uses the base equipment as preset 1 when legacy preset arrays are empty', () => {
    const equipmentData = {
      preset_no: 1,
      item_equipment: [makeItem('基礎帽子', '帽子')],
      item_equipment_preset_1: [],
      item_equipment_preset_2: [],
      item_equipment_preset_3: [],
    };

    render(
      <TestWrapper>
        <EquipmentSection equipmentData={equipmentData} />
      </TestWrapper>
    );

    expect(screen.getByText('基礎帽子')).toBeInTheDocument();
    expect(screen.queryByText('預設 2')).not.toBeInTheDocument();
  });

  it('keeps legacy presets isolated while retaining independent current items and duplicate slots', () => {
    const equipmentData = {
      preset_no: 1,
      item_equipment: [
        makeItem('使用中的帽子', '帽子'),
        makeItem('獨立圖騰一', '圖騰'),
        makeItem('獨立圖騰二', '圖騰'),
      ],
      item_equipment_preset_1: [makeItem('預設一帽子', '帽子')],
      item_equipment_preset_2: [makeItem('預設二帽子', '帽子')],
    };
    render(
      <TestWrapper>
        <EquipmentSection equipmentData={equipmentData} />
      </TestWrapper>
    );

    const initialItems = screen
      .getAllByRole('button')
      .map(element => element.getAttribute('aria-label'));
    expect(initialItems).toEqual(
      expect.arrayContaining(['預設一帽子', '獨立圖騰一', '獨立圖騰二'])
    );
    expect(initialItems.indexOf('預設一帽子')).toBeLessThan(
      initialItems.indexOf('獨立圖騰一')
    );
    expect(initialItems.indexOf('獨立圖騰一')).toBeLessThan(
      initialItems.indexOf('獨立圖騰二')
    );
    expect(screen.queryByText('使用中的帽子')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('預設 2'));
    expect(screen.getByText('預設二帽子')).toBeInTheDocument();
    expect(screen.getByText('獨立圖騰一')).toBeInTheDocument();
    expect(screen.getByText('獨立圖騰二')).toBeInTheDocument();
    expect(screen.queryByText('預設一帽子')).not.toBeInTheDocument();
    expect(screen.queryByText('使用中的帽子')).not.toBeInTheDocument();
  });

  it('uses legacy base equipment as preset 1 when no preset arrays exist', () => {
    render(
      <TestWrapper>
        <EquipmentSection
          equipmentData={{ item_equipment: [makeItem('基礎武器', '武器')] }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('基礎武器')).toBeInTheDocument();
    expect(screen.queryByLabelText('裝備預設選擇')).not.toBeInTheDocument();
  });

  it('shows an empty state when no equipment data exists for the current preset', () => {
    render(
      <TestWrapper>
        <EquipmentSection equipmentData={null} />
      </TestWrapper>
    );
    expect(screen.getByText('此預設尚無裝備資料')).toBeInTheDocument();
  });

  it('renders cash equipment as a grid on desktop', () => {
    setDesktopMediaQuery(true);
    const cashEquipmentData = {
      cash_item_equipment_base: [
        {
          cash_item_name: '現金帽子',
          cash_item_icon: 'cash-hat.png',
          cash_item_equipment_slot: '帽子',
        },
      ],
    };
    render(
      <TestWrapper>
        <EquipmentSection
          equipmentData={null}
          cashEquipmentData={cashEquipmentData}
          characterImage="character.png"
        />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText('現金裝備'));
    expect(screen.getByAltText('角色')).toBeInTheDocument();
    expect(screen.getByAltText('現金帽子')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '帽子：現金帽子' })
    ).toBeInTheDocument();
  });

  it('renders cash equipment as a list on mobile and opens its detail drawer', () => {
    const cashEquipmentData = {
      cash_item_equipment_base: [
        {
          cash_item_name: '現金帽子',
          cash_item_icon: 'cash-hat.png',
          cash_item_equipment_slot: '帽子',
          cash_item_equipment_part: '帽子',
        },
      ],
    };
    render(
      <TestWrapper>
        <EquipmentSection
          equipmentData={null}
          cashEquipmentData={cashEquipmentData}
        />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText('現金裝備'));
    const cashHat = screen.getByRole('button', { name: '帽子：現金帽子' });
    expect(cashHat).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '防具' })).toBeInTheDocument();

    fireEvent.click(cashHat);
    expect(screen.getAllByText('現金帽子')).toHaveLength(2);
  });

  it('shows the pet empty state gracefully when pet fields are null', () => {
    render(
      <TestWrapper>
        <EquipmentSection equipmentData={null} petEquipmentData={null} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText('寵物'));
    expect(screen.getByText('尚無寵物資料')).toBeInTheDocument();
  });

  it('renders pet cards via the existing PetEquipmentPanel when pet data exists', () => {
    const petEquipmentData = {
      pet_1_name: '啾啾',
      pet_1_nickname: '小啾',
      pet_1_icon: 'pet.png',
    };
    render(
      <TestWrapper>
        <EquipmentSection
          equipmentData={null}
          petEquipmentData={petEquipmentData}
        />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText('寵物'));
    expect(screen.getByText('小啾')).toBeInTheDocument();
  });

  it('opens the equipment detail drawer when a card is clicked', () => {
    const equipmentData = {
      equipment_presets: {
        active: 1,
        presets: {
          1: [
            makeItem('可點擊武器', '武器', {
              potential_option_1: 'LUK : +9%',
            }),
          ],
        },
      },
    };
    render(
      <TestWrapper>
        <EquipmentSection equipmentData={equipmentData} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText('可點擊武器'));
    // The drawer renders a second, larger copy of the item name.
    expect(screen.getAllByText('可點擊武器').length).toBeGreaterThan(1);
  });
});
