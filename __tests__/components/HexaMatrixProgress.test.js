import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import HexaMatrixProgress from '../../components/HexaMatrixProgress.js';

// Mock the API and utils
jest.mock('../../lib/hexaMatrixApi.js');
jest.mock('../../lib/hexaMatrixUtils.js');

import { fetchHexaMatrixData } from '../../lib/hexaMatrixApi.js';
import { calculateOverallProgress } from '../../lib/hexaMatrixUtils.js';

describe('HexaMatrixProgress', () => {
  const mockCharacter = {
    ocid: 'test-ocid-123',
    character_name: 'Test Character',
    character_class_level: 6,
  };

  const mockHexaData = {
    character_hexa_core_equipment: [
      {
        hexa_core_name: 'Test Core 1',
        hexa_core_level: 30,
        hexa_core_type: '技能核心',
        linked_skill: [{ hexa_skill_id: 'Skill 1' }],
      },
      {
        hexa_core_name: 'Test Core 2',
        hexa_core_level: 15,
        hexa_core_type: '精通核心',
        linked_skill: [{ hexa_skill_id: 'Skill 2' }],
      },
    ],
  };

  const mockProgress = {
    totalProgress: 75.5,
    totalSpent: { soul_elder: 100, soul_elder_fragment: 200 },
    totalRequired: { soul_elder: 150, soul_elder_fragment: 300 },
    coreProgress: [
      {
        name: 'Test Core 1',
        type: '技能核心',
        level: 30,
        progress: 100,
        spent: { soul_elder: 20, soul_elder_fragment: 500 },
        required: { soul_elder: 20, soul_elder_fragment: 500 },
      },
      {
        name: 'Test Core 2',
        type: '精通核心',
        level: 15,
        progress: 50,
        spent: { soul_elder: 80, soul_elder_fragment: 150 },
        required: { soul_elder: 160, soul_elder_fragment: 300 },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchHexaMatrixData.mockResolvedValue(mockHexaData);
    calculateOverallProgress.mockReturnValue(mockProgress);
  });

  test('renders loading state initially', () => {
    render(<HexaMatrixProgress character={mockCharacter} />);

    expect(screen.getByText('Loading Hexa Matrix data...')).toBeInTheDocument();
  });

  test('renders Hexa Matrix progress when data loads successfully', async () => {
    let component;
    await act(async () => {
      component = render(<HexaMatrixProgress character={mockCharacter} />);
    });

    await waitFor(() => {
      expect(screen.getByText('六轉進度')).toBeInTheDocument();
    });

    expect(screen.getByText('總進度: 75.5%')).toBeInTheDocument();
    // Check that the component renders without crashing
    expect(component.container).toBeInTheDocument();
  });

  test('does not render for characters below level 6', () => {
    const lowLevelCharacter = { ...mockCharacter, character_class_level: 5 };

    const { container } = render(
      <HexaMatrixProgress character={lowLevelCharacter} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders error message when API fails', async () => {
    fetchHexaMatrixData.mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(<HexaMatrixProgress character={mockCharacter} />);
    });

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load Hexa Matrix data: API Error')
      ).toBeInTheDocument();
    });
  });

  test('renders message when no Hexa Matrix data available', async () => {
    fetchHexaMatrixData.mockResolvedValue({
      character_hexa_core_equipment: [],
    });

    await act(async () => {
      render(<HexaMatrixProgress character={mockCharacter} />);
    });

    await waitFor(() => {
      expect(
        screen.getByText('No Hexa Matrix data available for this character.')
      ).toBeInTheDocument();
    });
  });

  test('calls API with correct OCID', async () => {
    await act(async () => {
      render(<HexaMatrixProgress character={mockCharacter} />);
    });

    await waitFor(() => {
      expect(fetchHexaMatrixData).toHaveBeenCalledWith(mockCharacter.ocid);
    });
  });
});
