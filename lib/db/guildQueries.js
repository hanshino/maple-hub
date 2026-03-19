import { eq, and, sql, inArray } from 'drizzle-orm';
import { getDb } from './index.js';
import { guilds, guildSkills, guildMembers } from './guildSchema.js';
import { characters } from './schema.js';

export async function upsertGuild(data) {
  const db = getDb();
  await db
    .insert(guilds)
    .values({
      oguildId: data.oguildId,
      guildName: data.guildName,
      worldName: data.worldName,
      guildLevel: data.guildLevel,
      guildFame: data.guildFame,
      guildPoint: data.guildPoint,
      guildMasterName: data.guildMasterName,
      guildMemberCount: data.guildMemberCount,
      guildMark: data.guildMark,
      guildMarkCustom: data.guildMarkCustom,
    })
    .onDuplicateKeyUpdate({
      set: {
        guildName: data.guildName,
        guildLevel: data.guildLevel,
        guildFame: data.guildFame,
        guildPoint: data.guildPoint,
        guildMasterName: data.guildMasterName,
        guildMemberCount: data.guildMemberCount,
        guildMark: data.guildMark,
        guildMarkCustom: data.guildMarkCustom,
        updatedAt: sql`NOW()`,
      },
    });
}

export async function upsertGuildSkills(oguildId, skills, skillType) {
  const db = getDb();
  // Delete existing skills of this type, then insert fresh
  await db
    .delete(guildSkills)
    .where(
      and(
        eq(guildSkills.oguildId, oguildId),
        eq(guildSkills.skillType, skillType)
      )
    );

  if (skills && skills.length > 0) {
    await db.insert(guildSkills).values(
      skills.map(s => ({
        oguildId,
        skillType,
        skillName: s.skill_name,
        skillDescription: s.skill_description,
        skillLevel: s.skill_level,
        skillEffect: s.skill_effect,
        skillIcon: s.skill_icon,
      }))
    );
  }
}

export async function syncGuildMembers(oguildId, memberNames) {
  const db = getDb();

  // Get current members in DB
  const existing = await db
    .select({ id: guildMembers.id, characterName: guildMembers.characterName })
    .from(guildMembers)
    .where(eq(guildMembers.oguildId, oguildId));

  const existingNames = new Set(existing.map(m => m.characterName));
  const newNames = new Set(memberNames);

  // Remove members who left
  const toRemove = existing.filter(m => !newNames.has(m.characterName));
  if (toRemove.length > 0) {
    await db.delete(guildMembers).where(
      inArray(
        guildMembers.id,
        toRemove.map(m => m.id)
      )
    );
  }

  // Add new members
  const toAdd = memberNames.filter(name => !existingNames.has(name));
  if (toAdd.length > 0) {
    await db.insert(guildMembers).values(
      toAdd.map(name => ({
        oguildId,
        characterName: name,
      }))
    );
  }

  return { added: toAdd.length, removed: toRemove.length };
}

export async function getGuildByOguildId(oguildId) {
  const db = getDb();
  const [guild] = await db
    .select()
    .from(guilds)
    .where(eq(guilds.oguildId, oguildId))
    .limit(1);
  return guild || null;
}

export async function getGuildWithMembers(oguildId) {
  const db = getDb();

  const guild = await getGuildByOguildId(oguildId);
  if (!guild) return null;

  // Get members and skills in parallel
  const [members, skills] = await Promise.all([
    db
      .select({
        id: guildMembers.id,
        characterName: guildMembers.characterName,
        ocid: guildMembers.ocid,
        // Character data (null if not synced)
        characterLevel: characters.characterLevel,
        characterClass: characters.characterClass,
        combatPower: characters.combatPower,
        characterImage: characters.characterImage,
        characterExpRate: characters.characterExpRate,
      })
      .from(guildMembers)
      .leftJoin(characters, eq(guildMembers.ocid, characters.ocid))
      .where(eq(guildMembers.oguildId, oguildId)),
    db.select().from(guildSkills).where(eq(guildSkills.oguildId, oguildId)),
  ]);

  return {
    ...guild,
    members,
    skills: {
      regular: skills.filter(s => s.skillType === 'regular'),
      noblesse: skills.filter(s => s.skillType === 'noblesse'),
    },
  };
}

export async function updateGuildMemberOcid(oguildId, characterName, ocid) {
  const db = getDb();
  await db
    .update(guildMembers)
    .set({ ocid, updatedAt: sql`NOW()` })
    .where(
      and(
        eq(guildMembers.oguildId, oguildId),
        eq(guildMembers.characterName, characterName)
      )
    );
}

export async function getGuildsByRecentActivity(days = 7) {
  const db = getDb();
  return db
    .select()
    .from(guilds)
    .where(sql`${guilds.updatedAt} > DATE_SUB(NOW(), INTERVAL ${days} DAY)`);
}

export async function getUnsyncedGuildMembers(oguildId) {
  const db = getDb();
  // Include members with no ocid OR members whose character has no combatPower
  return db
    .select({
      id: guildMembers.id,
      oguildId: guildMembers.oguildId,
      characterName: guildMembers.characterName,
      ocid: guildMembers.ocid,
    })
    .from(guildMembers)
    .leftJoin(characters, eq(guildMembers.ocid, characters.ocid))
    .where(
      and(
        eq(guildMembers.oguildId, oguildId),
        sql`(${guildMembers.ocid} IS NULL OR ${characters.combatPower} IS NULL)`
      )
    );
}

/**
 * Lightweight character upsert for guild sync.
 * Does NOT overwrite combatPower or other fields from the full sync.
 * Uses INSERT ... ON DUPLICATE KEY UPDATE with only basic fields.
 */
export async function upsertCharacterBasicOnly(data) {
  const db = getDb();
  const insertValues = {
    ocid: data.ocid,
    characterName: data.characterName,
    characterLevel: data.characterLevel,
    characterClass: data.characterClass,
    characterClassLevel: data.characterClassLevel,
    characterGuildName: data.characterGuildName,
    characterImage: data.characterImage,
    characterExpRate: data.characterExpRate,
    characterGender: data.characterGender,
    worldName: data.worldName,
    status: 'success',
  };

  const updateSet = {
    characterName: data.characterName,
    characterLevel: data.characterLevel,
    characterClass: data.characterClass,
    characterClassLevel: data.characterClassLevel,
    characterGuildName: data.characterGuildName,
    characterImage: data.characterImage,
    characterExpRate: data.characterExpRate,
    characterGender: data.characterGender,
    worldName: data.worldName,
    updatedAt: sql`NOW()`,
  };

  // Only write combatPower if we actually have a value (avoid overwriting with null)
  if (data.combatPower != null) {
    insertValues.combatPower = data.combatPower;
    updateSet.combatPower = data.combatPower;
  }

  await db
    .insert(characters)
    .values(insertValues)
    .onDuplicateKeyUpdate({ set: updateSet });
}
