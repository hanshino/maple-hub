import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ComparePage from '../../../app/compare/page';
import {
  shadowRaw,
  armorMasterRaw,
  makeRawCharacter,
  stat,
} from '../../../test-fixtures/compareFixtures';

// --- Controllable next/navigation mock --------------------------------
// A minimal, self-contained fake of the App Router's useSearchParams /
// useRouter that lets router.replace(url) actually update what
// useSearchParams() returns on the next render — this is what makes the
// page's "URL is the source of truth" architecture testable end-to-end
// (search, swap, reload-safety) without a real Next.js server.
jest.mock('next/navigation', () => {
  const React = require('react');
  const state = { search: '' };
  const listeners = new Set();

  function setSearch(next) {
    state.search = next;
    listeners.forEach(fn => fn());
  }

  return {
    __setSearch: setSearch,
    __getSearch: () => state.search,
    useSearchParams: () => {
      const [, setTick] = React.useState(0);
      React.useEffect(() => {
        const listener = () => setTick(t => t + 1);
        listeners.add(listener);
        return () => listeners.delete(listener);
      }, []);
      return new URLSearchParams(state.search);
    },
    useRouter: () => ({
      replace: url => {
        const query = url.includes('?') ? url.split('?')[1] : '';
        setSearch(query);
      },
    }),
  };
});

// eslint-disable-next-line import/first
const { __setSearch, __getSearch } = require('next/navigation');

const WARRIOR_RAW = makeRawCharacter({
  ocid: 'OCID_WARRIOR',
  name: '劍士甲',
  characterClass: '劍士',
  combatPower: 500000000,
  finalStat: [stat('STR', 40000), stat('攻擊力', 8000)],
  syncedAt: '2026-07-17T00:00:00.000Z',
});
const MAGE_RAW = makeRawCharacter({
  ocid: 'OCID_MAGE',
  name: '法師乙',
  characterClass: '法師',
  combatPower: 600000000,
  finalStat: [stat('INT', 60000), stat('魔法攻擊力', 9000)],
  syncedAt: '2026-07-17T00:00:00.000Z',
});
const ROLE_A_RAW = makeRawCharacter({
  ocid: 'OCID_A',
  name: '角色A',
  characterClass: '夜使者',
  syncedAt: '2026-07-17T00:00:00.000Z',
});
const ROLE_B_RAW = makeRawCharacter({
  ocid: 'OCID_B',
  name: '角色B',
  characterClass: '夜使者',
  syncedAt: '2026-07-17T00:00:00.000Z',
});

const NAME_TO_OCID = {
  影之愛衣: 'OCID_SHADOW',
  護甲大師: 'OCID_ARMOR',
  劍士甲: 'OCID_WARRIOR',
  法師乙: 'OCID_MAGE',
  角色A: 'OCID_A',
  角色B: 'OCID_B',
};

const OCID_TO_DATA = {
  OCID_SHADOW: shadowRaw,
  OCID_ARMOR: armorMasterRaw,
  OCID_WARRIOR: WARRIOR_RAW,
  OCID_MAGE: MAGE_RAW,
  OCID_A: ROLE_A_RAW,
  OCID_B: ROLE_B_RAW,
};

function createFetchMock({ delayedSearchName, delayedSearchPromise } = {}) {
  return jest.fn(url => {
    const urlObj = new URL(url, 'http://localhost');

    if (urlObj.pathname === '/api/character/search') {
      const name = urlObj.searchParams.get('name');
      const respond = () => {
        const ocid = NAME_TO_OCID[name];
        return {
          ok: !!ocid,
          status: ocid ? 200 : 404,
          json: async () => (ocid ? { ocid } : { error: 'not found' }),
        };
      };
      if (name === delayedSearchName) {
        return delayedSearchPromise.then(respond);
      }
      return Promise.resolve(respond());
    }

    const match = urlObj.pathname.match(/^\/api\/character\/(.+)$/);
    if (match) {
      const data = OCID_TO_DATA[match[1]];
      return Promise.resolve({
        ok: !!data,
        status: data ? 200 : 404,
        json: async () => data || { error: 'not found' },
      });
    }

    return Promise.reject(new Error(`Unhandled fetch url in test: ${url}`));
  });
}

beforeEach(() => {
  __setSearch('');
});

