/**
 * @jest-environment node
 */

import {
  parsePotentialOption,
  identifyIndependentItems,
  extractEquipmentStats,
  identifyLevelingPreset,
  analyzeAllPresets,
} from '../../lib/combatPowerCalculator';

describe('combatPowerCalculator', () => {
  describe('parsePotentialOption', () => {
    it('parses percent LUK', () => {
      expect(parsePotentialOption('LUK : +12%')).toEqual({
        stat: 'LUK',
        value: 12,
        isPercent: true,
      });
    });

    it('parses flat LUK', () => {
      expect(parsePotentialOption('LUK : +30')).toEqual({
        stat: 'LUK',
        value: 30,
        isPercent: false,
      });
    });

    it('parses all-stat percent', () => {
      expect(parsePotentialOption('全屬性 : +9%')).toEqual({
        stat: '全屬性',
        value: 9,
        isPercent: true,
      });
    });

    it('parses attack power percent', () => {
      expect(parsePotentialOption('攻擊力 : +12%')).toEqual({
        stat: '攻擊力',
        value: 12,
        isPercent: true,
      });
    });

    it('parses Boss damage', () => {
      expect(parsePotentialOption('Boss攻擊時傷害 : +40%')).toEqual({
        stat: 'Boss傷害',
        value: 40,
        isPercent: true,
      });
    });

    it('parses critical damage', () => {
      expect(parsePotentialOption('爆擊傷害 : +8%')).toEqual({
        stat: '爆擊傷害',
        value: 8,
        isPercent: true,
      });
    });

    it('parses damage percent', () => {
      expect(parsePotentialOption('傷害 : +12%')).toEqual({
        stat: '傷害',
        value: 12,
        isPercent: true,
      });
    });

    it('parses drop rate', () => {
      expect(parsePotentialOption('道具掉落率 : +20%')).toEqual({
        stat: '道具掉落率',
        value: 20,
        isPercent: true,
      });
    });

    it('returns null for non-stat option', () => {
      expect(parsePotentialOption('每10秒恢復50HP')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parsePotentialOption(null)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parsePotentialOption('')).toBeNull();
    });
  });

  describe('identifyIndependentItems', () => {
    const makeItem = (slot, name) => ({
      item_equipment_slot: slot,
      item_name: name || slot,
    });

    it('returns empty array when no independent items', () => {
      const equipmentData = {
        item_equipment: [makeItem('帽子'), makeItem('武器')],
        item_equipment_preset_1: [makeItem('帽子'), makeItem('武器')],
        item_equipment_preset_2: [makeItem('帽子'), makeItem('武器')],
        item_equipment_preset_3: [makeItem('帽子'), makeItem('武器')],
      };
      expect(identifyIndependentItems(equipmentData)).toEqual([]);
    });

    it('identifies totem (slot not in any preset)', () => {
      const totem = makeItem('馬鞍', 'Totem');
      const equipmentData = {
        item_equipment: [makeItem('帽子'), totem],
        item_equipment_preset_1: [makeItem('帽子')],
        item_equipment_preset_2: [makeItem('帽子')],
        item_equipment_preset_3: [makeItem('帽子')],
      };
      const result = identifyIndependentItems(equipmentData);
      expect(result).toHaveLength(1);
      expect(result[0].item_equipment_slot).toBe('馬鞍');
    });

    it('identifies jewel (duplicate slot in item_equipment)', () => {
      const necklace1 = makeItem('墜飾', 'Necklace');
      const jewel = { item_equipment_slot: '墜飾', item_name: '伊妮絲的寶玉' };
      const equipmentData = {
        item_equipment: [makeItem('帽子'), necklace1, jewel],
        item_equipment_preset_1: [makeItem('帽子'), necklace1],
        item_equipment_preset_2: [makeItem('帽子'), necklace1],
        item_equipment_preset_3: [makeItem('帽子'), necklace1],
      };
      const result = identifyIndependentItems(equipmentData);
      expect(result).toHaveLength(1);
      expect(result[0].item_name).toBe('伊妮絲的寶玉');
    });

    it('handles missing preset data gracefully', () => {
      const equipmentData = {
        item_equipment: [makeItem('帽子')],
        item_equipment_preset_1: null,
        item_equipment_preset_2: null,
        item_equipment_preset_3: null,
      };
      expect(identifyIndependentItems(equipmentData)).toEqual([]);
    });
  });

  describe('extractEquipmentStats', () => {
    const makeItem = overrides => ({
      item_equipment_slot: '帽子',
      item_total_option: {
        str: '0',
        dex: '0',
        int: '0',
        luk: '0',
        attack_power: '0',
        magic_power: '0',
      },
      potential_option_1: null,
      potential_option_2: null,
      potential_option_3: null,
      additional_potential_option_1: null,
      additional_potential_option_2: null,
      additional_potential_option_3: null,
      ...overrides,
    });

    it('sums fixed stats from item_total_option', () => {
      const items = [
        makeItem({ item_total_option: { str: '100', dex: '50', int: '0', luk: '0', attack_power: '20', magic_power: '0' } }),
        makeItem({ item_total_option: { str: '50', dex: '0', int: '0', luk: '0', attack_power: '10', magic_power: '0' } }),
      ];
      const result = extractEquipmentStats(items);
      expect(result.fixed.STR).toBe(150);
      expect(result.fixed.DEX).toBe(50);
      expect(result.fixed.attack_power).toBe(30);
    });

    it('parses percent stats from potential options', () => {
      const items = [
        makeItem({
          item_total_option: { str: '0', dex: '0', int: '0', luk: '100', attack_power: '0', magic_power: '0' },
          potential_option_1: 'LUK : +9%',
          potential_option_2: 'LUK : +6%',
          potential_option_3: null,
        }),
      ];
      const result = extractEquipmentStats(items);
      expect(result.percent.LUK).toBe(15);
    });

    it('distributes 全屬性 to all four stats', () => {
      const items = [
        makeItem({
          item_total_option: { str: '0', dex: '0', int: '0', luk: '0', attack_power: '0', magic_power: '0' },
          potential_option_1: '全屬性 : +9%',
        }),
      ];
      const result = extractEquipmentStats(items);
      expect(result.percent.STR).toBe(9);
      expect(result.percent.DEX).toBe(9);
      expect(result.percent.INT).toBe(9);
      expect(result.percent.LUK).toBe(9);
    });

    it('parses boss damage and critical damage from potentials', () => {
      const items = [
        makeItem({
          item_total_option: { str: '0', dex: '0', int: '0', luk: '0', attack_power: '0', magic_power: '0' },
          potential_option_1: 'Boss攻擊時傷害 : +40%',
          potential_option_2: '爆擊傷害 : +8%',
        }),
      ];
      const result = extractEquipmentStats(items);
      expect(result.percent.boss_damage).toBe(40);
      expect(result.percent.critical_damage).toBe(8);
    });

    it('handles empty items array', () => {
      const result = extractEquipmentStats([]);
      expect(result.fixed.STR).toBe(0);
      expect(result.percent.LUK).toBe(0);
    });
  });

  describe('identifyLevelingPreset', () => {
    const makeItem = potentials => ({
      item_equipment_slot: '帽子',
      item_total_option: { str: '0', dex: '0', int: '0', luk: '0', attack_power: '0', magic_power: '0' },
      potential_option_1: potentials[0] || null,
      potential_option_2: potentials[1] || null,
      potential_option_3: potentials[2] || null,
      additional_potential_option_1: null,
      additional_potential_option_2: null,
      additional_potential_option_3: null,
    });

    it('returns true when >= 3 leveling keywords found', () => {
      const items = [
        makeItem(['道具掉落率 : +20%', '楓幣獲得量 : +20%', '一般怪物傷害 : +20%']),
      ];
      expect(identifyLevelingPreset(items)).toBe(true);
    });

    it('returns false when < 3 leveling keywords', () => {
      const items = [
        makeItem(['道具掉落率 : +20%', '楓幣獲得量 : +20%', 'LUK : +9%']),
      ];
      expect(identifyLevelingPreset(items)).toBe(false);
    });

    it('returns false for empty items', () => {
      expect(identifyLevelingPreset([])).toBe(false);
    });

    it('counts across multiple items', () => {
      const items = [
        makeItem(['道具掉落率 : +20%']),
        makeItem(['楓幣獲得量 : +20%']),
        makeItem(['一般怪物傷害 : +20%']),
      ];
      expect(identifyLevelingPreset(items)).toBe(true);
    });
  });

  describe('analyzeAllPresets', () => {
    it('returns null when equipmentData is null', () => {
      expect(analyzeAllPresets(null, null, null, null)).toBeNull();
    });

    it('returns null when item_equipment is missing', () => {
      expect(analyzeAllPresets({}, null, null, null)).toBeNull();
    });

    it('returns result with current preset from statsData', () => {
      const equipmentData = {
        preset_no: 1,
        item_equipment: [],
        item_equipment_preset_1: [],
        item_equipment_preset_2: [],
        item_equipment_preset_3: [],
      };
      const statsData = {
        final_stat: [{ stat_name: '戰鬥力', stat_value: '1000000000' }],
      };
      const result = analyzeAllPresets(equipmentData, statsData, null, null);
      expect(result).not.toBeNull();
      expect(result.current.presetNo).toBe(1);
      expect(result.current.power).toBe(1000000000);
    });

    it('returns bossing preset with highest power', () => {
      // Preset 1 (current): LUK=50000, ATK=10000
      // Preset 2: LUK=80000, ATK=15000  <- should win
      // Preset 3: LUK=30000, ATK=8000
      const makePreset = (luk, atkPower) => [
        {
          item_equipment_slot: '武器',
          item_total_option: { str: '0', dex: '500', int: '0', luk: String(luk), attack_power: String(atkPower), magic_power: '0' },
          potential_option_1: null,
          potential_option_2: null,
          potential_option_3: null,
          additional_potential_option_1: null,
          additional_potential_option_2: null,
          additional_potential_option_3: null,
        },
      ];
      const equipmentData = {
        preset_no: 1,
        item_equipment: makePreset(50000, 10000),
        item_equipment_preset_1: makePreset(50000, 10000),
        item_equipment_preset_2: makePreset(80000, 15000),
        item_equipment_preset_3: makePreset(30000, 8000),
      };
      // Current (preset 1) stats from API
      const statsData = {
        final_stat: [
          { stat_name: '戰鬥力', stat_value: '26065000' },
          { stat_name: 'LUK', stat_value: '50000' },
          { stat_name: 'DEX', stat_value: '500' },
          { stat_name: 'STR', stat_value: '0' },
          { stat_name: 'INT', stat_value: '0' },
          { stat_name: '攻擊力', stat_value: '10000' },
          { stat_name: '魔法攻擊力', stat_value: '0' },
        ],
      };
      const result = analyzeAllPresets(equipmentData, statsData, null, null);
      expect(result).not.toBeNull();
      expect(result.bossing.presetNo).toBe(2);
    });

    it('sets leveling to null when no leveling preset found', () => {
      const equipmentData = {
        preset_no: 1,
        item_equipment: [],
        item_equipment_preset_1: [],
        item_equipment_preset_2: [],
        item_equipment_preset_3: [],
      };
      const statsData = {
        final_stat: [{ stat_name: '戰鬥力', stat_value: '500000000' }],
      };
      const result = analyzeAllPresets(equipmentData, statsData, null, null);
      expect(result.leveling).toBeNull();
    });
  });
});
