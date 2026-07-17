import { render, screen, fireEvent } from '@testing-library/react';
import CompareHeaderCard from '../../../components/compare/CompareHeaderCard';
import {
  normalizeCharacterForComparison,
  compareCharacters,
} from '../../../lib/characterComparison';
import {
  shadowRaw,
  armorMasterRaw,
  makeRawCharacter,
} from '../../../test-fixtures/compareFixtures';

function successState(data) {
  return { status: 'success', data, error: null, retry: jest.fn() };
}
function loadingState() {
  return { status: 'loading', data: null, error: null, retry: jest.fn() };
}
function errorState(message, retry) {
  return { status: 'error', data: null, error: message, retry };
}

describe('CompareHeaderCard', () => {
  const leftNormalized = normalizeCharacterForComparison(shadowRaw);
  const rightNormalized = normalizeCharacterForComparison(armorMasterRaw);
  const comparison = compareCharacters(leftNormalized, rightNormalized);

  it('renders each side independently — one loaded, one still loading', () => {
    render(
      <CompareHeaderCard
        left={successState(shadowRaw)}
        right={loadingState()}
        leftNormalized={leftNormalized}
        rightNormalized={null}
        comparison={null}
        onSwap={jest.fn()}
      />
    );
    expect(screen.getByText('影之愛衣')).toBeInTheDocument();
    expect(screen.queryByText('護甲大師')).not.toBeInTheDocument();
  });

  it("shows the failed side's retry action without clearing the other side's success", () => {
    const retry = jest.fn();
    render(
      <CompareHeaderCard
        left={successState(shadowRaw)}
        right={errorState('找不到此角色', retry)}
        leftNormalized={leftNormalized}
        rightNormalized={null}
        comparison={null}
        onSwap={jest.fn()}
      />
    );
    expect(screen.getByText('影之愛衣')).toBeInTheDocument();
    expect(screen.getByText('找不到此角色')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重試' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('tints a preset chip when the two sides active preset numbers differ', () => {
    const { container } = render(
      <CompareHeaderCard
        left={successState(shadowRaw)}
        right={successState(armorMasterRaw)}
        leftNormalized={leftNormalized}
        rightNormalized={rightNormalized}
        comparison={comparison}
        onSwap={jest.fn()}
      />
    );
    // Equipment presets differ (P2 vs P3) in this fixture.
    expect(screen.getAllByText('裝備 P2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('裝備 P3').length).toBeGreaterThan(0);
    expect(
      container.querySelectorAll('.MuiChip-colorWarning').length
    ).toBeGreaterThan(0);
  });

  it('does not tint a preset chip when both sides share the same active preset', () => {
    const sameHyper = {
      1: [{ stat_type: '力量', stat_level: 5, stat_increase: '+100' }],
    };
    const left = makeRawCharacter({
      hyperStatUsePresetNo: '1',
      hyperStatPresets: sameHyper,
    });
    const right = makeRawCharacter({
      hyperStatUsePresetNo: '1',
      hyperStatPresets: sameHyper,
    });
    const leftNorm = normalizeCharacterForComparison(left);
    const rightNorm = normalizeCharacterForComparison(right);
    const { container } = render(
      <CompareHeaderCard
        left={successState(left)}
        right={successState(right)}
        leftNormalized={leftNorm}
        rightNormalized={rightNorm}
        comparison={compareCharacters(leftNorm, rightNorm)}
        onSwap={jest.fn()}
      />
    );
    expect(container.querySelectorAll('.MuiChip-colorWarning').length).toBe(0);
  });

  it('shows the combat-power gap headline and calls onSwap when the swap button is clicked', () => {
    const onSwap = jest.fn();
    render(
      <CompareHeaderCard
        left={successState(shadowRaw)}
        right={successState(armorMasterRaw)}
        leftNormalized={leftNormalized}
        rightNormalized={rightNormalized}
        comparison={comparison}
        onSwap={onSwap}
      />
    );
    expect(screen.getByText('376,134,444')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '交換左右角色' }));
    expect(onSwap).toHaveBeenCalledTimes(1);
  });
});
