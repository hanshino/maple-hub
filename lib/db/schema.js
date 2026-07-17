import {
  mysqlTable,
  varchar,
  int,
  bigint,
  tinyint,
  decimal,
  text,
  json,
  timestamp,
  datetime,
  mysqlEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';

// 1. characters
export const characters = mysqlTable(
  'characters',
  {
    ocid: varchar('ocid', { length: 64 }).primaryKey(),
    characterName: varchar('character_name', { length: 100 }),
    characterLevel: int('character_level'),
    characterClass: varchar('character_class', { length: 50 }),
    characterClassLevel: tinyint('character_class_level'),
    worldName: varchar('world_name', { length: 50 }),
    characterImage: text('character_image'),
    characterExpRate: decimal('character_exp_rate', {
      precision: 10,
      scale: 6,
    }),
    characterGender: varchar('character_gender', { length: 10 }),
    characterGuildName: varchar('character_guild_name', { length: 100 }),
    combatPower: bigint('combat_power', { mode: 'number' }),
    status: mysqlEnum('status', ['success', 'not_found', 'error']).default(
      'success'
    ),
    notFoundCount: int('not_found_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    index('idx_world_class').on(table.worldName, table.characterClass),
    index('idx_combat_power').on(table.combatPower),
    index('idx_name').on(table.characterName),
  ]
);

// 2. character_stats
export const characterStats = mysqlTable('character_stats', {
  ocid: varchar('ocid', { length: 64 })
    .primaryKey()
    .references(() => characters.ocid, { onDelete: 'cascade' }),
  str: int('str'),
  dex: int('dex'),
  intStat: int('int_stat'),
  luk: int('luk'),
  attackPower: int('attack_power'),
  magicPower: int('magic_power'),
  bossDamage: decimal('boss_damage', { precision: 6, scale: 2 }),
  criticalDamage: decimal('critical_damage', { precision: 6, scale: 2 }),
  ignoreDefense: decimal('ignore_defense', { precision: 6, scale: 2 }),
  damage: decimal('damage', { precision: 6, scale: 2 }),
  finalDamage: decimal('final_damage', { precision: 6, scale: 2 }),
  allStats: json('all_stats'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// 3. character_equipment
export const characterEquipment = mysqlTable(
  'character_equipment',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    presetNo: tinyint('preset_no').notNull(),
    itemEquipmentSlot: varchar('item_equipment_slot', { length: 20 }).notNull(),
    itemEquipmentPart: varchar('item_equipment_part', { length: 50 }),
    itemName: varchar('item_name', { length: 100 }),
    itemIcon: text('item_icon'),
    itemLevel: int('item_level'),
    starforce: int('starforce').default(0),
    scrollUpgrade: int('scroll_upgrade').default(0),
    potentialOptionGrade: varchar('potential_option_grade', { length: 20 }),
    potentialOption1: varchar('potential_option_1', { length: 200 }),
    potentialOption2: varchar('potential_option_2', { length: 200 }),
    potentialOption3: varchar('potential_option_3', { length: 200 }),
    additionalPotentialOptionGrade: varchar(
      'additional_potential_option_grade',
      { length: 20 }
    ),
    additionalPotentialOption1: varchar('additional_potential_option_1', {
      length: 200,
    }),
    additionalPotentialOption2: varchar('additional_potential_option_2', {
      length: 200,
    }),
    additionalPotentialOption3: varchar('additional_potential_option_3', {
      length: 200,
    }),
    itemTotalOption: json('item_total_option'),
    itemBaseOption: json('item_base_option'),
    itemStarforceOption: json('item_starforce_option'),
    itemAddOption: json('item_add_option'),
    itemEtcOption: json('item_etc_option'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_preset_slot').on(
      table.ocid,
      table.presetNo,
      table.itemEquipmentSlot
    ),
    index('idx_ocid').on(table.ocid),
    index('idx_potential_grade').on(table.potentialOptionGrade),
  ]
);

// 3b. character_current_equipment
export const characterCurrentEquipment = mysqlTable(
  'character_current_equipment',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    sourceOrdinal: int('source_ordinal').notNull(),
    itemEquipmentSlot: varchar('item_equipment_slot', { length: 20 }).notNull(),
    itemEquipmentPart: varchar('item_equipment_part', { length: 50 }),
    itemName: varchar('item_name', { length: 100 }),
    itemIcon: text('item_icon'),
    itemLevel: int('item_level'),
    starforce: int('starforce').default(0),
    scrollUpgrade: int('scroll_upgrade').default(0),
    potentialOptionGrade: varchar('potential_option_grade', { length: 20 }),
    potentialOption1: varchar('potential_option_1', { length: 200 }),
    potentialOption2: varchar('potential_option_2', { length: 200 }),
    potentialOption3: varchar('potential_option_3', { length: 200 }),
    additionalPotentialOptionGrade: varchar(
      'additional_potential_option_grade',
      { length: 20 }
    ),
    additionalPotentialOption1: varchar('additional_potential_option_1', {
      length: 200,
    }),
    additionalPotentialOption2: varchar('additional_potential_option_2', {
      length: 200,
    }),
    additionalPotentialOption3: varchar('additional_potential_option_3', {
      length: 200,
    }),
    itemTotalOption: json('item_total_option'),
    itemBaseOption: json('item_base_option'),
    itemStarforceOption: json('item_starforce_option'),
    itemAddOption: json('item_add_option'),
    itemEtcOption: json('item_etc_option'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    index('idx_current_equipment_ocid').on(table.ocid),
    index('idx_current_equipment_ocid_ordinal').on(
      table.ocid,
      table.sourceOrdinal
    ),
  ]
);

// 3c. character_equipment_presets
export const characterEquipmentPresets = mysqlTable(
  'character_equipment_presets',
  {
    ocid: varchar('ocid', { length: 64 })
      .primaryKey()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    activePresetNo: tinyint('active_preset_no').notNull().default(1),
    hasCurrentEquipmentSnapshot: tinyint('has_current_equipment_snapshot')
      .notNull()
      .default(0),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  }
);

// 4. character_hyper_stats
export const characterHyperStats = mysqlTable(
  'character_hyper_stats',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    presetNo: tinyint('preset_no').notNull(),
    statType: varchar('stat_type', { length: 20 }).notNull(),
    statLevel: int('stat_level').default(0),
    statIncrease: varchar('stat_increase', { length: 100 }),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_preset_type').on(
      table.ocid,
      table.presetNo,
      table.statType
    ),
    index('idx_ocid').on(table.ocid),
  ]
);

// 4b. character_hyper_stat_presets
export const characterHyperStatPresets = mysqlTable(
  'character_hyper_stat_presets',
  {
    ocid: varchar('ocid', { length: 64 })
      .primaryKey()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    usePresetNo: tinyint('use_preset_no').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  }
);

// 5. character_link_skills
export const characterLinkSkills = mysqlTable(
  'character_link_skills',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    presetNo: tinyint('preset_no').notNull(),
    skillName: varchar('skill_name', { length: 100 }).notNull(),
    skillIcon: varchar('skill_icon', { length: 255 }),
    skillDescription: text('skill_description'),
    skillEffect: text('skill_effect'),
    skillLevel: int('skill_level'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_preset_skill').on(
      table.ocid,
      table.presetNo,
      table.skillName
    ),
    index('idx_ocid').on(table.ocid),
  ]
);

// 5b. character_link_skill_presets
export const characterLinkSkillPresets = mysqlTable(
  'character_link_skill_presets',
  {
    ocid: varchar('ocid', { length: 64 })
      .primaryKey()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    usePresetNo: tinyint('use_preset_no').notNull().default(1),
    ownedLinkSkill: json('owned_link_skill'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  }
);

// 6. character_hexa_cores
export const characterHexaCores = mysqlTable(
  'character_hexa_cores',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    hexaCoreName: varchar('hexa_core_name', { length: 100 }).notNull(),
    hexaCoreLevel: int('hexa_core_level').default(0),
    hexaCoreType: varchar('hexa_core_type', { length: 20 }),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_core').on(table.ocid, table.hexaCoreName),
    index('idx_ocid').on(table.ocid),
  ]
);

// 7. character_hexa_stats
export const characterHexaStats = mysqlTable(
  'character_hexa_stats',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    slotId: varchar('slot_id', { length: 10 }).notNull(),
    mainStatName: varchar('main_stat_name', { length: 50 }),
    subStatName1: varchar('sub_stat_name_1', { length: 50 }),
    subStatName2: varchar('sub_stat_name_2', { length: 50 }),
    mainStatLevel: int('main_stat_level').default(0),
    subStatLevel1: int('sub_stat_level_1').default(0),
    subStatLevel2: int('sub_stat_level_2').default(0),
    statGrade: int('stat_grade').default(0),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_slot').on(table.ocid, table.slotId),
    index('idx_ocid').on(table.ocid),
  ]
);

