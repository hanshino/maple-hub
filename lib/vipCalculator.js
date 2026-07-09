/**
 * VIP 儲值試算器 — 純計算引擎
 *
 * 估算衝到目標 VIP 等級的樂豆需求、儲值成本，以及（商家模式）分批賣客的
 * 混合折數淨成本、自用點數兌換（可經遊戲幣回收）與分批滾動操作模擬。
 *
 * 金額假設 1 樂豆 ≈ 1 元台幣面值；baseRate 與 bonusPct 只影響「買進」側，
 * 不影響賣客回收側。詳見 docs/superpowers/specs/2026-07-09-vip-calculator-design.md。
 */

// ponytail: 官方調整門檻/轉換率時＝改這兩個常數、發 PR。若官方頻繁變動再改讀 config。
export const LEVELS = [
  { name: '非VIP／銀牌', rate: 16, ptsLabel: '50,000 起' },
  { name: '金牌', rate: 24, ptsLabel: '150k／維持225k' },
  { name: '鑽石', rate: 32, ptsLabel: '675k／維持1M' },
  { name: '皇家', rate: 40, ptsLabel: '3.675M／維持5M' },
];

export const TARGET_PRESETS = [
  150000, 225000, 675000, 1000000, 3675000, 5000000,
];

const MAX_ROUNDS = 40;
const EPS = 1e-6;

