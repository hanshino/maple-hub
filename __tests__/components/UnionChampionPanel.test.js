import { render, screen } from '@testing-library/react';
import UnionChampionPanel from '../../components/UnionChampionPanel';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('../../lib/analytics', () => ({
  track: jest.fn(),
}));

jest.mock('../../components/panel/PanelSkeleton', () => {
  return function Mock() {
    return <div aria-busy="true" data-testid="panel-skeleton" />;
  };
});
jest.mock('../../components/panel/PanelError', () => {
  return function Mock({ message }) {
    return <div data-testid="panel-error">{message}</div>;
  };
});
jest.mock('../../components/panel/PanelEmpty', () => {
  return function Mock({ message }) {
    return <div data-testid="panel-empty">{message}</div>;
  };
});
jest.mock('../../components/panel/SectionHeader', () => {
  return function Mock() {
    return <div data-testid="section-header" />;
  };
});

const mockData = {
  union_champion: [
    {
      champion_name: '影之愛衣',
      champion_slot: 1,
      champion_grade: 'SSS',
      champion_class: '暗夜行者',
      champion_badge_info: [
        { stat: '增加全屬性 20、最大HP/MP 1000' },
        { stat: '攻擊力/魔力增加 10' },
      ],
    },
    {
      champion_name: '幻影愛衣',
      champion_slot: 2,
      champion_grade: 'A',
      champion_class: '幻影俠盜',
      champion_badge_info: [{ stat: '增加全屬性 20、最大HP/MP 1000' }],
    },
  ],
  champion_badge_total_info: [
    { stat: '增加全屬性 40、最大HP/MP 2000' },
    { stat: '攻擊力/魔力增加 10' },
  ],
};

describe('UnionChampionPanel', () => {
  it('renders loading state', () => {
    render(<UnionChampionPanel loading={true} error={null} data={null} />);
    expect(screen.getByTestId('panel-skeleton')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <UnionChampionPanel
        loading={false}
        error="fail"
        data={null}
        onRetry={() => {}}
      />
    );
    expect(screen.getByText('無法載入聯盟冠軍資料')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <UnionChampionPanel
        loading={false}
        error={null}
        data={{ union_champion: [], champion_badge_total_info: [] }}
      />
    );
    expect(screen.getByText('尚無聯盟冠軍資料')).toBeInTheDocument();
  });

  it('renders champion cards with grade and name', () => {
    render(
      <UnionChampionPanel loading={false} error={null} data={mockData} />
    );
    expect(screen.getByText('影之愛衣')).toBeInTheDocument();
    expect(screen.getByText('暗夜行者')).toBeInTheDocument();
    expect(screen.getByText('SSS')).toBeInTheDocument();
    expect(screen.getByText('幻影愛衣')).toBeInTheDocument();
    expect(screen.getByText('幻影俠盜')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders total badge effects', () => {
    render(
      <UnionChampionPanel loading={false} error={null} data={mockData} />
    );
    expect(
      screen.getByText('增加全屬性 40、最大HP/MP 2000')
    ).toBeInTheDocument();
    expect(screen.getByText('攻擊力/魔力增加 10')).toBeInTheDocument();
  });

  it('renders empty slots up to 6', () => {
    render(
      <UnionChampionPanel loading={false} error={null} data={mockData} />
    );
    // 2 filled + 4 empty = 6 total grid items
    // Empty slots render with data-testid="empty-slot"
    const emptySlots = screen.getAllByTestId('empty-slot');
    expect(emptySlots).toHaveLength(4);
  });
});
