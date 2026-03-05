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
    // Caption text is split across React JSX nodes; match the span by textContent
    const caption = screen.getByText((_, el) =>
      el?.tagName === 'SPAN' &&
      /Lv\.5\s*\/\s*20\s*\|\s*力量:\s*100/.test(el?.textContent ?? '')
    );
    expect(caption).toBeInTheDocument();
    // Percentage shown in a separate span
    const pct = screen.getByText((_, el) =>
      el?.tagName === 'SPAN' && (el?.textContent ?? '').trim() === '23.7%'
    );
    expect(pct).toBeInTheDocument();
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
