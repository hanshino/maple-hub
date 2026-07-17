import { render, screen } from '@testing-library/react';
import UpgradeChecklist from '../../../components/compare/UpgradeChecklist';
import {
  normalizeCharacterForComparison,
  compareCharacters,
  rankUpgradeDirections,
} from '../../../lib/characterComparison';
import {
  shadowRaw,
  armorMasterRaw,
} from '../../../test-fixtures/compareFixtures';

describe('UpgradeChecklist', () => {
  const comparison = compareCharacters(
    normalizeCharacterForComparison(shadowRaw),
    normalizeCharacterForComparison(armorMasterRaw)
  );
  const directions = rankUpgradeDirections(comparison);

  it('lists at most three systems in the documented inspection order', () => {
    expect(directions.map(d => d.category)).toEqual([
      'Equipment',
      'Symbols',
      'Union',
    ]);
    render(<UpgradeChecklist directions={directions} />);
    expect(screen.getByText('裝備')).toBeInTheDocument();
    expect(screen.getByText('符文')).toBeInTheDocument();
    expect(screen.getByText('聯盟')).toBeInTheDocument();
  });

  it('shows the not-a-ranking footnote', () => {
    render(<UpgradeChecklist directions={directions} />);
    expect(screen.getByText(/並非因果歸因/)).toBeInTheDocument();
    expect(screen.getByText(/不可加總重現總戰力差距/)).toBeInTheDocument();
  });

  it('shows an evidenced observed-difference line sourced from the comparison layer, never a score', () => {
    render(<UpgradeChecklist directions={directions} />);
    expect(
      screen.getByText(/聯盟等級 10,046 vs 10,737（-691）/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
  });

  it('shows a placeholder message when there are no eligible directions', () => {
    render(<UpgradeChecklist directions={[]} />);
    expect(
      screen.getByText('目前沒有偵測到值得優先檢查的落後系統。')
    ).toBeInTheDocument();
  });
});
