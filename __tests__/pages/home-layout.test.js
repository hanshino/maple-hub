import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../../app/page.js';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the components and APIs
jest.mock('../../components/CharacterCard.js', () => {
  return function MockCharacterCard({ character }) {
    return <div data-testid="character-card">{character.character_name}</div>;
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

import { apiCall, batchApiCalls } from '../../lib/apiUtils.js';

describe('Home Page Layout', () => {
  const mockCharacter = {
    ocid: 'test-ocid-123',
    character_name: 'Test Character',
    character_class_level: 6,
    character_level: 250,
    character_exp_rate: '75.0',
  };

  const mockOcidResponse = { ocid: 'test-ocid-123' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for character search
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOcidResponse),
    });

    // Mock the API calls for character data
    apiCall.mockImplementation(url => {
      if (url.includes('/api/characters/')) {
        return Promise.resolve({
          status: 200,
          data: mockCharacter,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    batchApiCalls.mockResolvedValue([{ status: 200, data: mockCharacter }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders single-row grid layout for level 6 character', async () => {
    const highLevelCharacter = { ...mockCharacter, character_class_level: 6 };

    // Mock fetch for character search
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOcidResponse),
    });

    // Mock the API calls for character data
    apiCall.mockImplementation(url => {
      if (url.includes('/api/characters/')) {
        return Promise.resolve({
          status: 200,
          data: highLevelCharacter,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    batchApiCalls.mockResolvedValue([
      { status: 200, data: highLevelCharacter },
    ]);

    render(<Home />);

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

    // Mock fetch for character search
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOcidResponse),
    });

    // Mock the API calls for character data
    apiCall.mockImplementation(url => {
      if (url.includes('/api/characters/')) {
        return Promise.resolve({
          status: 200,
          data: lowLevelCharacter,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    batchApiCalls.mockResolvedValue([{ status: 200, data: lowLevelCharacter }]);

    render(<Home />);

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
    render(<Home />);

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