// 信任邊界：空值/NaN／負數一律以 0 代入計算。
function num(x) {
  const n = Number(x);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// 折數倍率：有填 → clamp 0–1；空/null/NaN → null（交給呼叫端決定自動值）。
function clampDisc(x) {
  if (x == null || x === '' || !Number.isFinite(Number(x))) return null;
  return Math.min(1, Math.max(0, Number(x)));
}

/**
 * 遊戲幣回收：把「X 點 = Y 遊戲幣」與「1 NTD = Z 遊戲幣」兩個行情換算成等效元/點市值。
 * @returns {number} 元/點（pointsPerBatch 或 mesoPerNtd ≤ 0 時回 0）
 */
export function mesoPointValue({
  pointsPerBatch,
  mesoPerBatch,
  mesoPerNtd,
} = {}) {
  const pts = num(pointsPerBatch);
  const meso = num(mesoPerBatch);
  const perNtd = num(mesoPerNtd);
  if (pts <= 0 || perNtd <= 0) return 0;
  return meso / pts / perNtd;
}

/**
 * @param {object} inputs
 * @param {number} inputs.giftRate    轉換率（點/樂豆），來自 LEVELS.rate
 * @param {number} inputs.targetPts   目標點數
 * @param {number} inputs.bonusPct    回饋 %
 * @param {number} inputs.baseRate    匯率（每 1 元台幣買到幾樂豆，預設 1）
 * @param {number} inputs.costCap     成本上限
 * @param {number} inputs.cash        現金
 * @param {Array<{face:number,disc:(number|null)}>} [inputs.tranches] 分批賣客：面額 + 折數倍率（disc 空=未定折）
 * @param {number|null} [inputs.autoDiscount] 未定折量的折數倍率；空/null → 自動採用 minDiscount
 * @param {number|null} [inputs.discount] 相容舊介面：等同 autoDiscount（無 tranches 時的單一折數）
 * @param {number} inputs.exPts       每次兌換耗點
 * @param {number} inputs.exReward    每次兌換得遊戲點
 * @param {number} inputs.marketValue 遊戲點市值（元/點；可由 mesoPointValue 推導）
 * @returns {object} 計算結果（含滾動模擬 sim 與交叉驗證用 lossSum）
 */
export function computeVip(inputs = {}) {
  const giftRate = num(inputs.giftRate);
  const targetPts = num(inputs.targetPts);
  const bonusPct = num(inputs.bonusPct);
  const baseRate = num(inputs.baseRate);
  const costCap = num(inputs.costCap);
  const cash = num(inputs.cash);
  const exPts = num(inputs.exPts);
  const exReward = num(inputs.exReward);
  const marketValue = num(inputs.marketValue);

  const bonusMult = 1 + bonusPct / 100;
  const denom = baseRate * bonusMult; // 樂豆 per NT
  const requiredLeadou = giftRate > 0 ? targetPts / giftRate : Infinity;
  const buyCost = denom > 0 ? requiredLeadou / denom : Infinity;

  // 分批賣客：每列有填折數＝已定折，加總為 pricedRecover；未填的併入 autoVolume。
  const tranches = Array.isArray(inputs.tranches) ? inputs.tranches : [];
  let pricedFace = 0;
  let pricedRecover = 0;
  let autoFace = 0;
  let totalFace = 0;
  for (const t of tranches) {
    const face = num(t && t.face);
    totalFace += face;
    const disc = clampDisc(t && t.disc);
    if (disc == null) {
      autoFace += face;
    } else {
      pricedFace += face;
      pricedRecover += face * disc;
    }
  }
  const remainder = Number.isFinite(requiredLeadou)
    ? Math.max(0, requiredLeadou - totalFace)
    : 0;
  const autoVolume = autoFace + remainder; // 所有未定折的量（空白列＋剩餘）

  // 未定折量的最低折數：剛好不超成本上限。
  const minDiscount =
    autoVolume > 0 && Number.isFinite(buyCost)
      ? Math.min(
          1,
          Math.max(0, (buyCost - costCap - pricedRecover) / autoVolume)
        )
      : 0;

  // autoDiscount 覆寫；相容舊 inputs.discount；空/null → minDiscount。
  const rawAuto =
    inputs.autoDiscount !== undefined ? inputs.autoDiscount : inputs.discount;
  const autoOverride = clampDisc(rawAuto);
  const autoDiscountUsed = autoOverride == null ? minDiscount : autoOverride;

  const soldRecover = pricedRecover + autoVolume * autoDiscountUsed;
  const discountUsed =
    Number.isFinite(requiredLeadou) && requiredLeadou > 0
      ? Math.min(1, soldRecover / requiredLeadou)
      : 0;

  const netCost = Number.isFinite(buyCost)
    ? buyCost - requiredLeadou * discountUsed
    : Infinity;

  const redemptions = exPts > 0 ? Math.floor(targetPts / exPts) : 0;
  const leftoverPts = targetPts - redemptions * exPts;
  const gamePoints = redemptions * exReward;
  const redeemValue = gamePoints * marketValue;
  const effCost = Number.isFinite(netCost) ? netCost - redeemValue : Infinity;

  // 滾動操作模擬：整批買進送禮 → 折數賣客回收現金 → 再投入，重複到達標或上限輪數。
  const sim = [];
  let cashLeft = cash;
  let acc = 0;
  let round = 0;
  let lossSum = 0;
  if (Number.isFinite(requiredLeadou) && denom > 0) {
    while (acc < requiredLeadou - EPS && round < MAX_ROUNDS) {
      round++;
      const needed = requiredLeadou - acc;
      const potential = cashLeft * denom;
      // 最後一輪只買補足缺口；否則投入全部現金。
      const investCash = potential >= needed ? needed / denom : cashLeft;
      if (investCash <= EPS) break; // 中止：現金耗盡、無法前進
      const bought = investCash * denom;
      acc += bought;
      const soldBack = bought * discountUsed; // 1 樂豆 ≈ 1 元面值
      cashLeft = cashLeft - investCash + soldBack;
      lossSum += investCash - soldBack;
      sim.push({
        round,
        investCash,
        bought,
        acc,
        soldBack,
        cash: cashLeft,
        done: acc >= requiredLeadou - EPS,
      });
    }
  }
  const reached =
    Number.isFinite(requiredLeadou) && acc >= requiredLeadou - EPS;

  return {
    requiredLeadou,
    buyCost,
    minDiscount,
    discountUsed,
    autoDiscountUsed,
    pricedFace,
    autoVolume,
    remainder,
    soldRecover,
    netCost,
    redemptions,
    leftoverPts,
    gamePoints,
    redeemValue,
    effCost,
    sim,
    reached,
    lossSum,
  };
}
