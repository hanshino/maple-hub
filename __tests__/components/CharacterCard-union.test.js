import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CharacterCard from '../../components/CharacterCard';

// Mock axios
jest.mock('axios');
import axios from 'axios';

describe('CharacterCard with Union Data', () => {
  const mockCharacter = {
    character_name: 'TestCharacter',
    character_class: 'Hero',
    character_level: 288,
    character_gender: 'Male',
    character_date_create: '2021-06-15',
    character_guild_name: 'TestGuild',
    world_name: 'TestWorld',
    date: new Date().toISOString(),
  };

  const mockUnionData = {
    union_level: 9706,
    union_grade: '宗師戰地聯盟 4',
    union_artifact_level: 52,
  };

  beforeEach(() => {
    axios.get = jest.fn();
  });

  it('displays union data when available', () => {
    render(
      <CharacterCard character={mockCharacter} unionData={mockUnionData} />
    );

    expect(screen.getByText('戰地階級:')).toBeInTheDocument();
    expect(screen.getByText('宗師戰地聯盟 4')).toBeInTheDocument();
    expect(screen.getByText('戰地等級:')).toBeInTheDocument();
    expect(screen.getByText('9706')).toBeInTheDocument();
    expect(screen.getByText('神器等級:')).toBeInTheDocument();
    expect(screen.getByText('52')).toBeInTheDocument();
  });

  it('handles missing union data gracefully', () => {
    render(<CharacterCard character={mockCharacter} />);

    expect(screen.getByText('聯盟戰地資訊: 無資料')).toBeInTheDocument();
  });
});
