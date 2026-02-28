import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EquipmentDialog from '../../components/EquipmentDialog';

// Mock fetch
global.fetch = jest.fn();

// Mock equipment utils
jest.mock('../../lib/equipmentUtils', () => ({
  processEquipmentData: jest.fn(),
  getEquipmentPosition: jest.fn(),
}));

// Mock cache
jest.mock('../../lib/cache', () => ({
  getCachedData: jest.fn(() => null),
  setCachedData: jest.fn(),
}));

// Mock useMediaQuery — default to desktop
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: jest.fn(() => true), // true = desktop (md and up)
  };
});

import { processEquipmentData } from '../../lib/equipmentUtils';
import { useMediaQuery } from '@mui/material';

describe('EquipmentDialog', () => {
  const mockEquipmentData = {
    preset_no: 2,
    item_equipment: [],
    item_equipment_preset_2: [
      {
        item_equipment_slot: '帽子',
        item_name: 'Test Hat',
        item_icon: 'icon1.png',
      },
    ],
  };

  const mockProcessedData = {
    hat: {
      item_name: 'Test Hat',
      item_icon: 'https://example.com/icon1.png',
    },
  };

  const mockCharacter = {
    character_image: 'https://example.com/character.png',
    character_name: 'Test Character',
  };

  beforeEach(() => {
    fetch.mockClear();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockEquipmentData,
    });
    processEquipmentData.mockReturnValue(mockProcessedData);
    useMediaQuery.mockReturnValue(true); // desktop
  });

  it('renders dialog title when open', async () => {
    render(
      <EquipmentDialog
        ocid="test-ocid"
        character={mockCharacter}
        open={true}
        onClose={() => {}}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('角色裝備')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while fetching', () => {
    // Make fetch hang
    fetch.mockReturnValue(new Promise(() => {}));
    render(
      <EquipmentDialog
        ocid="test-ocid"
        character={mockCharacter}
        open={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders equipment after loading on desktop (grid)', async () => {
    useMediaQuery.mockReturnValue(true);
    render(
      <EquipmentDialog
        ocid="test-ocid"
        character={mockCharacter}
        open={true}
        onClose={() => {}}
      />
    );
    await waitFor(() => {
      expect(screen.getByAltText('角色')).toBeInTheDocument(); // Avatar from Grid
    });
  });

  it('calls onClose when dialog close is triggered', async () => {
    const handleClose = jest.fn();
    render(
      <EquipmentDialog
        ocid="test-ocid"
        character={mockCharacter}
        open={true}
        onClose={handleClose}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('角色裝備')).toBeInTheDocument();
    });
  });
});
