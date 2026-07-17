import { render, screen, within } from '@testing-library/react';
import KeyStatTable from '../../../components/compare/KeyStatTable';
import {
  normalizeCharacterForComparison,
  compareCharacters,
} from '../../../lib/characterComparison';
import {
  shadowRaw,
  armorMasterRaw,
  makeRawCharacter,
  stat,
} from '../../../test-fixtures/compareFixtures';

describe('KeyStatTable', () => {
  const comparison = compareCharacters(
    normalizeCharacterForComparison(shadowRaw),
    normalizeCharacterForComparison(armorMasterRaw)
  );

  it('renders the fixed-order stat rows (main stat before attack)', () => {
    render(<KeyStatTable comparison={comparison} />);
    const bodyRows = screen.getAllByRole('row').slice(1);
    expect(within(bodyRows[0]).getByText(/LUK/)).toBeInTheDocument();
    expect(within(bodyRows[1]).getByText('攻擊力')).toBeInTheDocument();
  });

  it('shows an API evidence badge for a known stat', () => {
    render(<KeyStatTable comparison={comparison} />);
    expect(screen.getAllByText('API').length).toBeGreaterThan(0);
  });

  it('marks a deficit stat (attack) as 我方落後 with the correct delta', () => {
    render(<KeyStatTable comparison={comparison} />);
    expect(screen.getAllByLabelText('我方落後').length).toBeGreaterThan(0);
    expect(screen.getByText('-1,531')).toBeInTheDocument();
  });

  it("preserves my character's advantage (critical damage) as 我方領先", () => {
    render(<KeyStatTable comparison={comparison} />);
    // Both `damage` and `critDamage` are advantages in this fixture — the
    // direction state must never filter advantages out.
    expect(screen.getAllByLabelText('我方領先').length).toBeGreaterThan(0);
    expect(screen.getByText('+14.65pp')).toBeInTheDocument();
  });

  it('shows the unknown state and 未知 badge for a structurally missing stat (critical rate)', () => {
    render(<KeyStatTable comparison={comparison} />);
    expect(screen.getByLabelText('無資料')).toBeInTheDocument();
    expect(screen.getAllByText('未知').length).toBeGreaterThan(0);
  });

  it('formats percentage-point rows with a % raw value and pp delta, never relative growth', () => {
    render(<KeyStatTable comparison={comparison} />);
    expect(screen.getByText('665%')).toBeInTheDocument();
    expect(screen.getByText('-38pp')).toBeInTheDocument();
  });
});

describe('KeyStatTable — partial coverage (one side has the value, the other lacks it)', () => {
  // `damage` is present for mine but structurally absent for the
  // reference — compareCharacters marks this row `coverage: 'partial'`
  // (distinct from 'unavailable', where neither side has it).
  const left = makeRawCharacter({
    characterClass: '夜使者',
    finalStat: [stat('LUK', 1000), stat('攻擊力', 500), stat('傷害', 20)],
  });
  const right = makeRawCharacter({
    characterClass: '夜使者',
    finalStat: [stat('LUK', 900), stat('攻擊力', 400)],
  });
  const partialComparison = compareCharacters(
    normalizeCharacterForComparison(left),
    normalizeCharacterForComparison(right)
  );
  const damageRow = partialComparison.rows.find(r => r.metric === 'damage');

  it('is a genuinely reachable partial-coverage row (sanity check on the fixture)', () => {
    expect(damageRow.coverage).toBe('partial');
    expect(damageRow.left).toBe(20);
    expect(damageRow.right).toBeNull();
  });

  // Pinning today's actual behavior (not a spec requirement to change):
  // a partial row collapses evidence/direction/delta to unknown exactly
  // like a fully unavailable row, but the one side that DOES have a
  // value still shows its real number — it is never hidden or zeroed.
  it('pins current behavior: shows the known side value, but 未知 for evidence, delta, and the missing side', () => {
    render(<KeyStatTable comparison={partialComparison} />);
    const damageRowEl = screen.getByText('傷害').closest('tr');
    expect(within(damageRowEl).getByText('20%')).toBeInTheDocument();
    // evidence badge, missing (right) value, and delta all read 未知.
    expect(within(damageRowEl).getAllByText('未知')).toHaveLength(3);
    expect(within(damageRowEl).getByLabelText('無資料')).toBeInTheDocument();
  });
});