// 8. character_symbols
export const characterSymbols = mysqlTable(
  'character_symbols',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    symbolName: varchar('symbol_name', { length: 100 }).notNull(),
    symbolIcon: text('symbol_icon'),
    symbolLevel: int('symbol_level').default(0),
    symbolForce: int('symbol_force').default(0),
    symbolGrowthCount: int('symbol_growth_count').default(0),
    symbolRequireGrowthCount: int('symbol_require_growth_count').default(0),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_symbol').on(table.ocid, table.symbolName),
    index('idx_ocid').on(table.ocid),
  ]
);

// 9. character_set_effects
export const characterSetEffects = mysqlTable(
  'character_set_effects',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    setName: varchar('set_name', { length: 100 }).notNull(),
    setLevel: int('set_level').default(0),
    setEffectLevel: int('set_effect_level').default(0),
    setEffectInfo: json('set_effect_info'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_set').on(table.ocid, table.setName),
    index('idx_ocid').on(table.ocid),
  ]
);

// 10. character_union
export const characterUnion = mysqlTable('character_union', {
  ocid: varchar('ocid', { length: 64 })
    .primaryKey()
    .references(() => characters.ocid, { onDelete: 'cascade' }),
  unionLevel: int('union_level'),
  unionGrade: varchar('union_grade', { length: 50 }),
  unionArtifactLevel: int('union_artifact_level'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// 10b. character_union_raider_stats
export const characterUnionRaiderStats = mysqlTable(
  'character_union_raider_stats',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    statValue: varchar('stat_value', { length: 100 }).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);

// 11. character_union_artifacts
export const characterUnionArtifacts = mysqlTable(
  'character_union_artifacts',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    crystalName: varchar('crystal_name', { length: 100 }),
    crystalLevel: int('crystal_level'),
    crystalOptionName1: varchar('crystal_option_name_1', { length: 100 }),
    crystalOptionName2: varchar('crystal_option_name_2', { length: 100 }),
    crystalOptionName3: varchar('crystal_option_name_3', { length: 100 }),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);

// 11b. character_union_artifact_effects
export const characterUnionArtifactEffects = mysqlTable(
  'character_union_artifact_effects',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    effectName: varchar('effect_name', { length: 100 }).notNull(),
    effectLevel: int('effect_level'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);

// 12c. character_union_champion
export const characterUnionChampion = mysqlTable(
  'character_union_champion',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    championSlot: int('champion_slot').notNull(),
    championName: varchar('champion_name', { length: 100 }),
    championGrade: varchar('champion_grade', { length: 10 }),
    championClass: varchar('champion_class', { length: 50 }),
    championOcid: varchar('champion_ocid', { length: 64 }),
    championImage: text('champion_image'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);

// 12d. character_union_champion_badges
export const characterUnionChampionBadges = mysqlTable(
  'character_union_champion_badges',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    championSlot: int('champion_slot'),
    stat: varchar('stat', { length: 255 }).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);

// 12. character_cash_equipment
export const characterCashEquipment = mysqlTable(
  'character_cash_equipment',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    cashItemName: varchar('cash_item_name', { length: 200 }),
    cashItemIcon: text('cash_item_icon'),
    cashItemEquipmentSlot: varchar('cash_item_equipment_slot', { length: 20 }),
    cashItemOption: json('cash_item_option'),
    dateExpire: datetime('date_expire'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);

// 13. character_pet_equipment
export const characterPetEquipment = mysqlTable(
  'character_pet_equipment',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    petName: varchar('pet_name', { length: 100 }),
    petNickname: varchar('pet_nickname', { length: 100 }),
    petIcon: text('pet_icon'),
    petDescription: text('pet_description'),
    petType: varchar('pet_type', { length: 100 }),
    petEquipmentSlot: varchar('pet_equipment_slot', { length: 20 }),
    petTotalOption: json('pet_total_option'),
    petAutoSkill: json('pet_auto_skill'),
    petSkill: json('pet_skill'),
    petDateExpire: datetime('pet_date_expire'),
    petAppearance: varchar('pet_appearance', { length: 100 }),
    petAppearanceIcon: text('pet_appearance_icon'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);

// 14. character_familiars — one row per registered familiar.
// summoned_flag marks the familiar(s) actually equipped (summoned);
// familiar_state='linked' + slot_id refer to the separate 羈絆 (bond
// link) system, NOT to being equipped.
export const characterFamiliars = mysqlTable(
  'character_familiars',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    familiarName: varchar('familiar_name', { length: 100 }),
    familiarLevel: int('familiar_level').default(0),
    optionLevel: int('option_level').default(0),
    familiarGrade: varchar('familiar_grade', { length: 50 }),
    familiarState: varchar('familiar_state', { length: 20 }),
    slotId: varchar('slot_id', { length: 20 }),
    specialFlag: tinyint('special_flag').default(0),
    summonedFlag: tinyint('summoned_flag').default(0),
    familiarOption: json('familiar_option'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);
