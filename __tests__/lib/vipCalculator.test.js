/**
 * @jest-environment node
 */

import { computeVip, LEVELS, TARGET_PRESETS } from '../../lib/vipCalculator';

// 鑽石(32) + 皇家達成(3,675,000)、回饋 5%、匯率 1
const DIAMOND_ROYAL = {
  giftRate: 32,
  targetPts: 3675000,
  bonusPct: 5,
  baseRate: 1,
  costCap: 200000,
  cash: 200000,
  discount: '',
  exPts: 0,
  exReward: 0,
  marketValue: 0,
};

describe('vipCalculator', () => {
  describe('constants', () => {
    it('exposes 4 VIP levels and 6 target presets', () => {
      expect(LEVELS).toHaveLength(4);
      expect(LEVELS.map(l => l.rate)).toEqual([16, 24, 32, 40]);
      expect(TARGET_PRESETS).toEqual([
        150000, 225000, 675000, 1000000, 3675000, 5000000,
      ]);
    });
  });

  describe('known value', () => {
    it('鑽石→皇家達成: requiredLeadou 114,843.75 / buyCost 109,375', () => {
      const r = computeVip(DIAMOND_ROYAL);
      expect(r.requiredLeadou).toBeCloseTo(114843.75, 2);
      expect(r.buyCost).toBeCloseTo(109375, 2);
    });

    it('預算已足時 minDiscount === 0，淨成本＝買進成本', () => {
      const r = computeVip(DIAMOND_ROYAL); // buyCost 109,375 <= costCap 200,000
      expect(r.minDiscount).toBe(0);
      expect(r.netCost).toBeCloseTo(109375, 2);
    });
  });

  describe('交叉驗證不變式：達標時 Σ roundLoss ≈ netCost', () => {
    const cases = [
      { name: '現金充足，一輪達標', cash: 200000, discount: 0.9 },
      { name: '現金不足，多輪達標', cash: 100000, discount: 0.9 },
      { name: '折數 0.85 多輪', cash: 120000, discount: 0.85 },
    ];
    cases.forEach(({ name, cash, discount }) => {
      it(name, () => {
        const r = computeVip({ ...DIAMOND_ROYAL, cash, discount });
        expect(r.reached).toBe(true);
        expect(Math.abs(r.lossSum - r.netCost)).toBeLessThan(1);
      });
    });
  });

  describe('邊界', () => {
    it('現金極低：reached=false 且模擬不無限迴圈（受 MAX 保護）', () => {
      const r = computeVip({ ...DIAMOND_ROYAL, cash: 1000, discount: 0.9 });
      expect(r.reached).toBe(false);
      expect(r.sim.length).toBeLessThanOrEqual(40);
    });

    it('exPts 為 0：redemptions=0、leftoverPts=targetPts，不丟例外', () => {
      const r = computeVip({ ...DIAMOND_ROYAL, exPts: 0 });
      expect(r.redemptions).toBe(0);
      expect(r.leftoverPts).toBe(3675000);
    });

    it('exPts 有值：正確計算兌換次數與剩餘點數', () => {
      const r = computeVip({
        ...DIAMOND_ROYAL,
        exPts: 1000000,
        exReward: 500,
        marketValue: 2,
      });
      expect(r.redemptions).toBe(3); // floor(3,675,000 / 1,000,000)
      expect(r.leftoverPts).toBe(675000);
      expect(r.gamePoints).toBe(1500);
      expect(r.redeemValue).toBe(3000);
    });

    it('空值/NaN／負數輸入一律以 0 代入，不丟例外', () => {
      const r = computeVip({
        giftRate: 32,
        targetPts: 3675000,
        bonusPct: NaN,
        baseRate: -1,
        costCap: '',
        cash: undefined,
        discount: null,
        exPts: 'abc',
        exReward: null,
        marketValue: NaN,
      });
      // baseRate 負 → 0 → denom 0 → buyCost 無限（標「—」）
      expect(r.buyCost).toBe(Infinity);
      expect(r.requiredLeadou).toBeCloseTo(114843.75, 2);
      expect(r.reached).toBe(false);
    });

    it('giftRate 0：requiredLeadou 無限、reached=false', () => {
      const r = computeVip({ ...DIAMOND_ROYAL, giftRate: 0 });
      expect(r.requiredLeadou).toBe(Infinity);
      expect(r.reached).toBe(false);
      expect(r.sim).toHaveLength(0);
    });

    it('折數有填時 clamp 到 0–1', () => {
      expect(computeVip({ ...DIAMOND_ROYAL, discount: 5 }).discountUsed).toBe(
        1
      );
      expect(computeVip({ ...DIAMOND_ROYAL, discount: -3 }).discountUsed).toBe(
        0
      );
    });
  });
});
