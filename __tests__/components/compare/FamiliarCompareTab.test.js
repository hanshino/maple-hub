import { render, screen } from '@testing-library/react';
import FamiliarCompareTab from '../../../components/compare/FamiliarCompareTab';

const finalDamageRow = {
  category: 'Familiar',
  metric: 'summonedFamiliarFinalDamage',
  left: 40,
  right: 40,
  delta: 0,
  unit: 'pp',
  direction: 'even',
  evidence: 'derived',
  coverage: 'complete',
};

const rows = [{ label: '裝備中萌獸最終傷害', row: finalDamageRow }];

const summonedFamiliar = {
  familiar_name: '垃圾桶',
  familiar_state: 'registered',
  slot_id: 'not link',
  summoned_flag: 'true',
  option: [
    { option_no: 1, option_name: '物理攻擊力 (%)', option_value: '14' },
    { option_no: 2, option_name: '最終傷害 (%)', option_value: '20' },
    { option_no: 3, option_name: '最終傷害 (%)', option_value: '20' },
  ],
};

const linkedOnlyFamiliar = {
  familiar_name: '寒冰半人馬',
  familiar_state: 'linked',
  slot_id: '1',
  summoned_flag: 'false',
  option: [{ option_no: 1, option_name: '最終傷害 (%)', option_value: '2' }],
};

describe('FamiliarCompareTab', () => {
  it('lists only equipped (summoned) familiars with formatted option values', () => {
    render(
      <FamiliarCompareTab
        rows={rows}
        leftFamiliarData={{
          familiar_info: [summonedFamiliar, linkedOnlyFamiliar],
        }}
        rightFamiliarData={{ familiar_info: [] }}
      />
    );

    expect(screen.getByText('垃圾桶')).toBeInTheDocument();
    expect(screen.getByText('物理攻擊力 +14%')).toBeInTheDocument();
    expect(screen.getAllByText('最終傷害 +20%')).toHaveLength(2);
    // 羈絆-linked but not summoned → not part of the equipped section.
    expect(screen.queryByText('寒冰半人馬')).not.toBeInTheDocument();
  });

  it('renders the summary row with percentage-point formatting', () => {
    render(
      <FamiliarCompareTab
        rows={rows}
        leftFamiliarData={{ familiar_info: [summonedFamiliar] }}
        rightFamiliarData={{ familiar_info: [summonedFamiliar] }}
      />
    );

    expect(screen.getByText('裝備中萌獸最終傷害')).toBeInTheDocument();
    expect(screen.getByText(/40% vs 40%（±0pp）/)).toBeInTheDocument();
  });

  it('distinguishes "nothing equipped" from "no data at all"', () => {
    render(
      <FamiliarCompareTab
        rows={rows}
        leftFamiliarData={{ familiar_info: [linkedOnlyFamiliar] }}
        rightFamiliarData={null}
      />
    );

    expect(screen.getByText('未裝備萌獸')).toBeInTheDocument();
    expect(screen.getByText(/本次資料不足，不視為 0/)).toBeInTheDocument();
  });
});
