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
  characterUnionArtifacts,
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

export async function getAllOcids() {
  const db = getDb();
  const rows = await db
    .select({ ocid: characters.ocid })
    .from(characters)
    .where(eq(characters.status, 'success'));
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
    .where(
      sql`not_found_count >= ${maxNotFoundCount}`
    );
  return result[0]?.affectedRows || 0;
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
      itemLevel: parseInt(item.item_level) || null,
      starforce: parseInt(item.starforce) || 0,
      scrollUpgrade: parseInt(item.scroll_upgrade) || 0,
      potentialOptionGrade: item.potential_option_grade || null,
      potentialOption1: item.potential_option_1 || null,
      potentialOption2: item.potential_option_2 || null,
      potentialOption3: item.potential_option_3 || null,
      additionalPotentialOptionGrade:
        item.additional_potential_option_grade || null,
      additionalPotentialOption1:
        item.additional_potential_option_1 || null,
      additionalPotentialOption2:
        item.additional_potential_option_2 || null,
      additionalPotentialOption3:
        item.additional_potential_option_3 || null,
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
  for (const core of statCores) {
    await db
      .insert(characterHexaStats)
      .values({
        ocid,
        slotId: core.slot_id,
        mainStatName: core.main_stat_name || null,
        subStatName1: core.sub_stat_name_1 || null,
        subStatName2: core.sub_stat_name_2 || null,
        mainStatLevel: core.main_stat_level || 0,
        subStatLevel1: core.sub_stat_level_1 || 0,
        subStatLevel2: core.sub_stat_level_2 || 0,
        statGrade: core.stat_grade || 0,
      })
      .onDuplicateKeyUpdate({
        set: {
          mainStatName: core.main_stat_name || null,
          subStatName1: core.sub_stat_name_1 || null,
          subStatName2: core.sub_stat_name_2 || null,
          mainStatLevel: core.main_stat_level || 0,
          subStatLevel1: core.sub_stat_level_1 || 0,
          subStatLevel2: core.sub_stat_level_2 || 0,
          statGrade: core.stat_grade || 0,
          updatedAt: sql`NOW()`,
        },
      });
  }
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
      crystalType: c.crystal_type || null,
      isPrimary: c.primary || false,
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
