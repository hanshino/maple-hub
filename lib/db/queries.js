import { eq, desc, like, and, sql } from 'drizzle-orm';
import { getDb } from './index.js';
import {
  characters,
  characterStats,
  characterEquipment,
  characterHyperStats,
  characterHyperStatPresets,
  characterLinkSkills,
  characterLinkSkillPresets,
  characterHexaCores,
  characterHexaStats,
  characterSymbols,
  characterSetEffects,
  characterUnion,
  characterUnionRaiderStats,
  characterUnionArtifacts,
  characterUnionArtifactEffects,
  characterCashEquipment,
  characterPetEquipment,
} from './schema.js';

// --- Characters ---

export async function upsertCharacter(data) {
  const db = getDb();
  await db
    .insert(characters)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        characterName: data.characterName,
        characterLevel: data.characterLevel,
        characterClass: data.characterClass,
        characterClassLevel: data.characterClassLevel,
        worldName: data.worldName,
        characterImage: data.characterImage,
        characterExpRate: data.characterExpRate,
        characterGender: data.characterGender,
        characterGuildName: data.characterGuildName,
        combatPower: data.combatPower,
        status: data.status || 'success',
        notFoundCount: data.notFoundCount || 0,
        updatedAt: sql`NOW()`,
      },
    });
}

export async function upsertCharacters(dataArray) {
  for (const data of dataArray) {
    await upsertCharacter(data);
  }
}

export async function getCharacterByOcid(ocid) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(characters)
    .where(eq(characters.ocid, ocid))
    .limit(1);
  return row || null;
}

export async function getCharacterByName(name) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(characters)
    .where(eq(characters.characterName, name))
    .limit(1);
  if (!row) return null;

  const hexaCoreRows = await db
    .select()
    .from(characterHexaCores)
    .where(eq(characterHexaCores.ocid, row.ocid));

  return { ...row, hexaCores: hexaCoreRows };
}

export async function getAllOcids() {
  const db = getDb();
  const rows = await db
    .select({ ocid: characters.ocid })
    .from(characters)
    .where(eq(characters.status, 'success'));
  return rows.map(r => r.ocid);
}

export async function getStaleOcids(hoursThreshold = 6) {
  const db = getDb();
  const rows = await db
    .select({ ocid: characters.ocid })
    .from(characters)
    .where(
      and(
        eq(characters.status, 'success'),
        sql`updated_at < DATE_SUB(NOW(), INTERVAL ${hoursThreshold} HOUR)`
      )
    );
  return rows.map(r => r.ocid);
}

export async function incrementNotFoundCount(ocid) {
  const db = getDb();
  await db
    .update(characters)
    .set({
      status: 'not_found',
      notFoundCount: sql`not_found_count + 1`,
    })
    .where(eq(characters.ocid, ocid));
}

export async function deleteStaleCharacters(maxNotFoundCount = 3) {
  const db = getDb();
  const result = await db
    .delete(characters)
    .where(sql`not_found_count >= ${maxNotFoundCount}`);
  return result[0]?.affectedRows || 0;
}

// --- Full Character Data (single query for all tables) ---

