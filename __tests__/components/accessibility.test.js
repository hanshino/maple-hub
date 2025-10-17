import { render, screen } from '@testing-library/react';
import CharacterCard from '../../components/CharacterCard';

// Accessibility tests for CharacterCard
describe('CharacterCard Accessibility', () => {
  const mockCharacter = {
    character_name: 'TestCharacter',
    character_class: 'Hero',
    character_level: 288,
    character_gender: 'Male',
    character_date_create: '2021-06-15',
    character_guild_name: 'TestGuild',
  };

  it('has proper ARIA labels', () => {
    render(<CharacterCard character={mockCharacter} />);

    expect(screen.getByLabelText(/伺服器/)).toBeInTheDocument();
    expect(screen.getByLabelText(/等級/)).toBeInTheDocument();
    expect(screen.getByLabelText(/最後更新時間/)).toBeInTheDocument();
  });

  it('has semantic heading structure', () => {
    render(<CharacterCard character={mockCharacter} />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('TestCharacter');
  });

  it('has proper region landmark', () => {
    render(<CharacterCard character={mockCharacter} />);

    const region = screen.getByRole('region');
    expect(region).toBeInTheDocument();
  });
});
