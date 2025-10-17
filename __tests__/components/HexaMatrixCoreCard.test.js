import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HexaMatrixCoreCard from '../../components/HexaMatrixCoreCard.js';

describe('HexaMatrixCoreCard', () => {
  const mockCore = {
    name: 'Test Core',
    type: '技能核心',
    level: 15,
    progress: 50.0,
    spent: { soul_elder: 80, soul_elder_fragment: 150 },
    required: { soul_elder: 160, soul_elder_fragment: 300 },
  };

  test('renders core information correctly', () => {
    render(<HexaMatrixCoreCard core={mockCore} />);

    expect(screen.getByText('Test Core')).toBeInTheDocument();
    expect(
      screen.getByText('Type: 技能核心 | Level: 15/30')
    ).toBeInTheDocument();
    expect(screen.getByText('Progress: 50.0%')).toBeInTheDocument();
  });

  test('renders progress bar with correct value', () => {
    render(<HexaMatrixCoreCard core={mockCore} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  test('renders different core data', () => {
    const differentCore = {
      ...mockCore,
      name: 'Different Core',
      type: '精通核心',
      level: 30,
      progress: 100.0,
    };

    render(<HexaMatrixCoreCard core={differentCore} />);

    expect(screen.getByText('Different Core')).toBeInTheDocument();
    expect(
      screen.getByText('Type: 精通核心 | Level: 30/30')
    ).toBeInTheDocument();
    expect(screen.getByText('Progress: 100.0%')).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });
});