export async function getFullCharacterData(ocid) {
  const db = getDb();
  const [char] = await db
    .select()
    .from(characters)
    .where(eq(characters.ocid, ocid))
    .limit(1);

  if (!char) return null;

  const [
    statsRow,
    equipRows,
    hyperStatRows,
    hyperPresetRow,
    linkSkillRows,
    linkPresetRow,
    hexaCoreRows,
    hexaStatRows,
    symbolRows,
    setEffectRows,
    unionRow,
    unionArtifactRows,
    unionArtifactEffectRows,
    unionRaiderStatRows,
    cashEquipRows,
    petEquipRows,
  ] = await Promise.all([
    db.select().from(characterStats).where(eq(characterStats.ocid, ocid)),
    db
      .select()
      .from(characterEquipment)
      .where(eq(characterEquipment.ocid, ocid)),
    db
      .select()
      .from(characterHyperStats)
      .where(eq(characterHyperStats.ocid, ocid)),
    db
      .select()
      .from(characterHyperStatPresets)
      .where(eq(characterHyperStatPresets.ocid, ocid)),
    db
      .select()
      .from(characterLinkSkills)
      .where(eq(characterLinkSkills.ocid, ocid)),
    db
      .select()
      .from(characterLinkSkillPresets)
      .where(eq(characterLinkSkillPresets.ocid, ocid)),
    db
      .select()
      .from(characterHexaCores)
      .where(eq(characterHexaCores.ocid, ocid)),
    db
      .select()
      .from(characterHexaStats)
      .where(eq(characterHexaStats.ocid, ocid)),
    db.select().from(characterSymbols).where(eq(characterSymbols.ocid, ocid)),
    db
      .select()
      .from(characterSetEffects)
      .where(eq(characterSetEffects.ocid, ocid)),
    db.select().from(characterUnion).where(eq(characterUnion.ocid, ocid)),
    db
      .select()
      .from(characterUnionArtifacts)
      .where(eq(characterUnionArtifacts.ocid, ocid)),
    db
      .select()
      .from(characterUnionArtifactEffects)
      .where(eq(characterUnionArtifactEffects.ocid, ocid)),
    db
      .select()
      .from(characterUnionRaiderStats)
      .where(eq(characterUnionRaiderStats.ocid, ocid)),
    db
      .select()
      .from(characterCashEquipment)
      .where(eq(characterCashEquipment.ocid, ocid)),
    db
      .select()
      .from(characterPetEquipment)
      .where(eq(characterPetEquipment.ocid, ocid)),
  ]);

  // Map equipment rows back to Nexon API format, grouped by preset
  const equipmentData = {
    preset_no: 1,
    item_equipment: [],
    item_equipment_preset_1: [],
    item_equipment_preset_2: [],
    item_equipment_preset_3: [],
  };
  for (const row of equipRows) {
    const key = `item_equipment_preset_${row.presetNo}`;
    if (equipmentData[key]) {
      equipmentData[key].push({
        item_equipment_slot: row.itemEquipmentSlot,
        item_equipment_part: row.itemEquipmentPart,
        item_name: row.itemName,
        item_icon: row.itemIcon,
        item_level: row.itemLevel,
        starforce: row.starforce,
        scroll_upgrade: row.scrollUpgrade,
        potential_option_grade: row.potentialOptionGrade,
        potential_option_1: row.potentialOption1,
        potential_option_2: row.potentialOption2,
        potential_option_3: row.potentialOption3,
        additional_potential_option_grade: row.additionalPotentialOptionGrade,
        additional_potential_option_1: row.additionalPotentialOption1,
        additional_potential_option_2: row.additionalPotentialOption2,
        additional_potential_option_3: row.additionalPotentialOption3,
        item_total_option: row.itemTotalOption,
        item_base_option: row.itemBaseOption,
        item_starforce_option: row.itemStarforceOption,
        item_add_option: row.itemAddOption,
        item_etc_option: row.itemEtcOption,
      });
    }
  }
  // item_equipment = current preset (default preset_1)
  equipmentData.item_equipment = equipmentData.item_equipment_preset_1;

  // Map hyper stats to Nexon format
  const hyperStatData = {
    use_preset_no: String(hyperPresetRow[0]?.usePresetNo || 1),
    hyper_stat_preset_1: [],
    hyper_stat_preset_2: [],
    hyper_stat_preset_3: [],
  };
  for (const row of hyperStatRows) {
    const key = `hyper_stat_preset_${row.presetNo}`;
    if (hyperStatData[key]) {
      hyperStatData[key].push({
        stat_type: row.statType,
        stat_level: row.statLevel,
        stat_increase: row.statIncrease,
      });
    }
  }

  // Map link skills to Nexon format
  const linkSkillData = {
    use_preset_no: String(linkPresetRow[0]?.usePresetNo || 1),
    character_link_skill_preset_1: [],
    character_link_skill_preset_2: [],
    character_link_skill_preset_3: [],
  };
  for (const row of linkSkillRows) {
    const key = `character_link_skill_preset_${row.presetNo}`;
    if (linkSkillData[key]) {
      linkSkillData[key].push({
        skill_name: row.skillName,
        skill_icon: row.skillIcon,
        skill_description: row.skillDescription,
        skill_effect: row.skillEffect,
        skill_level: row.skillLevel,
      });
    }
  }

  // Map hexa cores to Nexon format
  const hexaCoreData = {
    character_hexa_core_equipment: hexaCoreRows.map(row => ({
      hexa_core_name: row.hexaCoreName,
      hexa_core_level: row.hexaCoreLevel,
      hexa_core_type: row.hexaCoreType,
    })),
  };

  // Map hexa stats to Nexon format (3 cores keyed by slot_id prefix)
  const hexaStatData = {};
  for (const row of hexaStatRows) {
    const [coreNum, originalSlotId] = row.slotId.split('_');
    const key =
      coreNum === '1'
        ? 'character_hexa_stat_core'
        : `character_hexa_stat_core_${coreNum}`;
    if (!hexaStatData[key]) hexaStatData[key] = [];
    hexaStatData[key].push({
      slot_id: originalSlotId || row.slotId,
      main_stat_name: row.mainStatName,
      sub_stat_name_1: row.subStatName1,
      sub_stat_name_2: row.subStatName2,
      main_stat_level: row.mainStatLevel,
      sub_stat_level_1: row.subStatLevel1,
      sub_stat_level_2: row.subStatLevel2,
      stat_grade: row.statGrade,
    });
  }

  // Map symbols to Nexon format
  const symbolData = {
    symbol: symbolRows.map(row => ({
      symbol_name: row.symbolName,
      symbol_icon: row.symbolIcon,
      symbol_level: row.symbolLevel,
      symbol_force: row.symbolForce,
      symbol_growth_count: row.symbolGrowthCount,
      symbol_require_growth_count: row.symbolRequireGrowthCount,
    })),
  };

  // Map set effects to Nexon format
  const setEffectData = {
    set_effect: setEffectRows.map(row => ({
      set_name: row.setName,
      total_set_count: row.setLevel,
      set_effect_info: row.setEffectInfo || [],
    })),
  };

  // Map union to Nexon format
  const unionData = unionRow[0]
    ? {
        union_level: unionRow[0].unionLevel,
        union_grade: unionRow[0].unionGrade,
        union_artifact_level: unionRow[0].unionArtifactLevel,
      }
    : null;

  // Map union artifacts to Nexon format
  const unionArtifactData = {
    union_artifact_crystal: unionArtifactRows.map(row => ({
      name: row.crystalName,
      level: row.crystalLevel,
      crystal_option_name_1: row.crystalOptionName1,
      crystal_option_name_2: row.crystalOptionName2,
      crystal_option_name_3: row.crystalOptionName3,
    })),
    union_artifact_effect: unionArtifactEffectRows.map(row => ({
      name: row.effectName,
      level: row.effectLevel,
    })),
  };

  // Map cash equipment to Nexon format
  const cashEquipData = {
    cash_item_equipment_base: cashEquipRows.map(row => ({
      cash_item_name: row.cashItemName,
      cash_item_icon: row.cashItemIcon,
      cash_item_equipment_slot: row.cashItemEquipmentSlot,
      cash_item_option: row.cashItemOption,
      date_expire: row.dateExpire,
    })),
  };

  // Map pet equipment to Nexon format
  const petEquipData = {};
  for (const row of petEquipRows) {
    const slot = row.petEquipmentSlot;
    if (slot) {
      const num = slot.replace('pet_', '');
      petEquipData[`pet_${num}_name`] = row.petName;
      petEquipData[`pet_${num}_icon`] = row.petIcon;
      petEquipData[`pet_${num}_equipment`] = row.petTotalOption;
    }
  }

  return {
    basicInfo: {
      ocid: char.ocid,
      character_name: char.characterName,
      character_level: char.characterLevel,
      character_class: char.characterClass,
      character_class_level: char.characterClassLevel,
      world_name: char.worldName,
      character_image: char.characterImage,
      character_exp_rate: char.characterExpRate,
      character_gender: char.characterGender,
      character_guild_name: char.characterGuildName,
      combat_power: char.combatPower,
    },
    stats: statsRow[0] ? { final_stat: statsRow[0].allStats || [] } : null,
    equipment: equipmentData,
    hyperStats: hyperStatData,
    linkSkills: linkSkillData,
    hexaCores: hexaCoreData,
    hexaStats: hexaStatData,
    symbols: symbolData,
    setEffects: setEffectData,
    union: unionData,
    unionRaider: {
      union_raider_stat: unionRaiderStatRows.map(r => r.statValue),
    },
    unionArtifacts: unionArtifactData,
    cashEquipment: cashEquipData,
    petEquipment: petEquipData,
    syncedAt: char.updatedAt,
  };
}

