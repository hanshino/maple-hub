import {
  processEquipmentData,
  getEquipmentPosition,
  getEquipmentCategory,
  analyzeScrolls,
  processCashItemEquipmentData,
} from '../../lib/equipmentUtils';

describe('equipmentUtils', () => {
  describe('processEquipmentData', () => {
    it('should return base equipment when no preset', () => {
      const data = {
        preset_no: 1,
        item_equipment: [
          {
            item_equipment_part: '帽子',
            item_equipment_slot: '帽子',
            item_name: 'Hat',
          },
          {
            item_equipment_part: '上衣',
            item_equipment_slot: '上衣',
            item_name: 'Top',
          },
        ],
      };

      const result = processEquipmentData(data);
      expect(result).toHaveProperty('hat');
      expect(result).toHaveProperty('top');
      expect(result.hat.item_name).toBe('Hat');
      expect(result.top.item_name).toBe('Top');
    });

    it('should merge preset equipment with base equipment', () => {
      const data = {
        preset_no: 2,
        item_equipment: [
          {
            item_equipment_part: '帽子',
            item_equipment_slot: '帽子',
            item_name: 'Base Hat',
          },
          {
            item_equipment_part: '上衣',
            item_equipment_slot: '上衣',
            item_name: 'Base Top',
          },
        ],
        item_equipment_preset_2: [
          {
            item_equipment_part: '帽子',
            item_equipment_slot: '帽子',
            item_name: 'Preset Hat',
          },
        ],
      };

      const result = processEquipmentData(data);
      expect(result).toHaveProperty('hat');
      expect(result).toHaveProperty('top');
      expect(result.hat.item_name).toBe('Preset Hat'); // Preset overrides base
      expect(result.top.item_name).toBe('Base Top');
    });
  });

  describe('getEquipmentPosition', () => {
    it('should return correct position for known equipment slots', () => {
      expect(getEquipmentPosition('帽子')).toBe('hat');
      expect(getEquipmentPosition('上衣')).toBe('top');
      expect(getEquipmentPosition('武器')).toBe('weapon');
      expect(getEquipmentPosition('戒指1')).toBe('ring');
      expect(getEquipmentPosition('戒指2')).toBe('ring2');
      expect(getEquipmentPosition('墜飾')).toBe('necklace');
      expect(getEquipmentPosition('墜飾2')).toBe('necklace2');
    });

    it('should return unknown for unrecognized slots', () => {
      expect(getEquipmentPosition('unknown')).toBe('unknown');
    });
  });

  describe('getEquipmentCategory', () => {
    it('should return weapon for 武器', () => {
      expect(getEquipmentCategory({ item_equipment_part: '武器' })).toBe(
        'weapon'
      );
    });

    it('should return weapon for 機器心臟', () => {
      expect(getEquipmentCategory({ item_equipment_part: '機器心臟' })).toBe(
        'weapon'
      );
    });

    it('should return weapon when part is weapon subtype but slot is 武器', () => {
      expect(
        getEquipmentCategory({
          item_equipment_part: '記憶長杖',
          item_equipment_slot: '武器',
        })
      ).toBe('weapon');
    });

    it('should return armor for armor parts', () => {
      expect(getEquipmentCategory({ item_equipment_part: '帽子' })).toBe(
        'armor'
      );
      expect(getEquipmentCategory({ item_equipment_part: '上衣' })).toBe(
        'armor'
      );
      expect(getEquipmentCategory({ item_equipment_part: '手套' })).toBe(
        'armor'
      );
    });

    it('should return accessory for other parts', () => {
      expect(getEquipmentCategory({ item_equipment_part: '戒指' })).toBe(
        'accessory'
      );
      expect(getEquipmentCategory({ item_equipment_part: '耳環' })).toBe(
        'accessory'
      );
    });
  });

  describe('analyzeScrolls', () => {
    const makeItem = (part, scrollUpgrade, attackPower, stat = 0) => ({
      item_equipment_part: part,
      scroll_upgrade: String(scrollUpgrade),
      item_etc_option: {
        attack_power: String(attackPower),
        magic_power: '0',
        str: String(stat),
        dex: '0',
        int: '0',
        luk: '0',
      },
    });

    it('should return null when scroll_upgrade is 0', () => {
      expect(analyzeScrolls(makeItem('武器', 0, 0, 0))).toBeNull();
    });

    it('should return null when attack and stat are both 0', () => {
      expect(analyzeScrolls(makeItem('武器', 3, 0, 0))).toBeNull();
    });

    // === Weapon single scroll types ===
    it('should detect 究極黑暗 weapon (14 atk, 14 stat)', () => {
      const result = analyzeScrolls(makeItem('武器', 3, 42, 42));
      expect(result).toEqual({ type: 'single', name: '究極黑暗', count: 3 });
    });

    it('should detect V weapon (13 atk, 11 stat)', () => {
      const result = analyzeScrolls(makeItem('武器', 4, 52, 44));
      expect(result).toEqual({ type: 'single', name: 'V', count: 4 });
    });

    it('should detect X weapon (12 atk, 10 stat)', () => {
      const result = analyzeScrolls(makeItem('武器', 5, 60, 50));
      expect(result).toEqual({ type: 'single', name: 'X', count: 5 });
    });

    it('should detect RED weapon (10 atk, 8 stat)', () => {
      const result = analyzeScrolls(makeItem('武器', 7, 70, 56));
      expect(result).toEqual({ type: 'single', name: 'RED', count: 7 });
    });

    it('should detect 極電 weapon (9 atk, 5 stat)', () => {
      const result = analyzeScrolls(makeItem('武器', 3, 27, 15));
      expect(result).toEqual({ type: 'single', name: '極電', count: 3 });
    });

    // === Weapon trace types ===
    it('should detect 15% trace weapon (9 atk, 4 stat)', () => {
      const result = analyzeScrolls(makeItem('武器', 3, 27, 12));
      expect(result).toEqual({ type: 'trace', name: '15%咒文', count: 3 });
    });

    it('should detect 30% trace weapon (7 atk, 3 stat)', () => {
      const result = analyzeScrolls(makeItem('武器', 3, 21, 9));
      expect(result).toEqual({ type: 'trace', name: '30%咒文', count: 3 });
    });

    it('should detect 70% trace weapon (5 atk, 2 stat)', () => {
      const result = analyzeScrolls(makeItem('武器', 3, 15, 6));
      expect(result).toEqual({ type: 'trace', name: '70%咒文', count: 3 });
    });

    it('should detect 100% trace weapon (3 atk, 1 stat)', () => {
      const result = analyzeScrolls(makeItem('武器', 3, 9, 3));
      expect(result).toEqual({ type: 'trace', name: '100%咒文', count: 3 });
    });

    // === Armor single scroll types ===
    it('should detect 究極黑暗 armor (9 atk, 2 stat)', () => {
      const result = analyzeScrolls(makeItem('帽子', 3, 27, 6));
      expect(result).toEqual({ type: 'single', name: '究極黑暗', count: 3 });
    });

    it('should detect RED armor (5 atk, 0 stat)', () => {
      const result = analyzeScrolls(makeItem('上衣', 5, 25, 0));
      expect(result).toEqual({ type: 'single', name: 'RED', count: 5 });
    });

    it('should detect 極電 armor (4 atk, 0 stat)', () => {
      const result = analyzeScrolls(makeItem('披風', 3, 12, 0));
      expect(result).toEqual({ type: 'single', name: '極電', count: 3 });
    });

    // === Non-glove armor traces ===
    it('should detect 15% trace on non-glove armor (0 atk)', () => {
      const result = analyzeScrolls(makeItem('帽子', 3, 0, 30));
      expect(result).toEqual({ type: 'trace', name: '15%咒文', count: 3 });
    });

    it('should detect 70% trace on non-glove armor (atk=floor(N/4))', () => {
      // 5 scrolls × stat=4 = 20, atk = floor(5/4) = 1
      const result = analyzeScrolls(makeItem('上衣', 5, 1, 20));
      expect(result).toEqual({ type: 'trace', name: '70%咒文', count: 5 });
    });

    it('should detect 100% trace on non-glove armor (atk=floor(N/4))', () => {
      // 4 scrolls × stat=3 = 12, atk = floor(4/4) = 1
      const result = analyzeScrolls(makeItem('鞋子', 4, 1, 12));
      expect(result).toEqual({ type: 'trace', name: '100%咒文', count: 4 });
    });

    it('should detect 30% trace on non-glove armor (atk=floor(N/4))', () => {
      // 8 scrolls × stat=7 = 56, atk = floor(8/4) = 2
      const result = analyzeScrolls(makeItem('帽子', 8, 2, 56));
      expect(result).toEqual({ type: 'trace', name: '30%咒文', count: 8 });
    });

    // === Glove traces (fixed per-scroll values) ===
    it('should detect 15% trace on gloves (4 atk, 10 stat)', () => {
      const result = analyzeScrolls(makeItem('手套', 3, 12, 30));
      expect(result).toEqual({ type: 'trace', name: '15%咒文', count: 3 });
    });

    it('should detect 70% trace on gloves (2 atk, 4 stat)', () => {
      const result = analyzeScrolls(makeItem('手套', 3, 6, 12));
      expect(result).toEqual({ type: 'trace', name: '70%咒文', count: 3 });
    });

    // === Accessory scrolls ===
    it('should detect X on accessory (7 atk, 0 stat)', () => {
      const result = analyzeScrolls(makeItem('戒指', 3, 21, 0));
      expect(result).toEqual({ type: 'single', name: 'X', count: 3 });
    });

    // === Accessory traces ===
    it('should detect 100% trace on accessory (0 atk, 2 stat)', () => {
      const result = analyzeScrolls(makeItem('耳環', 3, 0, 6));
      expect(result).toEqual({ type: 'trace', name: '100%咒文', count: 3 });
    });

    it('should detect 70% trace on accessory (0 atk, 3 stat)', () => {
      const result = analyzeScrolls(makeItem('耳環', 4, 0, 12));
      expect(result).toEqual({ type: 'trace', name: '70%咒文', count: 4 });
    });

    // === Random scrolls ===
    it('should detect random weapon scroll (avg atk > 14)', () => {
      const result = analyzeScrolls(makeItem('武器', 3, 51, 45));
      expect(result).toEqual({ type: 'random', avg: 17, scrollCount: 3 });
    });

    it('should detect random armor scroll (avg atk > 9, stat=0)', () => {
      const result = analyzeScrolls(makeItem('帽子', 3, 36, 0));
      expect(result).toEqual({ type: 'random', avg: 12, scrollCount: 3 });
    });

    // === 優質 ===
    it('should detect 優質 weapon (stat=3, atk in [10,12] per scroll)', () => {
      // 3 scrolls, stat=9, atk=33 (avg 11, within 10-12)
      const result = analyzeScrolls(makeItem('武器', 3, 33, 9));
      expect(result).toEqual({ type: 'single', name: '優質', count: 3 });
    });

    it('should detect 優質 accessory (stat=0, atk in [4,5] per scroll)', () => {
      // 3 scrolls, stat=0, atk=14 (avg ~4.67, within 4-5)
      const result = analyzeScrolls(makeItem('戒指', 3, 14, 0));
      expect(result).toEqual({ type: 'single', name: '優質', count: 3 });
    });

    // === Mix detection with cross-validation ===
    it('should detect mix of V + X weapon', () => {
      // 1xV(13,11) + 2xX(12,10) = (37, 31)
      const result = analyzeScrolls(makeItem('武器', 3, 37, 31));
      expect(result).toEqual({
        type: 'mix',
        scrolls: [
          { name: 'V', count: 1 },
          { name: 'X', count: 2 },
        ],
      });
    });

    it('should detect mix of 究極黑暗 + RED weapon', () => {
      // 1xB(14,14) + 2xRED(10,8) = (34, 30)
      const result = analyzeScrolls(makeItem('武器', 3, 34, 30));
      expect(result).toEqual({
        type: 'mix',
        scrolls: [
          { name: '究極黑暗', count: 1 },
          { name: 'RED', count: 2 },
        ],
      });
    });

    it('should detect mix of V + RED armor', () => {
      // 1xV(8,0) + 1xRED(5,0) = (13, 0)
      const result = analyzeScrolls(makeItem('帽子', 2, 13, 0));
      expect(result).toEqual({
        type: 'mix',
        scrolls: [
          { name: 'V', count: 1 },
          { name: 'RED', count: 1 },
        ],
      });
    });

    it('should reject mix when stat cross-validation fails', () => {
      // atk=34 could match B+RED by atk, but stat=20 doesn't match
      expect(analyzeScrolls(makeItem('武器', 3, 34, 20))).toBeNull();
    });

    // === Null / no match ===
    it('should return null when no match found', () => {
      expect(analyzeScrolls(makeItem('武器', 3, 35, 20))).toBeNull();
    });

    // === Magic power ===
    it('should use magic_power when higher than attack_power', () => {
      const item = {
        item_equipment_part: '武器',
        scroll_upgrade: '3',
        item_etc_option: {
          attack_power: '0',
          magic_power: '42',
          str: '0',
          dex: '0',
          int: '42',
          luk: '0',
        },
      };
      const result = analyzeScrolls(item);
      expect(result).toEqual({ type: 'single', name: '究極黑暗', count: 3 });
    });

    // === Real-world: weapon subtype in item_equipment_part ===
    it('should detect trace on weapon with subtype part name', () => {
      // Real API data: part="記憶長杖", slot="武器", 8x15%咒文
      // magic=72 (9*8), int=32 (4*8)
      const item = {
        item_equipment_part: '記憶長杖',
        item_equipment_slot: '武器',
        scroll_upgrade: '8',
        item_etc_option: {
          attack_power: '0',
          magic_power: '72',
          str: '0',
          dex: '0',
          int: '32',
          luk: '0',
        },
      };
      const result = analyzeScrolls(item);
      expect(result).toEqual({ type: 'trace', name: '15%咒文', count: 8 });
    });

    // === 機器心臟 uses weapon profiles ===
    it('should treat 機器心臟 as weapon', () => {
      const result = analyzeScrolls(makeItem('機器心臟', 3, 42, 42));
      expect(result).toEqual({ type: 'single', name: '究極黑暗', count: 3 });
    });
  });

  describe('processCashItemEquipmentData', () => {
    it('should normalize cash items from base array to keyed object', () => {
      const data = {
        cash_item_equipment_base: [
          {
            cash_item_equipment_part: '帽子',
            cash_item_equipment_slot: '帽子',
            cash_item_name: '帽子內襯',
            cash_item_icon: 'https://example.com/hat.png',
            cash_item_option: [
              { option_type: 'LUK', option_value: '15' },
              { option_type: '攻擊力', option_value: '35' },
            ],
            date_expire: null,
          },
          {
            cash_item_equipment_part: '套服',
            cash_item_equipment_slot: '上衣',
            cash_item_name: '套服內襯',
            cash_item_icon: 'https://example.com/top.png',
            cash_item_option: [
              { option_type: '攻擊力', option_value: '20' },
            ],
            date_expire: '2026-12-31T00:00+08:00',
          },
          {
            cash_item_equipment_part: '戒指',
            cash_item_equipment_slot: '戒指1',
            cash_item_name: '凝聚的戒指',
            cash_item_icon: 'https://example.com/ring.png',
            cash_item_option: [],
            date_expire: null,
          },
        ],
      };

      const result = processCashItemEquipmentData(data);

      expect(result.hat).toEqual({
        item_name: '帽子內襯',
        item_icon: 'https://example.com/hat.png',
        item_equipment_slot: '帽子',
        cash_item_equipment_part: '帽子',
        cash_item_option: [
          { option_type: 'LUK', option_value: '15' },
          { option_type: '攻擊力', option_value: '35' },
        ],
        date_expire: null,
      });
      expect(result.top.item_name).toBe('套服內襯');
      expect(result.top.date_expire).toBe('2026-12-31T00:00+08:00');
      expect(result.ring.item_name).toBe('凝聚的戒指');
    });

    it('should return empty object when base is empty', () => {
      const data = { cash_item_equipment_base: [] };
      const result = processCashItemEquipmentData(data);
      expect(result).toEqual({});
    });

    it('should return empty object when data is null', () => {
      const result = processCashItemEquipmentData(null);
      expect(result).toEqual({});
    });
  });
});
