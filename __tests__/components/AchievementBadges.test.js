import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AchievementBadges from '../../components/AchievementBadges';

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('AchievementBadges', () => {
  it('renders nothing when no thresholds are met', () => {
    const { container } = render(
      <TestWrapper>
        <AchievementBadges
          character={{ character_level: 200 }}
          equipment={{}}
          unionData={{ union_level: 100, union_artifact_level: 1 }}
          hexaCoreData={null}
        />
      </TestWrapper>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the highest reached level milestone', () => {
    render(
      <TestWrapper>
        <AchievementBadges character={{ character_level: 275 }} />
      </TestWrapper>
    );
    expect(screen.getByText('Lv.270+')).toBeInTheDocument();
    expect(screen.queryByText('Lv.280+')).not.toBeInTheDocument();
  });

  it('shows any-piece and full-body starforce badges when every eligible item is at least 22 stars', async () => {
    const user = userEvent.setup();
    const equipment = {
      hat: { item_equipment_slot: '帽子', starforce: '22' },
      weapon: { item_equipment_slot: '武器', starforce: '25' },
      face: { item_equipment_slot: '臉飾', starforce: '22' },
    };
    render(
      <TestWrapper>
        <AchievementBadges character={{}} equipment={equipment} />
      </TestWrapper>
    );

    expect(screen.getByText('★22+')).toBeInTheDocument();
    const fullBodyBadge = screen.getByText('全身★22+');
    expect(fullBodyBadge).toBeInTheDocument();
    await user.hover(fullBodyBadge);
    expect(
      await screen.findByText('依目前已裝備的可星力部位估算，皆達 22 星以上')
    ).toBeInTheDocument();
  });

  it('does not show the full-body badge when an eligible equipped item has zero stars', () => {
    const equipment = {
      hat: { item_equipment_slot: '帽子', starforce: '22' },
      weapon: { item_equipment_slot: '武器', starforce: '0' },
    };
    render(
      <TestWrapper>
        <AchievementBadges character={{}} equipment={equipment} />
      </TestWrapper>
    );

    expect(screen.getByText('★22+')).toBeInTheDocument();
    expect(screen.queryByText('全身★22+')).not.toBeInTheDocument();
  });

  it('ignores known ineligible slots when evaluating the full-body badge', () => {
    const equipment = {
      hat: { item_equipment_slot: '帽子', starforce: '22' },
      weapon: { item_equipment_slot: '武器', starforce: '22' },
      pocket: { item_equipment_slot: '口袋道具', starforce: '0' },
      badge: { item_equipment_slot: '徽章', starforce: '0' },
      medal: { item_equipment_slot: '勳章', starforce: '0' },
      totem: { item_equipment_slot: '圖騰', starforce: '0' },
      title: { item_equipment_slot: '稱號', starforce: '0' },
      symbol: { item_equipment_slot: '神秘徽章', starforce: '0' },
      cash: { item_equipment_slot: '現金', starforce: '0' },
      pet: { item_equipment_slot: '寵物裝備', starforce: '0' },
    };
    render(
      <TestWrapper>
        <AchievementBadges character={{}} equipment={equipment} />
      </TestWrapper>
    );

    expect(screen.getByText('★22+')).toBeInTheDocument();
    expect(screen.getByText('全身★22+')).toBeInTheDocument();
  });

  it('ignores unfamiliar slots in the conservative full-body estimate', () => {
    const equipment = {
      hat: { item_equipment_slot: '帽子', starforce: '22' },
      futureSlot: { item_equipment_slot: '未來特殊部位', starforce: '0' },
    };

    render(
      <TestWrapper>
        <AchievementBadges character={{}} equipment={equipment} />
      </TestWrapper>
    );

    expect(screen.getByText('全身★22+')).toBeInTheDocument();
  });

  it('keeps the any-piece badge when another eligible item is under threshold', () => {
    const equipment = {
      hat: { item_equipment_slot: '帽子', starforce: '22' },
      weapon: { item_equipment_slot: '武器', starforce: '5' },
    };
    render(
      <TestWrapper>
        <AchievementBadges character={{}} equipment={equipment} />
      </TestWrapper>
    );
    expect(screen.getByText('★22+')).toBeInTheDocument();
    expect(screen.queryByText('全身★22+')).not.toBeInTheDocument();
  });

  it('counts legendary-grade potential items', () => {
    const equipment = {
      hat: { potential_option_grade: '傳說' },
      cape: { potential_option_grade: '傳說' },
      weapon: { potential_option_grade: '稀有' },
    };
    render(
      <TestWrapper>
        <AchievementBadges character={{}} equipment={equipment} />
      </TestWrapper>
    );
    expect(screen.getByText('傳說潛能 x2')).toBeInTheDocument();
  });

  it('shows hexa unlock and maxed-core badges', () => {
    const hexaCoreData = {
      character_hexa_core_equipment: [
        {
          hexa_core_name: 'A',
          hexa_core_type: '精通核心',
          hexa_core_level: 30,
        },
        {
          hexa_core_name: 'B',
          hexa_core_type: '강화核心',
          hexa_core_level: 10,
        },
      ],
    };
    render(
      <TestWrapper>
        <AchievementBadges character={{}} hexaCoreData={hexaCoreData} />
      </TestWrapper>
    );
    expect(screen.getByText('六轉已解鎖')).toBeInTheDocument();
    expect(screen.getByText('核心滿級 x1')).toBeInTheDocument();
  });

  it('does not show hexa badges when no core equipment exists', () => {
    render(
      <TestWrapper>
        <AchievementBadges
          character={{}}
          hexaCoreData={{ character_hexa_core_equipment: [] }}
        />
      </TestWrapper>
    );
    expect(screen.queryByText('六轉已解鎖')).not.toBeInTheDocument();
  });

  it('shows union level and artifact milestone badges', () => {
    const unionData = { union_level: 9500, union_artifact_level: 17 };
    render(
      <TestWrapper>
        <AchievementBadges character={{}} unionData={unionData} />
      </TestWrapper>
    );
    expect(screen.getByText('聯盟 Lv.9000+')).toBeInTheDocument();
    expect(screen.getByText('神器 Lv.15+')).toBeInTheDocument();
  });
});
