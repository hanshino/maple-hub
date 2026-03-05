export const processEquipmentData = equipmentData => {
  const {
    preset_no,
    item_equipment,
    item_equipment_preset_1,
    item_equipment_preset_2,
    item_equipment_preset_3,
  } = equipmentData;

  // Start with base equipment
  let equipment = [...(item_equipment || [])];

  // Merge preset equipment based on preset_no
  let presetEquipment = [];
  if (preset_no === 1 && item_equipment_preset_1) {
    presetEquipment = item_equipment_preset_1;
  } else if (preset_no === 2 && item_equipment_preset_2) {
    presetEquipment = item_equipment_preset_2;
  } else if (preset_no === 3 && item_equipment_preset_3) {
    presetEquipment = item_equipment_preset_3;
  }

  // Override base equipment with preset items (only for slots that have items in preset)
  const equipmentMap = new Map();
  equipment.forEach(item => {
    equipmentMap.set(item.item_equipment_slot, item);
  });

  presetEquipment.forEach(item => {
    equipmentMap.set(item.item_equipment_slot, item);
  });

  // Convert to object keyed by position for easier access
  const equipmentObject = {};
  Array.from(equipmentMap.values()).forEach(item => {
    const position = getEquipmentPosition(item.item_equipment_slot);
    equipmentObject[position] = item;
  });

  return equipmentObject;
};

export const getEquipmentPosition = equipmentSlot => {
  const positionMap = {
    // 帽子類
    帽子: 'hat',

    // 臉部裝飾
    臉飾: 'face-accessory',
    眼飾: 'eye-accessory',

    // 耳環
    耳環: 'earring',

    // 身體裝備
    上衣: 'top',
    '褲/裙': 'bottom',
    鞋子: 'shoes',
    手套: 'gloves',
    披風: 'cape',

    // 飾品
    戒指1: 'ring',
    戒指2: 'ring2',
    戒指3: 'ring3',
    戒指4: 'ring4',
    墜飾: 'necklace',
    墜飾2: 'necklace2',

    // 腰帶和肩膀
    腰帶: 'belt',
    肩膀裝飾: 'shoulder',

    // 特殊裝備
    口袋道具: 'pocket',
    機器心臟: 'machine-heart',
    徽章: 'badge',
    勳章: 'medal',

    // 武器
    武器: 'weapon',
    輔助武器: 'sub-weapon',

    // 套服 (特殊情況，映射到上衣)
    套服: 'top',
  };

  return positionMap[equipmentSlot] || 'unknown';
};

const WEAPON_PARTS = new Set(['武器', '機器心臟']);
const ARMOR_PARTS = new Set([
  '帽子',
  '上衣',
  '褲/裙',
  '套服',
  '鞋子',
  '手套',
  '披風',
  '肩膀裝飾',
]);

// Scroll profiles: { name, atk, stat } per scroll
// atk = attack/magic power per scroll
// stat = max single stat (str/dex/int/luk) per scroll
const WEAPON_SCROLLS = [
  { name: '究極黑暗', atk: 14, stat: 14 },
  { name: 'V', atk: 13, stat: 11 },
  { name: 'X', atk: 12, stat: 10 },
  { name: 'RED', atk: 10, stat: 8 },
  { name: '極電', atk: 9, stat: 5 },
  { name: '15%咒文', atk: 9, stat: 4, trace: true },
  { name: '30%咒文', atk: 7, stat: 3, trace: true },
  { name: '70%咒文', atk: 5, stat: 2, trace: true },
  { name: '100%咒文', atk: 3, stat: 1, trace: true },
];

const ARMOR_SCROLLS = [
  { name: '究極黑暗', atk: 9, stat: 2 },
  { name: 'V', atk: 8, stat: 0 },
  { name: 'X', atk: 7, stat: 0 },
  { name: 'RED', atk: 5, stat: 0 },
  { name: '極電', atk: 4, stat: 0 },
];

const GLOVE_TRACES = [
  { name: '15%咒文', atk: 4, stat: 10, trace: true },
  { name: '30%咒文', atk: 3, stat: 7, trace: true },
  { name: '70%咒文', atk: 2, stat: 4, trace: true },
  { name: '100%咒文', atk: 1, stat: 3, trace: true },
];

// Non-glove armor traces: stat is fixed per scroll,
// atk = floor(N/4) for 100%/70%/30%, 0 for 15%
const ARMOR_TRACES = [
  { name: '15%咒文', stat: 10, atkZero: true, trace: true },
  { name: '30%咒文', stat: 7, trace: true },
  { name: '70%咒文', stat: 4, trace: true },
  { name: '100%咒文', stat: 3, trace: true },
];

const ACCESSORY_SCROLLS = [
  { name: '究極黑暗', atk: 9, stat: 0 },
  { name: 'V', atk: 8, stat: 0 },
  { name: 'X', atk: 7, stat: 0 },
  { name: 'RED', atk: 5, stat: 0 },
  { name: '極電', atk: 4, stat: 0 },
];