// --- Character Stats ---

export async function upsertCharacterStats(data) {
  const db = getDb();
  await db
    .insert(characterStats)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        str: data.str,
        dex: data.dex,
        intStat: data.intStat,
        luk: data.luk,
        attackPower: data.attackPower,
        magicPower: data.magicPower,
        bossDamage: data.bossDamage,
        criticalDamage: data.criticalDamage,
        ignoreDefense: data.ignoreDefense,
        damage: data.damage,
        finalDamage: data.finalDamage,
        allStats: data.allStats,
        updatedAt: sql`NOW()`,
      },
    });
}

// --- Leaderboard ---

export async function getLeaderboard({
  offset = 0,
  limit = 20,
  search,
  worldName,
  characterClass,
} = {}) {
  const db = getDb();
  const conditions = [eq(characters.status, 'success')];

  if (search) {
    conditions.push(like(characters.characterName, `%${search}%`));
  }
  if (worldName) {
    conditions.push(eq(characters.worldName, worldName));
  }
  if (characterClass) {
    conditions.push(like(characters.characterClass, `%${characterClass}%`));
  }

  const where = and(...conditions);

  const [entries, countResult] = await Promise.all([
    db
      .select()
      .from(characters)
      .where(where)
      .orderBy(desc(characters.combatPower))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`COUNT(*)` })
      .from(characters)
      .where(where),
  ]);

  const totalCount = Number(countResult[0]?.count || 0);

  return {
    entries: entries.map((entry, i) => ({
      rank: offset + i + 1,
      ocid: entry.ocid,
      combat_power: entry.combatPower,
      updated_at: entry.updatedAt,
      character_name: entry.characterName,
      character_level: entry.characterLevel,
      character_image: entry.characterImage,
      world_name: entry.worldName,
      character_class: entry.characterClass,
    })),
    totalCount,
    hasMore: offset + limit < totalCount,
  };
}

