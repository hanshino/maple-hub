import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CharacterDataTabs from '../../components/CharacterDataTabs';

// Mock all child components
jest.mock('../../components/CharacterStats', () => {
  return function MockCharacterStats({ ocid }) {
    return <div data-testid="character-stats">Stats: {ocid}</div>;
  };
});

jest.mock('../../components/runes/RuneSystems', () => {
  return function MockRuneSystems() {
    return <div data-testid="rune-systems">Runes</div>;
  };
});

jest.mock('../../components/UnionRaiderPanel', () => {
  return function MockPanel() {
    return <div data-testid="union-raider-panel">Union Raider</div>;
  };
});

jest.mock('../../components/HyperStatPanel', () => {
  return function MockPanel() {
    return <div data-testid="hyper-stat-panel">Hyper Stat</div>;
  };
});

jest.mock('../../components/SetEffectPanel', () => {
  return function MockPanel() {
    return <div data-testid="set-effect-panel">Set Effect</div>;
  };
});

jest.mock('../../components/UnionArtifactPanel', () => {
  return function MockPanel() {
    return <div data-testid="union-artifact-panel">Union Artifact</div>;
  };
});

describe('CharacterDataTabs', () => {
  const defaultProps = {
    ocid: 'test-ocid',
    runes: [],
    setEffectData: null,
    setEffectLoading: false,
    setEffectError: null,
  };

  it('should render all tab labels', () => {
    render(<CharacterDataTabs {...defaultProps} />);
    expect(screen.getByText('能力值')).toBeInTheDocument();
    expect(screen.getByText('聯盟戰地')).toBeInTheDocument();
    expect(screen.getByText('極限屬性')).toBeInTheDocument();
    expect(screen.getByText('套裝效果')).toBeInTheDocument();
    expect(screen.getByText('聯盟神器')).toBeInTheDocument();
    expect(screen.getByText('符文系統')).toBeInTheDocument();
  });

  it('should show stats panel by default', () => {
    render(<CharacterDataTabs {...defaultProps} />);
    expect(screen.getByTestId('character-stats')).toBeInTheDocument();
  });

  it('should switch to rune panel on tab click', async () => {
    render(<CharacterDataTabs {...defaultProps} />);
    await userEvent.click(screen.getByText('符文系統'));
    expect(screen.getByTestId('rune-systems')).toBeInTheDocument();
  });

  it('should have aria-label on tabs', () => {
    render(<CharacterDataTabs {...defaultProps} />);
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-label',
      '角色資料分頁'
    );
  });
});