describe('/compare page', () => {
  it('loads both characters prefilled from the URL (shareable, reload-safe)', async () => {
    __setSearch('left=%E5%BD%B1%E4%B9%8B%E6%84%9B%E8%A1%A3&right=%E8%AD%B7%E7%94%B2%E5%A4%A7%E5%B8%AB');
    global.fetch = createFetchMock();

    render(<ComparePage />);

    await screen.findByText('影之愛衣');
    await screen.findByText('護甲大師');
    expect(screen.getByText('1,626,455,576')).toBeInTheDocument();
    expect(screen.getByText('2,002,590,020')).toBeInTheDocument();
  });

  it('replacing one side updates only that side, leaving the other success result intact', async () => {
    __setSearch('left=影之愛衣&right=護甲大師');
    global.fetch = createFetchMock();
    render(<ComparePage />);

    await screen.findByText('影之愛衣');
    await screen.findByText('護甲大師');

    const rightInput = screen.getByLabelText('參考角色');
    fireEvent.change(rightInput, { target: { value: '角色A' } });
    fireEvent.submit(rightInput.closest('form'));

    await screen.findByText('角色A');
    // The left side's successful result must survive the right side's
    // replacement untouched.
    expect(screen.getByText('影之愛衣')).toBeInTheDocument();
    expect(screen.queryByText('護甲大師')).not.toBeInTheDocument();
  });

  it("shows the failed side's error and retry without discarding the other side's success", async () => {
    __setSearch('left=影之愛衣&right=護甲大師');
    global.fetch = createFetchMock();
    render(<ComparePage />);

    await screen.findByText('影之愛衣');
    await screen.findByText('護甲大師');

    const rightInput = screen.getByLabelText('參考角色');
    fireEvent.change(rightInput, { target: { value: '找不到的人' } });
    fireEvent.submit(rightInput.closest('form'));

    await screen.findByText('找不到此角色');
    expect(screen.getByText('影之愛衣')).toBeInTheDocument();

    const callsBeforeRetry = global.fetch.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: '重試' }));

    await waitFor(() =>
      expect(global.fetch.mock.calls.length).toBeGreaterThan(callsBeforeRetry)
    );
    // Still failing (same unknown name) — left remains untouched.
    expect(await screen.findByText('找不到此角色')).toBeInTheDocument();
    expect(screen.getByText('影之愛衣')).toBeInTheDocument();
  });

  it('ignores a stale response from a superseded request', async () => {
    __setSearch('left=影之愛衣&right=護甲大師');

    let resolveSlowSearch;
    const slowSearchPromise = new Promise(resolve => {
      resolveSlowSearch = resolve;
    });
    global.fetch = createFetchMock({
      delayedSearchName: '角色A',
      delayedSearchPromise: slowSearchPromise,
    });

    render(<ComparePage />);
    await screen.findByText('影之愛衣');
    await screen.findByText('護甲大師');

    const rightInput = screen.getByLabelText('參考角色');

    // Submit a slow-resolving search for 角色A...
    fireEvent.change(rightInput, { target: { value: '角色A' } });
    fireEvent.submit(rightInput.closest('form'));

    // ...then immediately replace it with 角色B, which resolves fast.
    fireEvent.change(rightInput, { target: { value: '角色B' } });
    fireEvent.submit(rightInput.closest('form'));

    await screen.findByText('角色B');

    // Now let the stale 角色A search finally resolve.
    resolveSlowSearch();
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.queryByText('角色A')).not.toBeInTheDocument();
    expect(screen.getByText('角色B')).toBeInTheDocument();
  });

  it('swapping characters swaps the URL parameters and the comparison direction', async () => {
    __setSearch('left=影之愛衣&right=護甲大師');
    global.fetch = createFetchMock();
    render(<ComparePage />);

    await screen.findByText('影之愛衣');
    await screen.findByText('護甲大師');

    fireEvent.click(screen.getByRole('button', { name: '交換左右角色' }));

    await waitFor(() => {
      const params = new URLSearchParams(__getSearch());
      expect(params.get('left')).toBe('護甲大師');
      expect(params.get('right')).toBe('影之愛衣');
    });

    // Both sides refetch under their new (swapped) roles, and the
    // headline recomputes with 護甲大師 as "my character" — proving the
    // comparison direction actually flipped, not just the two names.
    expect(
      await screen.findByText(/影之愛衣的戰鬥力比護甲大師低 [\d.]+%（以我的角色為基準）/)
    ).toBeInTheDocument();
  });

  it('shows an inline same-character message and does not issue a second full-character request', async () => {
    __setSearch('left=影之愛衣&right=影之愛衣');
    global.fetch = createFetchMock();
    render(<ComparePage />);

    expect(
      screen.getByText(/兩側輸入了相同的角色/)
    ).toBeInTheDocument();

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    await new Promise(resolve => setTimeout(resolve, 10));
    // Exactly one search + one full-character call — never a duplicate.
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('degrades to common-summary mode for a cross-class comparison', async () => {
    __setSearch('left=劍士甲&right=法師乙');
    global.fetch = createFetchMock();
    render(<ComparePage />);

    await screen.findByText('劍士甲');
    await screen.findByText('法師乙');

    expect(
      await screen.findByText(/職業不同，主屬性與傷害相關公式不可直接比較/)
    ).toBeInTheDocument();
  });

  it('shows the snapshot freshness warning when the two syncedAt values differ by more than 10 minutes', async () => {
    __setSearch('left=影之愛衣&right=護甲大師');
    global.fetch = createFetchMock();
    render(<ComparePage />);

    await screen.findByText('影之愛衣');
    await screen.findByText('護甲大師');

    expect(
      await screen.findByText(/快照時間相差超過 10 分鐘/)
    ).toBeInTheDocument();
  });
});
