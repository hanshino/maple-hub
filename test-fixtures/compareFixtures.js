// Shared raw-character fixture builder for /compare component tests.
// Mirrors the shape and defaults used by
// __tests__/lib/characterComparison.test.js's local `makeRawCharacter`,
// so component tests exercise the same `getFullCharacterData` contract
// the pure comparison layer was verified against.

export const stat = (name, value) => ({
  stat_name: name,
  stat_value: String(value),
});

export function makeRawCharacter({
  ocid = 'OCID_BASE',
  name = 'Base Character',
  characterClass = '暗殺者',
  level = 290,
  world = '重生',
  combatPower = 1000000000,
  finalStat = [],
  equipmentPresetActive = 1,
  equipmentItems = [],
  hyperStatUsePresetNo = '1',
  hyperStatPresets = {},
  linkSkillUsePresetNo = '1',
  linkSkillPresets = {},
  ownedLinkSkill = null,
  union = { union_level: 1000, union_grade: null, union_artifact_level: null },
  raiderStats = [],
  hexaCores = [],
  hexaStats = {},
  symbols = [],
  setEffects = [],
  familiar = null,
  syncedAt = '2026-07-17T00:00:00.000Z',
} = {}) {
  return {
    basicInfo: {
      ocid,
      character_name: name,
      character_level: level,
      character_class: characterClass,
      character_class_level: null,
      world_name: world,
      character_image: null,
      character_exp_rate: null,
      character_gender: null,
      character_guild_name: null,
      combat_power: combatPower,
    },
    stats: { final_stat: finalStat },
    equipment: {
      preset_no: equipmentPresetActive,
      item_equipment: equipmentItems,
      item_equipment_preset_1: [],
      item_equipment_preset_2: [],
      item_equipment_preset_3: [],
    },
    equipment_presets: {
      active: equipmentPresetActive,
      presets: { 1: [], 2: [], 3: [] },
    },
    hyperStats: {
      use_preset_no: hyperStatUsePresetNo,
      hyper_stat_preset_1: hyperStatPresets['1'] || [],
      hyper_stat_preset_2: hyperStatPresets['2'] || [],
      hyper_stat_preset_3: hyperStatPresets['3'] || [],
    },
    linkSkills: {
      use_preset_no: linkSkillUsePresetNo,
      character_link_skill_preset_1: linkSkillPresets['1'] || [],
      character_link_skill_preset_2: linkSkillPresets['2'] || [],
      character_link_skill_preset_3: linkSkillPresets['3'] || [],
      character_owned_link_skill: ownedLinkSkill,
    },
    hexaCores: { character_hexa_core_equipment: hexaCores },
    hexaStats,
    symbols: { symbol: symbols },
    setEffects: { set_effect: setEffects },
    union,
    unionRaider: { union_raider_stat: raiderStats },
    unionArtifacts: { union_artifact_crystal: [], union_artifact_effect: [] },
    unionChampion: { union_champion: [], champion_badge_total_info: [] },
    cashEquipment: { cash_item_equipment_base: [] },
    petEquipment: {},
    familiar,
    syncedAt,
  };
}

// The spec's verified live sample: 影之愛衣 (mine) vs 護甲大師 (reference),
// same class.
export const shadowRaw = makeRawCharacter({
  ocid: 'OCID_SHADOW',
  name: '影之愛衣',
  characterClass: '夜使者',
  combatPower: 1626455576,
  finalStat: [
    stat('LUK', 100345),
    stat('攻擊力', 16586),
    stat('傷害', 20),
    stat('BOSS怪物傷害', 665),
    stat('無視防禦率', 96.99),
    stat('爆擊傷害', 164.25),
    stat('星力', 1500),
    stat('真實之力', 740),
  ],
  equipmentPresetActive: 2,
  equipmentItems: [
    {
      item_equipment_slot: '帽子',
      item_name: '測試帽子（我方）',
      starforce: 17,
      item_total_option: { str: 30, dex: 0, int: 0, luk: 0 },
      potential_option_1: 'STR +9%',
      potential_option_grade: '傳說',
    },
  ],
  hyperStatUsePresetNo: '2',
  hyperStatPresets: {
    2: [{ stat_type: '力量', stat_level: 10, stat_increase: '+300' }],
  },
  linkSkillUsePresetNo: '2',
  linkSkillPresets: {
    2: [{ skill_name: '夜使者的連結', skill_level: 3 }],
  },
  ownedLinkSkill: '夜使者的連結',
  union: { union_level: 10046, union_grade: null, union_artifact_level: null },
  raiderStats: ['STR : +230', 'DEX : +100', '攻擊力 : +30', 'HP : +1000'],
  hexaCores: [{ hexa_core_name: '核心A', hexa_core_level: 30 }],
  symbols: [{ symbol_name: '符文A', symbol_level: 20 }],
  setEffects: [{ set_name: '套裝A', total_set_count: 6 }],
  familiar: {
    familiar_info: [
      {
        familiar_name: '寒冰半人馬',
        familiar_state: 'linked',
        familiar_level: 5,
        option_level: 5,
        option: [],
      },
      {
        familiar_name: '青蛇',
        familiar_state: 'registered',
        familiar_level: 5,
        option_level: 5,
        option: [],
      },
    ],
  },
  syncedAt: '2026-07-17T14:02:00.000Z',
});

export const armorMasterRaw = makeRawCharacter({
  ocid: 'OCID_ARMOR',
  name: '護甲大師',
  characterClass: '夜使者',
  combatPower: 2002590020,
  finalStat: [
    stat('LUK', 105285),
    stat('攻擊力', 18117),
    stat('傷害', 15),
    stat('BOSS怪物傷害', 703),
    stat('無視防禦率', 97.17),
    stat('爆擊傷害', 149.6),
    stat('星力', 1600),
    stat('真實之力', 770),
  ],
  equipmentPresetActive: 3,
  equipmentItems: [
    {
      item_equipment_slot: '帽子',
      item_name: '測試帽子（參考）',
      starforce: 22,
      item_total_option: { str: 42, dex: 0, int: 0, luk: 0 },
      potential_option_1: 'STR +12%',
      potential_option_grade: '傳說',
    },
  ],
  hyperStatUsePresetNo: '3',
  hyperStatPresets: {
    3: [{ stat_type: '力量', stat_level: 12, stat_increase: '+360' }],
  },
  linkSkillUsePresetNo: '1',
  linkSkillPresets: {
    1: [{ skill_name: '護甲大師的連結', skill_level: 3 }],
  },
  ownedLinkSkill: '護甲大師的連結',
  union: { union_level: 10737, union_grade: null, union_artifact_level: null },
  raiderStats: [
    'STR : +300',
    'DEX : +150',
    '攻擊力 : +40',
    'HP : +1200',
    'DEF : +50',
  ],
  hexaCores: [{ hexa_core_name: '核心A', hexa_core_level: 30 }],
  symbols: [{ symbol_name: '符文A', symbol_level: 25 }],
  setEffects: [{ set_name: '套裝A', total_set_count: 8 }],
  familiar: {
    familiar_info: [
      {
        familiar_name: '樹妖',
        familiar_state: 'registered',
        familiar_level: 5,
        option_level: 5,
        option: [],
      },
      {
        familiar_name: '石巨人',
        familiar_state: 'registered',
        familiar_level: 3,
        option_level: 3,
        option: [],
      },
      {
        familiar_name: '火焰豬',
        familiar_state: 'registered',
        familiar_level: 2,
        option_level: 2,
        option: [],
      },
    ],
  },
  syncedAt: '2026-07-17T13:47:00.000Z',
});
