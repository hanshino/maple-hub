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