const ACCESSORY_TRACES = [
  { name: '70%咒文', atk: 0, stat: 3, trace: true },
  { name: '100%咒文', atk: 0, stat: 2, trace: true },
];

export const getEquipmentCategory = item => {
  const part = item.item_equipment_part;
  const slot = item.item_equipment_slot;
  if (WEAPON_PARTS.has(part) || WEAPON_PARTS.has(slot)) return 'weapon';
  if (ARMOR_PARTS.has(part) || ARMOR_PARTS.has(slot)) return 'armor';
  return 'accessory';
};

const round1 = v => Math.round(v * 10) / 10;

export const analyzeScrolls = item => {
  const N = parseInt(item.scroll_upgrade) || 0;
  if (N === 0) return null;

  const totalAtk = Math.max(
    parseInt(item.item_etc_option?.attack_power) || 0,
    parseInt(item.item_etc_option?.magic_power) || 0,
  );
  const totalStat = Math.max(
    parseInt(item.item_etc_option?.str) || 0,
    parseInt(item.item_etc_option?.dex) || 0,
    parseInt(item.item_etc_option?.int) || 0,
    parseInt(item.item_etc_option?.luk) || 0,
  );

  if (totalAtk === 0 && totalStat === 0) return null;

  const category = getEquipmentCategory(item);
  const isGlove =
    item.item_equipment_part === '手套' ||
    item.item_equipment_slot === '手套';
  const avgAtk = totalAtk / N;

  // Random scrolls (命運/救世) — above highest fixed atk
  if (category === 'weapon' && avgAtk > 14) {
    return { type: 'random', avg: round1(avgAtk), scrollCount: N };
  }
  if (category !== 'weapon' && totalStat === 0 && avgAtk > 9) {
    return { type: 'random', avg: round1(avgAtk), scrollCount: N };
  }

  // Build profile list for exact single-scroll matching
  let profiles;
  if (category === 'weapon') {
    profiles = WEAPON_SCROLLS;
  } else if (category === 'armor') {
    profiles = isGlove
      ? [...ARMOR_SCROLLS, ...GLOVE_TRACES]
      : ARMOR_SCROLLS;
  } else {
    profiles = [...ACCESSORY_SCROLLS, ...ACCESSORY_TRACES];
  }

  // Single scroll exact match (atk AND stat)
  for (const p of profiles) {
    if (totalAtk === p.atk * N && totalStat === p.stat * N) {
      return {
        type: p.trace ? 'trace' : 'single',
        name: p.name,
        count: N,
      };
    }
  }

  // Non-glove armor traces (special atk formula)
  if (category === 'armor' && !isGlove) {
    for (const t of ARMOR_TRACES) {
      if (totalStat === t.stat * N) {
        const expectedAtk = t.atkZero ? 0 : Math.floor(N / 4);
        if (totalAtk === expectedAtk) {
          return { type: 'trace', name: t.name, count: N };
        }
      }
    }
  }

  // 優質 (range-based attack, fixed stat)
  if (category === 'weapon' && totalStat === 3 * N) {
    if (totalAtk >= 10 * N && totalAtk <= 12 * N) {
      return { type: 'single', name: '優質', count: N };
    }
  }
  if (category === 'accessory' && totalStat === 0) {
    if (totalAtk >= 4 * N && totalAtk <= 5 * N) {
      return { type: 'single', name: '優質', count: N };
    }
  }

  // Mix detection — solve linear equations, cross-validate both dimensions
  const mixScrolls = profiles;
  for (let i = 0; i < mixScrolls.length; i++) {
    for (let j = i + 1; j < mixScrolls.length; j++) {
      const hi = mixScrolls[i];
      const lo = mixScrolls[j];
      let a;
      if (hi.atk !== lo.atk) {
        a = (totalAtk - lo.atk * N) / (hi.atk - lo.atk);
      } else if (hi.stat !== lo.stat) {
        a = (totalStat - lo.stat * N) / (hi.stat - lo.stat);
      } else {
        continue;
      }
      const b = N - a;
      if (
        Number.isInteger(a) &&
        a > 0 &&
        Number.isInteger(b) &&
        b > 0 &&
        totalAtk === hi.atk * a + lo.atk * b &&
        totalStat === hi.stat * a + lo.stat * b
      ) {
        return {
          type: 'mix',
          scrolls: [
            { name: hi.name, count: a },
            { name: lo.name, count: b },
          ],
        };
      }
    }
  }

  // No match → don't display
  return null;
};

export const processCashItemEquipmentData = data => {
  if (!data?.cash_item_equipment_base) return {};

  const result = {};
  data.cash_item_equipment_base.forEach(item => {
    const position = getEquipmentPosition(item.cash_item_equipment_slot);
    if (position === 'unknown') return;
    result[position] = {
      item_name: item.cash_item_name,
      item_icon: item.cash_item_icon,
      item_equipment_slot: item.cash_item_equipment_slot,
      cash_item_equipment_part: item.cash_item_equipment_part,
      cash_item_option: item.cash_item_option || [],
      date_expire: item.date_expire || null,
    };
  });
  return result;
};
