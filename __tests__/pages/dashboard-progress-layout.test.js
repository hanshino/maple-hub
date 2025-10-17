import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardProgressPage from '../../app/dashboard-progress/page.js';

// Mock the components and APIs
jest.mock('../../components/CharacterCard.js', () => {
  return function MockCharacterCard({ character }) {
    return <div data-testid="character-card">{character.name}</div>;
  };
});

jest.mock('../../components/HexaMatrixProgress.js', () => {
  return function MockHexaMatrixProgress({ character }) {
    return character.character_class_level >= 6 ? (
      <div data-testid="hexa-matrix-progress">Hexa Matrix Progress</div>
    ) : null;
  };
});

jest.mock('../../lib/apiUtils.js');

import { apiCall, sequentialApiCalls } from '../../lib/apiUtils.js';

describe('Dashboard Progress Page Layout', () => {
  const mockCharacter = {
    ocid: 'test-ocid-123',
    name: 'Test Character',
    character_class_level: 6,
    level: 250,
    character_exp_rate: '75.0',
  };

  const mockOcidResponse = { ocid: 'test-ocid-123' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the API calls
    apiCall.mockImplementation(url => {
      if (url.includes('/api/character/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOcidResponse),
        });
      } else if (url.includes('/api/characters/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCharacter),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    sequentialApiCalls.mockResolvedValue([
      { ok: true, json: () => Promise.resolve(mockCharacter) },
    ]);
  });

  test('renders single-row grid layout for level 6 character', async () => {
    render(<DashboardProgressPage />);

    // Fill in the search form
    const input = screen.getByPlaceholderText('輸入角色名稱');
    const button = screen.getByRole('button', { name: '搜尋' });

    fireEvent.change(input, { target: { value: 'Test Character' } });
    fireEvent.click(button);

    await waitFor(() => {
      // Check that the page renders the grid
      expect(screen.getByTestId('character-card')).toBeInTheDocument();
    });

    // Check for single row elements (character info, progress, and hexa matrix)
    expect(screen.getByTestId('character-card')).toBeInTheDocument();

    // Check for hexa matrix progress in the same row
    expect(screen.getByTestId('hexa-matrix-progress')).toBeInTheDocument();
  });

  test('renders single row for characters below level 6', async () => {
    const lowLevelCharacter = { ...mockCharacter, character_class_level: 5 };

    apiCall.mockImplementation(url => {
      if (url.includes('/api/character/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOcidResponse),
        });
      } else if (url.includes('/api/characters/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(lowLevelCharacter),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    sequentialApiCalls.mockResolvedValue([
      { ok: true, json: () => Promise.resolve(lowLevelCharacter) },
    ]);

    render(<DashboardProgressPage />);

    // Fill in the search form
    const input = screen.getByPlaceholderText('輸入角色名稱');
    const button = screen.getByRole('button', { name: '搜尋' });

    fireEvent.change(input, { target: { value: 'Test Character' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('character-card')).toBeInTheDocument();
    });

    // Check for first row elements
    expect(screen.getByTestId('character-card')).toBeInTheDocument();

    // Hexa matrix progress should not be rendered
    expect(
      screen.queryByTestId('hexa-matrix-progress')
    ).not.toBeInTheDocument();
  });

  test('displays character information in first row', async () => {
    render(<DashboardProgressPage />);

    // Fill in the search form
    const input = screen.getByPlaceholderText('輸入角色名稱');
    const button = screen.getByRole('button', { name: '搜尋' });

    fireEvent.change(input, { target: { value: 'Test Character' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('character-card')).toBeInTheDocument();
    });

    // Verify character card shows the character name
    expect(screen.getByTestId('character-card')).toHaveTextContent(
      'Test Character'
    );
  });
});
