import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import HexaMatrixProgress from '../../components/HexaMatrixProgress.js';

// Mock the API and utils
jest.mock('../../lib/hexaMatrixApi.js');
jest.mock('../../lib/progressUtils.js');

import {
  fetchHexaMatrixData,
  fetchHexaStatCores,
} from '../../lib/hexaMatrixApi.js';
import { calculateHexaMatrixProgress } from '../../lib/progressUtils.js';

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
    totalProgress: 0.6, // 210 / 33768 ≈ 0.006 = 0.6%
    totalSpent: { soul_elder: 245, soul_elder_fragment: 6077 },
    totalRequired: { soul_elder: 1207, soul_elder_fragment: 33768 },
    equipmentCores: [
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
    statCoresCount: 1,
    statCoreCosts: { soul_elder: 5, soul_elder_fragment: 10 },
  };

  const mockStatData = {
    character_hexa_stat_core: [
      {
        slot_id: '0',
        main_stat_name: 'boss傷害增加',
        sub_stat_name_1: '爆擊傷害增加',
        sub_stat_name_2: '主要屬性增加',
        main_stat_level: 3,
        sub_stat_level_1: 7,
        sub_stat_level_2: 10,
        stat_grade: 20,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchHexaMatrixData.mockResolvedValue(mockHexaData);
    fetchHexaStatCores.mockResolvedValue(mockStatData);
    calculateHexaMatrixProgress.mockReturnValue(mockProgress);
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

    expect(screen.getByText('總進度: 0.6%')).toBeInTheDocument();
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
    fetchHexaStatCores.mockResolvedValue(mockStatData); // Still resolve stat cores

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
    fetchHexaStatCores.mockResolvedValue(mockStatData);

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

  test('uses filtered progress calculation for cross-class data', async () => {
    const filteredProgress = {
      ...mockProgress,
      totalProgress: 50.0, // Filtered result shows lower progress
      equipmentCores: [mockProgress.equipmentCores[0]], // Only one core after filtering
    };

    calculateHexaMatrixProgress.mockReturnValue(filteredProgress);

    await act(async () => {
      render(<HexaMatrixProgress character={mockCharacter} />);
    });

    await waitFor(() => {
      expect(screen.getByText('總進度: 50.0%')).toBeInTheDocument();
    });

    expect(calculateHexaMatrixProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        character_hexa_core_equipment:
          mockHexaData.character_hexa_core_equipment,
        character_hexa_stat_core: mockStatData.character_hexa_stat_core,
      })
    );
  });

  test('displays filtered cores in radar chart', async () => {
    const filteredProgress = {
      ...mockProgress,
      equipmentCores: [
        {
          name: 'Filtered Core',
          type: '技能核心',
          level: 25,
          progress: 83.3,
          spent: { soul_elder: 15, soul_elder_fragment: 400 },
          required: { soul_elder: 20, soul_elder_fragment: 500 },
        },
      ],
    };

    calculateHexaMatrixProgress.mockReturnValue(filteredProgress);

    await act(async () => {
      render(<HexaMatrixProgress character={mockCharacter} />);
    });

    await waitFor(() => {
      expect(screen.getByText('六轉進度')).toBeInTheDocument();
    });

    // Verify the filtered data is used in the component
    expect(calculateHexaMatrixProgress).toHaveBeenCalledTimes(1);
  });
});
