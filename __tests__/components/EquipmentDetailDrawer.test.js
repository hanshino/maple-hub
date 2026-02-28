import { render, screen, fireEvent } from '@testing-library/react';
import EquipmentDetailDrawer from '../../components/EquipmentDetailDrawer';

const mockItem = {
  item_name: 'Arcane Umbra Hat',
  item_icon: 'https://example.com/hat.png',
  starforce: '22',
  potential_option_grade: '레전드리',
  potential_option_1: 'STR : +12%',
  potential_option_2: 'All Stats : +9%',
  potential_option_3: 'STR : +9%',
  additional_potential_option_grade: '유니크',
  additional_potential_option_1: 'STR : +10%',
  additional_potential_option_2: 'DEX : +10%',
  additional_potential_option_3: 'Attack Power : +10',
  item_total_option: {
    str: '150',
    dex: '100',
    int: '0',
    luk: '0',
    max_hp: '3000',
    attack_power: '50',
  },
};

describe('EquipmentDetailDrawer', () => {
  it('renders item name and icon when open', () => {
    render(
      <EquipmentDetailDrawer
        item={mockItem}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.getByText('Arcane Umbra Hat')).toBeInTheDocument();
    expect(screen.getByAltText('Arcane Umbra Hat')).toBeInTheDocument();
  });

  it('renders starforce', () => {
    render(
      <EquipmentDetailDrawer
        item={mockItem}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.getByText(/22/)).toBeInTheDocument();
  });

  it('renders potential options', () => {
    render(
      <EquipmentDetailDrawer
        item={mockItem}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.getByText('潛在能力')).toBeInTheDocument();
    expect(screen.getByText('STR : +12%')).toBeInTheDocument();
    expect(screen.getByText('All Stats : +9%')).toBeInTheDocument();
  });

  it('renders additional potential options', () => {
    render(
      <EquipmentDetailDrawer
        item={mockItem}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.getByText('附加潛能')).toBeInTheDocument();
    expect(screen.getByText('STR : +10%')).toBeInTheDocument();
  });

  it('does not render potential section when no potential data', () => {
    const itemNoPotential = { item_name: 'Basic Hat', item_icon: 'hat.png' };
    render(
      <EquipmentDetailDrawer
        item={itemNoPotential}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.queryByText('潛在能力')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <EquipmentDetailDrawer
        item={mockItem}
        open={true}
        onClose={handleClose}
        isMobile={false}
      />
    );
    fireEvent.click(screen.getByLabelText('關閉'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders nothing when item is null', () => {
    const { container } = render(
      <EquipmentDetailDrawer
        item={null}
        open={true}
        onClose={() => {}}
        isMobile={false}
      />
    );
    expect(screen.queryByText('潛在能力')).not.toBeInTheDocument();
  });
});
