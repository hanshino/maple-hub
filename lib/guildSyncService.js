import {
  getCharacterOcid,
  getCharacterBasicInfo,
  getGuildId,
  getGuildBasic,
} from './nexonApi.js';
import {
  upsertGuild,
  upsertGuildSkills,
  syncGuildMembers,
  updateGuildMemberOcid,
  getUnsyncedGuildMembers,
  upsertCharacterBasicOnly,
} from './db/guildQueries.js';
import { getRedis, KEY_PREFIX } from './redis.js';
import { getGlobalRateLimiter } from './rateLimiter.js';

const SYNC_STATUS_TTL = 600; // 10 minutes

export const DEFAULT_SYNC_STATUS = {
  total: 0,
  synced: 0,
  failed: 0,
  inProgress: false,
};

function syncStatusKey(oguildId) {
  return `${KEY_PREFIX}guild:sync:status:${oguildId}`;
}

export async function getSyncStatus(oguildId) {
  const redis = getRedis();
  const status = await redis.hgetall(syncStatusKey(oguildId));
  if (!status || !status.total) return null;
  return {
    total: parseInt(status.total, 10),
    synced: parseInt(status.synced || '0', 10),
    failed: parseInt(status.failed || '0', 10),
    inProgress: status.inProgress === 'true',
    startedAt: status.startedAt,
  };
}

async function setSyncStatus(oguildId, data) {
  const redis = getRedis();
  const key = syncStatusKey(oguildId);
  await redis.hmset(key, {
    total: String(data.total),
    synced: String(data.synced),
    failed: String(data.failed),
    inProgress: String(data.inProgress),
    startedAt: data.startedAt || new Date().toISOString(),
  });
  await redis.expire(key, SYNC_STATUS_TTL);
}

export async function syncGuildMemberBasic(oguildId, characterName) {
  const limiter = getGlobalRateLimiter();

  try {
    const ocid = await limiter.execute(() => getCharacterOcid(characterName));

    const basicInfo = await limiter.execute(() => getCharacterBasicInfo(ocid));

    await upsertCharacterBasicOnly({
      ocid,
      characterName: basicInfo.character_name,
      characterLevel: basicInfo.character_level,
      characterClass: basicInfo.character_class,
      characterClassLevel: basicInfo.character_class_level,
      characterGuildName: basicInfo.character_guild_name,
      characterImage: basicInfo.character_image,
      characterExpRate: basicInfo.character_exp_rate,
      characterGender: basicInfo.character_gender,
      worldName: basicInfo.world_name,
    });

    await updateGuildMemberOcid(oguildId, characterName, ocid);
    return { success: true, characterName, ocid };
  } catch (error) {
    console.error(
      `Guild member sync failed for "${characterName}":`,
      error.message
    );
    return { success: false, characterName, error: error.message };
  }
}

export async function searchAndSyncGuild(guildName, worldName) {
  const limiter = getGlobalRateLimiter();

  const oguildId = await limiter.execute(() =>
    getGuildId(guildName, worldName)
  );

  const guildInfo = await limiter.execute(() => getGuildBasic(oguildId));

  await upsertGuild({
    oguildId,
    guildName: guildInfo.guild_name,
    worldName: guildInfo.world_name,
    guildLevel: guildInfo.guild_level,
    guildFame: guildInfo.guild_fame,
    guildPoint: guildInfo.guild_point,
    guildMasterName: guildInfo.guild_master_name,
    guildMemberCount: guildInfo.guild_member_count,
    guildMark: guildInfo.guild_mark,
    guildMarkCustom: guildInfo.guild_mark_custom,
  });

  await Promise.all([
    upsertGuildSkills(oguildId, guildInfo.guild_skill, 'regular'),
    upsertGuildSkills(oguildId, guildInfo.guild_noblesse_skill, 'noblesse'),
  ]);

  const memberNames = guildInfo.guild_member || [];
  await syncGuildMembers(oguildId, memberNames);

  return { oguildId, guildInfo, memberCount: memberNames.length };
}

export async function startGuildSync(oguildId) {
  const existing = await getSyncStatus(oguildId);
  if (existing && existing.inProgress) {
    return existing;
  }

  const unsynced = await getUnsyncedGuildMembers(oguildId);
  if (unsynced.length === 0) {
    return { total: 0, synced: 0, failed: 0, inProgress: false };
  }

  const status = {
    total: unsynced.length,
    synced: 0,
    failed: 0,
    inProgress: true,
    startedAt: new Date().toISOString(),
  };
  await setSyncStatus(oguildId, status);

  syncMembersInBackground(oguildId, unsynced).catch(err =>
    console.error(`Guild sync background error for ${oguildId}:`, err)
  );

  return status;
}

async function syncMembersInBackground(oguildId, members) {
  let synced = 0;
  let failed = 0;

  for (let i = 0; i < members.length; i++) {
    const result = await syncGuildMemberBasic(
      oguildId,
      members[i].characterName
    );

    if (result.success) {
      synced++;
    } else {
      failed++;
    }

    // Batch Redis writes: update every 10 members
    if ((i + 1) % 10 === 0) {
      await setSyncStatus(oguildId, {
        total: members.length,
        synced,
        failed,
        inProgress: true,
      });
    }
  }

  await setSyncStatus(oguildId, {
    total: members.length,
    synced,
    failed,
    inProgress: false,
  });

  console.log(
    `Guild sync complete for ${oguildId}: ${synced} synced, ${failed} failed`
  );
}
