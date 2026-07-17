import { render, screen } from '@testing-library/react';
import CharacterSearchBar from '../../../components/compare/CharacterSearchBar';

describe('CharacterSearchBar — entry-point focus behavior', () => {
  it('focuses the reference (right) input when left is prefilled and right is empty', () => {
    render(
      <CharacterSearchBar
        leftName="影之愛衣"
        rightName=""
        onSearch={() => {}}
        leftLoading={false}
        rightLoading={false}
      />
    );
    expect(document.activeElement).toBe(screen.getByLabelText('參考角色'));
  });

  it('does not steal focus when both sides are already prefilled', () => {
    render(
      <CharacterSearchBar
        leftName="影之愛衣"
        rightName="護甲大師"
        onSearch={() => {}}
        leftLoading={false}
        rightLoading={false}
      />
    );
    expect(document.activeElement).not.toBe(screen.getByLabelText('參考角色'));
  });

  it('does not focus anything when both sides start empty', () => {
    render(
      <CharacterSearchBar
        leftName=""
        rightName=""
        onSearch={() => {}}
        leftLoading={false}
        rightLoading={false}
      />
    );
    expect(document.activeElement).not.toBe(screen.getByLabelText('參考角色'));
  });
});