export async function getFilterOptions() {
  const db = getDb();
  const [worlds, classes] = await Promise.all([
    db
      .selectDistinct({ worldName: characters.worldName })
      .from(characters)
      .where(eq(characters.status, 'success')),
    db
      .selectDistinct({ characterClass: characters.characterClass })
      .from(characters)
      .where(eq(characters.status, 'success')),
  ]);

  return {
    worlds: worlds
      .map(r => r.worldName)
      .filter(Boolean)
      .sort(),
    classes: classes
      .map(r => r.characterClass)
      .filter(Boolean)
      .sort(),
  };
}

// --- Bulk upsert helpers for sync service ---

export async function upsertEquipment(ocid, presetNo, items) {
  const db = getDb();
  await db
    .delete(characterEquipment)
    .where(
      and(
        eq(characterEquipment.ocid, ocid),
        eq(characterEquipment.presetNo, presetNo)
      )
    );

  if (items.length === 0) return;

  await db.insert(characterEquipment).values(
    items.map(item => ({
      ocid,
      presetNo,
      itemEquipmentSlot: item.item_equipment_slot,
      itemEquipmentPart: item.item_equipment_part || null,
      itemName: item.item_name,
      itemIcon: item.item_icon,
      itemLevel: parseInt(item.item_base_option?.base_equipment_level) || null,
      starforce: parseInt(item.starforce) || 0,
      scrollUpgrade: parseInt(item.scroll_upgrade) || 0,
      potentialOptionGrade: item.potential_option_grade || null,
      potentialOption1: item.potential_option_1 || null,
      potentialOption2: item.potential_option_2 || null,
      potentialOption3: item.potential_option_3 || null,
      additionalPotentialOptionGrade:
        item.additional_potential_option_grade || null,
      additionalPotentialOption1: item.additional_potential_option_1 || null,
      additionalPotentialOption2: item.additional_potential_option_2 || null,
      additionalPotentialOption3: item.additional_potential_option_3 || null,
      itemTotalOption: item.item_total_option || null,
      itemBaseOption: item.item_base_option || null,
      itemStarforceOption: item.item_starforce_option || null,
      itemAddOption: item.item_add_option || null,
      itemEtcOption: item.item_etc_option || null,
    }))
  );
}

