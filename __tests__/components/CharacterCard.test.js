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
  character_class_level: 6,
  character_exp_rate: 0.75,
  character_image: 'https://example.com/avatar.jpg',
  character_gender: 'Male',
  character_date_create: '2025-01-10T00:00+08:00',
  world_name: '殺人蜂',
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
    expect(screen.getByText('殺人蜂')).toBeInTheDocument();
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

  it('renders avatar with fallback when no image', () => {
    const charNoImage = { ...mockCharacter, character_image: null };
    render(
      <TestWrapper>
        <CharacterCard character={charNoImage} />
      </TestWrapper>
    );

    const avatar = document.querySelector('.MuiAvatar-root');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent('T');
  });

  it('renders class and guild chips', () => {
    const charWithGuild = {
      ...mockCharacter,
      character_guild_name: 'TestGuild',
    };
    render(
      <TestWrapper>
        <CharacterCard character={charWithGuild} />
      </TestWrapper>
    );

    expect(screen.getByText('Warrior 6')).toBeInTheDocument();
    expect(screen.getByText('TestGuild')).toBeInTheDocument();
  });

  it('renders equipment button', () => {
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
  });

  it('renders formatted timestamp', () => {
    render(
      <TestWrapper>
        <CharacterCard character={mockCharacter} />
      </TestWrapper>
    );

    // Should contain a formatted date string
    const timeEl = screen.getByText(/2023/);
    expect(timeEl).toBeInTheDocument();
  });
});

describe('battle power display', () => {
  it('renders battle power in highlight box when presetAnalysis provided', () => {
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
    expect(screen.getByText('戰鬥力')).toBeInTheDocument();
  });

  it('renders single battle power when presetAnalysis is null', () => {
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
    expect(screen.getByText('11,200,000')).toBeInTheDocument();
  });

  it('does not show leveling when no leveling preset', () => {
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

  it('does not render power section when no data', () => {
    render(
      <TestWrapper>
        <CharacterCard character={mockCharacter} />
      </TestWrapper>
    );

    expect(screen.queryByText('戰鬥力')).not.toBeInTheDocument();
  });

  it('renders preset combination table when available', () => {
    const presetAnalysis = {
      current: { power: 11200000, presetNo: 3 },
      bossing: { power: 12345678, presetNo: 1 },
      presetCombinations: {
        live: { equip: 1, hyperStat: 2, linkSkill: 3 },
        boss: { equip: 1, hyperStat: 1, linkSkill: 1 },
      },
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

    expect(screen.getByText('Preset 組合')).toBeInTheDocument();
    expect(screen.getByText('裝備')).toBeInTheDocument();
    expect(screen.getByText('極限屬性')).toBeInTheDocument();
    expect(screen.getByText('傳授技能')).toBeInTheDocument();
  });

  it('renders union data chips when provided', () => {
    const unionData = {
      union_grade: '傳說',
      union_level: 45,
      union_artifact_level: 10,
    };

    render(
      <TestWrapper>
        <CharacterCard
          character={mockCharacter}
          unionData={unionData}
        />
      </TestWrapper>
    );

    expect(screen.getByText('傳說 Lv.45')).toBeInTheDocument();
    expect(screen.getByText('神器 Lv.10')).toBeInTheDocument();
  });
});
