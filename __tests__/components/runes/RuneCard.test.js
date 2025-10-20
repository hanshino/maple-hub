import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RuneCard from '../../../components/runes/RuneCard';

const mockRune = {
  symbol_name: '祕法符文：測試',
  symbol_icon: 'https://example.com/icon.png',
  symbol_level: 5,
  symbol_force: 100,
  symbol_growth_count: 50,
  symbol_require_growth_count: 100,
};

describe('RuneCard', () => {
  it('renders rune information correctly', () => {
    render(<RuneCard rune={mockRune} />);

    expect(screen.getByText('祕法符文：測試')).toBeInTheDocument();
    expect(screen.getByText('等級: 5')).toBeInTheDocument();
    expect(screen.getByText('力量: 100')).toBeInTheDocument();
    expect(screen.getByText('等級 5/20 (23.7%)')).toBeInTheDocument();
  });

  it('displays image with correct alt text', () => {
    render(<RuneCard rune={mockRune} />);

    const image = screen.getByAltText('祕法符文：測試');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src');
    expect(image.getAttribute('src')).toContain('https://example.com/icon.png');
  });

  it('shows progress bar', () => {
    render(<RuneCard rune={mockRune} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '24');
  });

  it('handles image load error gracefully', () => {
    render(<RuneCard rune={mockRune} />);

    const image = screen.getByAltText('祕法符文：測試');
    fireEvent.error(image);

    // After error, image should have fallback src
    expect(image).toHaveAttribute('src', '/placeholder-rune.png');
  });
});
