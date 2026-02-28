import { render, screen } from '@testing-library/react';
import EquipmentList from '../../components/EquipmentList';

const mockEquipment = {
  hat: {
    item_name: 'Test Hat',
    item_icon: 'hat.png',
    item_equipment_slot: '帽子',
    starforce: '22',
  },
  weapon: {
    item_name: 'Test Weapon',
    item_icon: 'weapon.png',
    item_equipment_slot: '武器',
  },
};

describe('EquipmentList', () => {
  it('renders group headers', () => {
    render(
      <EquipmentList
        equipment={mockEquipment}
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    const headings = screen.getAllByRole('heading');
    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts).toContain('武器');
    expect(headingTexts).toContain('防具');
  });

  it('only renders slots that have equipment', () => {
    render(
      <EquipmentList
        equipment={mockEquipment}
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    expect(screen.getByText('Test Hat')).toBeInTheDocument();
    expect(screen.getByText('Test Weapon')).toBeInTheDocument();
    // Should NOT render empty slots
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('does not render group with no equipped items', () => {
    render(
      <EquipmentList
        equipment={{ hat: mockEquipment.hat }}
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    // 飾品 group should not appear since no accessories are equipped
    expect(screen.queryByText('飾品')).not.toBeInTheDocument();
  });

  it('shows empty state when no equipment', () => {
    render(
      <EquipmentList
        equipment={{}}
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    expect(
      screen.getByText('此角色目前沒有裝備資料')
    ).toBeInTheDocument();
  });
});
