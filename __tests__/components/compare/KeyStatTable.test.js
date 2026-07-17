import { render, screen, within } from '@testing-library/react';
import KeyStatTable from '../../../components/compare/KeyStatTable';
import {
  normalizeCharacterForComparison,
  compareCharacters,
} from '../../../lib/characterComparison';
import { shadowRaw, armorMasterRaw } from '../../../test-fixtures/compareFixtures';

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
