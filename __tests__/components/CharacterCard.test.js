import { render, screen } from '@testing-library/react';
import CharacterCard from '../../components/CharacterCard';

jest.mock('next/image', () => ({
  __esModule: true,
  default: props => <img {...props} />,
}));

const mockCharacter = {
  character_name: 'Test Character',
  character_level: 50,
  character_class: 'Warrior',
  character_exp_rate: 0.75,
  character_image: 'https://example.com/avatar.jpg',
  character_gender: 'Male',
  character_date_create: '2025-01-10T00:00+08:00',
  date: '2023-10-01T00:00:00Z',
};

describe('CharacterCard', () => {
  it('renders character information correctly', () => {
    render(<CharacterCard character={mockCharacter} />);

    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText('等級:')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('職業:')).toBeInTheDocument();
    expect(screen.getByText('Warrior')).toBeInTheDocument();
    expect(screen.getByText('創建日期:')).toBeInTheDocument();
    expect(screen.getByText('2025/1/10')).toBeInTheDocument();
  });

  it('renders progress bar', () => {
    render(<CharacterCard character={mockCharacter} />);

    // Check for MUI LinearProgress component
    const progressBar = document.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<CharacterCard character={mockCharacter} />);

    // Check that the CardContent exists with proper attributes
    const cardContent = document.querySelector('.MuiCardContent-root');
    expect(cardContent).toBeInTheDocument();
    expect(cardContent).toHaveAttribute('role', 'region');

    const progressSection = screen.getByLabelText('經驗值進度');
    expect(progressSection).toBeInTheDocument();

    const timeElement = screen.getByLabelText(/最後更新時間/);
    expect(timeElement).toBeInTheDocument();
  });
});
