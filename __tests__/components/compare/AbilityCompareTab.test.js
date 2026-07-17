import { render, screen } from '@testing-library/react';
import AbilityCompareTab from '../../../components/compare/AbilityCompareTab';

const bossRow = {
  category: 'Ability',
  metric: 'abilityBossDamage',
  left: 8,
  right: 20,
  delta: -12,
  unit: 'pp',
  direction: 'behind',
  evidence: 'derived',
  coverage: 'complete',
};

const zeroRow = { ...bossRow, left: 0, right: 0, delta: 0, direction: 'even' };

const myAbility = {
  ability_grade: '傳說',
  preset_no: 3,
  ability_info: [
    {
      ability_no: '1',
      ability_grade: '傳說',
      ability_value: '使用技能時，依20%機率，沒有冷卻時間',
    },
    {
      ability_no: '2',
      ability_grade: '罕見',
      ability_value: '攻擊Boss怪物時，傷害增加 8%',
    },
  ],
};

describe('AbilityCompareTab', () => {
  it('renders parsed rows, hides all-zero rows, and lists lines verbatim', () => {
    render(
      <AbilityCompareTab
        rows={[
          { label: '內在能力 Boss 傷害', row: bossRow },
          { label: '內在能力爆擊率', row: zeroRow },
        ]}
        presetInfo={{ label: '啟用中的內在能力 Preset', left: '3', right: '1' }}
        leftAbilityData={myAbility}
        rightAbilityData={null}
      />
    );

    expect(screen.getByText('內在能力 Boss 傷害')).toBeInTheDocument();
    expect(screen.getByText(/8% vs 20%（-12pp）/)).toBeInTheDocument();
    expect(screen.queryByText('內在能力爆擊率')).not.toBeInTheDocument();
    // Utility line the parser skips is still shown verbatim.
    expect(
      screen.getByText(/【傳說】使用技能時，依20%機率，沒有冷卻時間/)
    ).toBeInTheDocument();
    expect(screen.getByText(/【罕見】攻擊Boss怪物時，傷害增加 8%/)).toBeInTheDocument();
    // Missing side reads as unknown, never zero.
    expect(screen.getByText(/本次資料不足，不視為 0/)).toBeInTheDocument();
  });
});
