import {
  processEquipmentData,
  getEquipmentPosition,
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
});