export async function upsertHyperStats(ocid, presetNo, stats) {
  const db = getDb();
  for (const stat of stats) {
    await db
      .insert(characterHyperStats)
      .values({
        ocid,
        presetNo,
        statType: stat.stat_type,
        statLevel: stat.stat_level || 0,
        statIncrease: stat.stat_increase || null,
      })
      .onDuplicateKeyUpdate({
        set: {
          statLevel: stat.stat_level || 0,
          statIncrease: stat.stat_increase || null,
          updatedAt: sql`NOW()`,
        },
      });
  }
}

export async function upsertHyperStatPreset(ocid, usePresetNo) {
  const db = getDb();
  await db
    .insert(characterHyperStatPresets)
    .values({ ocid, usePresetNo })
    .onDuplicateKeyUpdate({
      set: { usePresetNo, updatedAt: sql`NOW()` },
    });
}

export async function upsertLinkSkills(ocid, presetNo, skills) {
  const db = getDb();
  await db
    .delete(characterLinkSkills)
    .where(
      and(
        eq(characterLinkSkills.ocid, ocid),
        eq(characterLinkSkills.presetNo, presetNo)
      )
    );

  if (skills.length === 0) return;

  await db.insert(characterLinkSkills).values(
    skills.map(s => ({
      ocid,
      presetNo,
      skillName: s.skill_name,
      skillIcon: s.skill_icon || null,
      skillDescription: s.skill_description || null,
      skillEffect: s.skill_effect || null,
      skillLevel: s.skill_level || null,
    }))
  );
}

export async function upsertLinkSkillPreset(ocid, usePresetNo) {
  const db = getDb();
  await db
    .insert(characterLinkSkillPresets)
    .values({ ocid, usePresetNo })
    .onDuplicateKeyUpdate({
      set: { usePresetNo, updatedAt: sql`NOW()` },
    });
}

export async function upsertHexaCores(ocid, cores) {
  const db = getDb();
  await db.delete(characterHexaCores).where(eq(characterHexaCores.ocid, ocid));
  if (cores.length === 0) return;

  await db.insert(characterHexaCores).values(
    cores.map(c => ({
      ocid,
      hexaCoreName: c.hexa_core_name,
      hexaCoreLevel: c.hexa_core_level || 0,
      hexaCoreType: c.hexa_core_type || null,
    }))
  );
}

export async function upsertHexaStats(ocid, statCores) {
  const db = getDb();
  await db.delete(characterHexaStats).where(eq(characterHexaStats.ocid, ocid));
  if (statCores.length === 0) return;

  await db.insert(characterHexaStats).values(
    statCores.map(core => ({
      ocid,
      slotId: core.slot_id,
      mainStatName: core.main_stat_name || null,
      subStatName1: core.sub_stat_name_1 || null,
      subStatName2: core.sub_stat_name_2 || null,
      mainStatLevel: core.main_stat_level || 0,
      subStatLevel1: core.sub_stat_level_1 || 0,
      subStatLevel2: core.sub_stat_level_2 || 0,
      statGrade: core.stat_grade || 0,
    }))
  );
}

