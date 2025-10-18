import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EquipmentDialog from '../../components/EquipmentDialog';

// Mock fetch
global.fetch = jest.fn();

// Mock equipment utils
jest.mock('../../lib/equipmentUtils', () => ({
  processEquipmentData: jest.fn(),
  getEquipmentPosition: jest.fn(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));

import { processEquipmentData } from '../../lib/equipmentUtils';

describe('EquipmentDialog', () => {
  const mockEquipmentData = {
    preset_no: 2,
    item_equipment: [],
    item_equipment_preset_2: [
      {
        item_equipment_part: '모자',
        item_name: 'Test Hat',
        item_icon: 'icon1.png',
      },
    ],
  };

  const mockCharacterData = {
    character_image: 'https://example.com/character.png',
    character_name: 'Test Character',
  };

  const mockProcessedData = {
    hat: {
      item_equipment_part: '모자',
      item_name: 'Test Hat',
      item_icon: 'https://example.com/icon1.png',
    },
  };

  beforeEach(() => {
    fetch.mockClear();
    // Mock equipment API
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockEquipmentData,
    });
    processEquipmentData.mockReturnValue(mockProcessedData);
  });

  it('should open dialog when button is clicked', async () => {
    render(<EquipmentDialog ocid="test-ocid" />);

    const button = screen.getByRole('button', { name: /裝備/ });
    fireEvent.click(button);

    // Check that dialog is opened
    await waitFor(() => {
      expect(screen.getByText('角色裝備')).toBeInTheDocument();
    });
  });

  it('should display equipment in grid layout', async () => {
    const mockCharacter = {
      character_image: 'https://example.com/character.png',
      character_name: 'Test Character',
    };

    render(<EquipmentDialog ocid="test-ocid" character={mockCharacter} />);

    // Click the equipment button to open dialog and load equipment
    const button = screen.getByRole('button', { name: /裝備/ });
    fireEvent.click(button);

    // Wait for equipment to load and dialog to open
    await waitFor(() => {
      expect(screen.getByText('角色裝備')).toBeInTheDocument();
      expect(screen.getByText('Test Hat')).toBeInTheDocument();
    });

    // Check for grid structure
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
