import { render, screen } from '@testing-library/react';
import DataQualityNotice from '../../../components/compare/DataQualityNotice';
import {
  normalizeCharacterForComparison,
  compareCharacters,
} from '../../../lib/characterComparison';
import {
  shadowRaw,
  armorMasterRaw,
  makeRawCharacter,
} from '../../../test-fixtures/compareFixtures';

function buildProps(leftRaw, rightRaw) {
  const leftNormalized = normalizeCharacterForComparison(leftRaw);
  const rightNormalized = normalizeCharacterForComparison(rightRaw);
  return {
    comparison: compareCharacters(leftNormalized, rightNormalized),
    leftNormalized,
    rightNormalized,
  };
}

describe('DataQualityNotice', () => {
  it('warns when snapshot times differ by more than 10 minutes', () => {
    render(<DataQualityNotice {...buildProps(shadowRaw, armorMasterRaw)} />);
    expect(screen.getByText(/快照時間相差超過 10 分鐘/)).toBeInTheDocument();
    expect(screen.getByText(/相差 15 分鐘/)).toBeInTheDocument();
  });

  it('does not warn when snapshot times are within 10 minutes', () => {
    const left = makeRawCharacter({ syncedAt: '2026-07-17T00:00:00.000Z' });
    const right = makeRawCharacter({ syncedAt: '2026-07-17T00:05:00.000Z' });
    render(<DataQualityNotice {...buildProps(left, right)} />);
    expect(
      screen.queryByText(/快照時間相差超過 10 分鐘/)
    ).not.toBeInTheDocument();
  });

  it('shows undated-snapshot wording when a syncedAt is missing', () => {
    const left = makeRawCharacter({ syncedAt: null });
    const right = makeRawCharacter({ syncedAt: '2026-07-17T00:00:00.000Z' });
    render(<DataQualityNotice {...buildProps(left, right)} />);
    expect(screen.getByText(/未標註日期的快照/)).toBeInTheDocument();
  });

  it('always states the active-preset clarification (no cross-preset estimation)', () => {
    render(<DataQualityNotice {...buildProps(shadowRaw, armorMasterRaw)} />);
    expect(
      screen.getByText(/本頁不推估切換 preset 後的戰力/)
    ).toBeInTheDocument();
  });

  it('lists a structurally missing category instead of silently showing zero', () => {
    const left = makeRawCharacter({ setEffects: [] });
    const right = makeRawCharacter({ setEffects: [] });
    render(<DataQualityNotice {...buildProps(left, right)} />);
    expect(screen.getByText(/套裝效果/)).toBeInTheDocument();
    expect(screen.getByText(/不會當成 0/)).toBeInTheDocument();
  });

  it('does not list a category that at least one side provides', () => {
    render(<DataQualityNotice {...buildProps(shadowRaw, armorMasterRaw)} />);
    expect(screen.queryByText(/本次未提供的分類/)).not.toBeInTheDocument();
  });
});
