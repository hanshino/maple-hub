import { render, screen } from '@testing-library/react';
import EquipmentGrid from '../../components/EquipmentGrid';

const mockEquipment = {
  hat: {
    item_name: 'Test Hat',
    item_icon: 'hat.png',
    item_equipment_slot: '帽子',
  },
  weapon: {
    item_name: 'Test Weapon',
    item_icon: 'weapon.png',
    item_equipment_slot: '武器',
  },
};

describe('EquipmentGrid', () => {
  it('renders character avatar', () => {
    render(
      <EquipmentGrid
        equipment={mockEquipment}
        characterImage="https://example.com/char.png"
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    expect(screen.getByAltText('角色')).toBeInTheDocument();
  });

  it('renders all 23 equipment slots', () => {
    render(
      <EquipmentGrid
        equipment={{}}
        characterImage="https://example.com/char.png"
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    const slots = screen.getAllByRole('button');
    expect(slots).toHaveLength(23);
  });

  it('renders equipped items with their names', () => {
    render(
      <EquipmentGrid
        equipment={mockEquipment}
        characterImage="https://example.com/char.png"
        selectedSlot={null}
        onSlotClick={() => {}}
      />
    );
    expect(screen.getByAltText('Test Hat')).toBeInTheDocument();
    expect(screen.getByAltText('Test Weapon')).toBeInTheDocument();
  });

  it('passes selectedSlot to the correct slot', () => {
    render(
      <EquipmentGrid
        equipment={mockEquipment}
        characterImage="https://example.com/char.png"
        selectedSlot="hat"
        onSlotClick={() => {}}
      />
    );
    const hatSlot = screen.getByLabelText('帽子：Test Hat');
    expect(hatSlot).toHaveAttribute('aria-pressed', 'true');
  });
});