export async function upsertSymbols(ocid, symbols) {
  const db = getDb();
  await db.delete(characterSymbols).where(eq(characterSymbols.ocid, ocid));
  if (symbols.length === 0) return;

  await db.insert(characterSymbols).values(
    symbols.map(s => ({
      ocid,
      symbolName: s.symbol_name,
      symbolIcon: s.symbol_icon || null,
      symbolLevel: parseInt(s.symbol_level) || 0,
      symbolForce: s.symbol_force || 0,
      symbolGrowthCount: s.symbol_growth_count || 0,
      symbolRequireGrowthCount: s.symbol_require_growth_count || 0,
    }))
  );
}

export async function upsertSetEffects(ocid, effects) {
  const db = getDb();
  await db
    .delete(characterSetEffects)
    .where(eq(characterSetEffects.ocid, ocid));
  if (effects.length === 0) return;

  await db.insert(characterSetEffects).values(
    effects.map(e => ({
      ocid,
      setName: e.set_name,
      setLevel: e.set_level || 0,
      setEffectLevel: e.set_effect_level || 0,
      setEffectInfo: e.set_effect_info || [],
    }))
  );
}

export async function upsertUnion(ocid, data) {
  const db = getDb();
  await db
    .insert(characterUnion)
    .values({
      ocid,
      unionLevel: data.union_level || null,
      unionGrade: data.union_grade || null,
      unionArtifactLevel: data.union_artifact_level || null,
    })
    .onDuplicateKeyUpdate({
      set: {
        unionLevel: data.union_level || null,
        unionGrade: data.union_grade || null,
        unionArtifactLevel: data.union_artifact_level || null,
        updatedAt: sql`NOW()`,
      },
    });
}

export async function upsertUnionRaiderStats(ocid, stats) {
  const db = getDb();
  await db
    .delete(characterUnionRaiderStats)
    .where(eq(characterUnionRaiderStats.ocid, ocid));
  if (!stats || stats.length === 0) return;

  await db.insert(characterUnionRaiderStats).values(
    stats.map(s => ({
      ocid,
      statValue: s,
    }))
  );
}

export async function upsertUnionArtifacts(ocid, crystals) {
  const db = getDb();
  await db
    .delete(characterUnionArtifacts)
    .where(eq(characterUnionArtifacts.ocid, ocid));
  if (!crystals || crystals.length === 0) return;

  await db.insert(characterUnionArtifacts).values(
    crystals.map(c => ({
      ocid,
      crystalName: c.name || null,
      crystalLevel: c.level || null,
      crystalOptionName1: c.crystal_option_name_1 || null,
      crystalOptionName2: c.crystal_option_name_2 || null,
      crystalOptionName3: c.crystal_option_name_3 || null,
    }))
  );
}

export async function upsertUnionArtifactEffects(ocid, effects) {
  const db = getDb();
  await db
    .delete(characterUnionArtifactEffects)
    .where(eq(characterUnionArtifactEffects.ocid, ocid));
  if (!effects || effects.length === 0) return;

  await db.insert(characterUnionArtifactEffects).values(
    effects.map(e => ({
      ocid,
      effectName: e.name,
      effectLevel: e.level || null,
    }))
  );
}

export async function upsertCashEquipment(ocid, items) {
  const db = getDb();
  await db
    .delete(characterCashEquipment)
    .where(eq(characterCashEquipment.ocid, ocid));
  if (!items || items.length === 0) return;

  await db.insert(characterCashEquipment).values(
    items.map(item => ({
      ocid,
      cashItemName: item.cash_item_name || null,
      cashItemIcon: item.cash_item_icon || null,
      cashItemEquipmentSlot: item.cash_item_equipment_slot || null,
      cashItemOption: item.cash_item_option || null,
      dateExpire: item.date_expire ? new Date(item.date_expire) : null,
    }))
  );
}

export async function upsertPetEquipment(ocid, pets) {
  const db = getDb();
  await db
    .delete(characterPetEquipment)
    .where(eq(characterPetEquipment.ocid, ocid));
  if (!pets || pets.length === 0) return;

  await db.insert(characterPetEquipment).values(
    pets.map(p => ({
      ocid,
      petName: p.pet_name || null,
      petIcon: p.pet_icon || null,
      petEquipmentSlot: p.pet_equipment_slot || null,
      petTotalOption: p.pet_total_option || null,
    }))
  );
}
