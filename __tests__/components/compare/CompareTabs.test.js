import { render, screen, fireEvent } from '@testing-library/react';
import CompareTabs from '../../../components/compare/CompareTabs';
import {
  normalizeCharacterForComparison,
  compareCharacters,
  rankUpgradeDirections,
} from '../../../lib/characterComparison';
import {
  shadowRaw,
  armorMasterRaw,
  makeRawCharacter,
  stat,
} from '../../../test-fixtures/compareFixtures';

function buildProps(leftRaw, rightRaw) {
  const leftNormalized = normalizeCharacterForComparison(leftRaw);
  const rightNormalized = normalizeCharacterForComparison(rightRaw);
  const comparison = compareCharacters(leftNormalized, rightNormalized);
  return {
    comparison,
    upgradeDirections: rankUpgradeDirections(comparison),
    leftNormalized,
    rightNormalized,
    leftRaw,
    rightRaw,
  };
}

describe('CompareTabs', () => {
  it('renders all eight tabs in the documented order', () => {
    render(<CompareTabs {...buildProps(shadowRaw, armorMasterRaw)} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(t => t.textContent)).toEqual([
      '總覽',
      '裝備',
      '符文',
      'HEXA',
      '聯盟',
      '極限屬性',
      '連結技能',
      '套裝效果',
    ]);
  });

  it('disables a structurally missing category tab with a no-data indicator', () => {
    const left = makeRawCharacter({ setEffects: [] });
    const right = makeRawCharacter({ setEffects: [] });
    render(<CompareTabs {...buildProps(left, right)} />);
    const setEffectsTab = screen.getByRole('tab', { name: /套裝效果/ });
    expect(setEffectsTab).toBeDisabled();
  });

  it('does not disable a category tab when at least one side has data', () => {
    render(<CompareTabs {...buildProps(shadowRaw, armorMasterRaw)} />);
    const equipmentTab = screen.getByRole('tab', { name: '裝備' });
    expect(equipmentTab).not.toBeDisabled();
  });

  it('switches to the Equipment tab and expands a slot to reveal potential detail', () => {
    render(<CompareTabs {...buildProps(shadowRaw, armorMasterRaw)} />);
    fireEvent.click(screen.getByRole('tab', { name: '裝備' }));

    const expandButton = screen.getByRole('button', {
      name: /展開帽子詳細資訊/,
    });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(expandButton);
    expect(
      screen.getByRole('button', { name: /收合帽子詳細資訊/ })
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('STR +9%')).toBeInTheDocument();
    expect(screen.getByText('STR +12%')).toBeInTheDocument();
  });

  it('shows the cross-class notice and hides the checklist, while summaries stay visible', () => {
    const warrior = makeRawCharacter({
      characterClass: '劍士',
      finalStat: [stat('STR', 500), stat('攻擊力', 999)],
    });
    const mage = makeRawCharacter({
      characterClass: '法師',
      finalStat: [stat('INT', 5000), stat('魔法攻擊力', 2000)],
    });
    render(<CompareTabs {...buildProps(warrior, mage)} />);
    expect(
      screen.getByText(/職業不同，主屬性與傷害相關公式不可直接比較/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/職業不同時不提供檢查清單排序/)
    ).toBeInTheDocument();
    expect(screen.getByText('進度系統摘要')).toBeInTheDocument();
  });

  it('falls back to Overview when the active tab becomes disabled after data changes', () => {
    const withSetEffects = shadowRaw;
    const props = buildProps(withSetEffects, armorMasterRaw);
    const { rerender } = render(<CompareTabs {...props} />);
    fireEvent.click(screen.getByRole('tab', { name: '套裝效果' }));
    expect(screen.getByRole('tab', { name: '套裝效果' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    const left = makeRawCharacter({ setEffects: [] });
    const right = makeRawCharacter({ setEffects: [] });
    rerender(<CompareTabs {...buildProps(left, right)} />);

    expect(screen.getByRole('tab', { name: '總覽' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});
