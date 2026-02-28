import { render, screen, fireEvent } from '@testing-library/react';
import EquipmentSlot from '../../components/EquipmentSlot';

const mockItem = {
  item_name: 'Arcane Umbra Hat',
  item_icon: 'https://example.com/hat.png',
  item_equipment_slot: '帽子',
  starforce: '22',
  item_level: '200',
};

describe('EquipmentSlot', () => {
  describe('grid variant', () => {
    it('renders equipped slot with icon and name', () => {
      render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByAltText('Arcane Umbra Hat')).toBeInTheDocument();
      expect(screen.getByText('帽子')).toBeInTheDocument();
    });

    it('renders empty slot with dashed border', () => {
      const { container } = render(
        <EquipmentSlot
          item={null}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByText('帽子')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={false}
          onClick={handleClick}
        />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledWith('hat');
    });

    it('shows selected state', () => {
      const { container } = render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={true}
          onClick={() => {}}
        />
      );
      const slot = screen.getByRole('button');
      expect(slot).toHaveAttribute('aria-pressed', 'true');
    });

    it('has correct aria-label', () => {
      render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        '帽子：Arcane Umbra Hat'
      );
    });

    it('has empty aria-label when no item', () => {
      render(
        <EquipmentSlot
          item={null}
          slotKey="hat"
          slotName="帽子"
          variant="grid"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        '帽子：空'
      );
    });
  });

  describe('list variant', () => {
    it('renders item name and slot name', () => {
      render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="list"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByText('Arcane Umbra Hat')).toBeInTheDocument();
      expect(screen.getByText('帽子')).toBeInTheDocument();
    });

    it('shows starforce and level in list mode', () => {
      render(
        <EquipmentSlot
          item={mockItem}
          slotKey="hat"
          slotName="帽子"
          variant="list"
          selected={false}
          onClick={() => {}}
        />
      );
      expect(screen.getByText(/22/)).toBeInTheDocument();
      expect(screen.getByText(/Lv\. 200/)).toBeInTheDocument();
    });
  });
});
