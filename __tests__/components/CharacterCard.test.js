import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CharacterCard from '../../components/CharacterCard';

jest.mock('next/image', () => ({
  __esModule: true,
  default: props => <img {...props} alt="" />,
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

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('CharacterCard', () => {
  it('renders character information correctly', () => {
    render(
      <TestWrapper>
        <CharacterCard character={mockCharacter} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText('Lv.50')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <CharacterCard character={mockCharacter} />
      </TestWrapper>
    );

    const cardContent = document.querySelector('.MuiCardContent-root');
    expect(cardContent).toBeInTheDocument();
    expect(cardContent).toHaveAttribute('role', 'region');
  });

  it('renders equipment button with responsive display', () => {
    const mockOnEquipmentClick = jest.fn();
    render(
      <TestWrapper>
        <CharacterCard
          character={mockCharacter}
          onEquipmentClick={mockOnEquipmentClick}
        />
      </TestWrapper>
    );

    const button = screen.getByText('裝備');
    expect(button).toBeInTheDocument();

    // Check that the button container has responsive display styles applied
    const buttonContainer = button.closest('div');
    expect(buttonContainer).toBeInTheDocument();
  });
});

describe('preset combat power display', () => {
  it('should display three-line combat power when presetAnalysis is provided', () => {
    const presetAnalysis = {
      current: { power: 11200000, presetNo: 3 },
      bossing: { power: 12345678, presetNo: 1 },
      leveling: { power: 9800000, presetNo: 2 },
    };

    render(
      <TestWrapper>
        <CharacterCard
          character={mockCharacter}
          battlePower={11200000}
          presetAnalysis={presetAnalysis}
        />
      </TestWrapper>
    );

    expect(screen.getByText('打王')).toBeInTheDocument();
    expect(screen.getByText('目前')).toBeInTheDocument();
    expect(screen.getByText('練等')).toBeInTheDocument();
  });

  it('should fallback to single battle power when presetAnalysis is null', () => {
    render(
      <TestWrapper>
        <CharacterCard
          character={mockCharacter}
          battlePower={11200000}
          presetAnalysis={null}
        />
      </TestWrapper>
    );

    expect(screen.getByText('戰鬥力')).toBeInTheDocument();
  });

  it('should not show leveling line when no leveling preset detected', () => {
    const presetAnalysis = {
      current: { power: 11200000, presetNo: 3 },
      bossing: { power: 12345678, presetNo: 1 },
      leveling: null,
    };

    render(
      <TestWrapper>
        <CharacterCard
          character={mockCharacter}
          battlePower={11200000}
          presetAnalysis={presetAnalysis}
        />
      </TestWrapper>
    );

    expect(screen.getByText('打王')).toBeInTheDocument();
    expect(screen.getByText('目前')).toBeInTheDocument();
    expect(screen.queryByText('練等')).not.toBeInTheDocument();
  });
});
