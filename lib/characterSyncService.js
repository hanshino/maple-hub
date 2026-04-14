import {
  getCharacterBasicInfo,
  getCharacterOcid,
  getCharacterStats,
  getCharacterEquipment,
  getCharacterCashItemEquipment,
  getCharacterPetEquipment,
  getCharacterHyperStat,
  getCharacterLinkSkill,
  getCharacterHexaMatrix,
  getCharacterHexaMatrixStat,
  getCharacterSetEffect,
  getCharacterSymbolEquipment,
  getUnionRaider,
  getUnionArtifact,
  getCharacterUnion,
  getUnionChampion,
} from './nexonApi.js';
import { getGlobalRateLimiter } from './rateLimiter.js';
import {
  upsertCharacter,
  upsertCharacterStats,
  upsertEquipment,
  upsertHyperStats,
  upsertHyperStatPreset,
  upsertLinkSkills,
  upsertLinkSkillPreset,
  upsertHexaCores,
  upsertHexaStats,
  upsertSymbols,
  upsertSetEffects,
  upsertUnion,
  upsertUnionRaiderStats,
  upsertUnionArtifacts,
  upsertUnionArtifactEffects,
  upsertUnionChampion,
  upsertCashEquipment,
  upsertPetEquipment,
  incrementNotFoundCount,
  getCharacterByOcid,
} from './db/queries.js';

const CONCURRENCY = 10;

function parseStatValue(finalStat, ...names) {
  for (const name of names) {
    const stat = finalStat.find(s => s.stat_name === name);
    if (stat) return parseFloat(stat.stat_value) || 0;
  }
  return 0;
}

export async function syncCharacter(ocid) {
  try {
    let basicInfo;
    try {
      basicInfo = await getCharacterBasicInfo(ocid);
    } catch (err) {
      if (err.message?.includes('404') || err.response?.status === 404) {
        await incrementNotFoundCount(ocid);
        return { success: false, ocid, status: 'not_found' };
      }
      throw err;
    }

    const [
      statData,
      equipData,
      cashData,
      petData,
      hyperData,
      linkData,
      hexaData,
      hexaStatData,
      setData,
      symbolData,
      _unionRaiderData,
      artifactData,
      unionBasicData,
      unionChampionData,
    ] = await Promise.allSettled([
      getCharacterStats(ocid),
      getCharacterEquipment(ocid),
      getCharacterCashItemEquipment(ocid),
      getCharacterPetEquipment(ocid),
      getCharacterHyperStat(ocid),
      getCharacterLinkSkill(ocid),
      getCharacterHexaMatrix(ocid),
      getCharacterHexaMatrixStat(ocid),
      getCharacterSetEffect(ocid),
      getCharacterSymbolEquipment(ocid),
      getUnionRaider(ocid),
      getUnionArtifact(ocid),
      getCharacterUnion(ocid),
      getUnionChampion(ocid),
    ]);

    const val = r => (r.status === 'fulfilled' ? r.value : null);

    // 1. Upsert character basic info + combat power
    const stats = val(statData);
    const combatPower = stats
      ? parseStatValue(stats.final_stat || [], '戰鬥力', '전투력')
      : null;

    await upsertCharacter({
      ocid,
      characterName: basicInfo.character_name,
      characterLevel: basicInfo.character_level,
      characterClass: basicInfo.character_class,
      characterClassLevel: basicInfo.character_class_level || null,
      worldName: basicInfo.world_name,
      characterImage: basicInfo.character_image,
      characterExpRate: basicInfo.character_exp_rate || null,
      characterGender: basicInfo.character_gender || null,
      characterGuildName: basicInfo.character_guild_name || null,
      combatPower,
      status: 'success',
      notFoundCount: 0,
    });

    // 2. Upsert stats
    if (stats) {
      const fs = stats.final_stat || [];
      await upsertCharacterStats({
        ocid,
        str: parseStatValue(fs, 'STR'),
        dex: parseStatValue(fs, 'DEX'),
        intStat: parseStatValue(fs, 'INT'),
        luk: parseStatValue(fs, 'LUK'),
        attackPower: parseStatValue(fs, '攻擊力', '공격력'),
        magicPower: parseStatValue(fs, '魔法攻擊力', '마력'),
        bossDamage: parseStatValue(
          fs,
          'BOSS怪物傷害',
          'Boss攻擊時傷害',
          'Boss 攻擊時傷害',
          '보스 몬스터 공격 시 데미지'
        ),
        criticalDamage: parseStatValue(fs, '爆擊傷害', '크리티컬 데미지'),
        ignoreDefense: parseStatValue(
          fs,
          '無視防禦率',
          '無視防禦',
          '防禦無視',
          '방어율 무시'
        ),
        damage: parseStatValue(fs, '傷害'),
        finalDamage: parseStatValue(fs, '最終傷害'),
        allStats: fs,
      });
    }

    // 3. Upsert equipment (3 presets)
    const equip = val(equipData);
    if (equip) {
      for (let p = 1; p <= 3; p++) {
        const key =
          p === 1
            ? 'item_equipment_preset_1'
            : p === 2
              ? 'item_equipment_preset_2'
              : 'item_equipment_preset_3';
        const items = equip[key] || [];
        if (items.length > 0) {
          await upsertEquipment(ocid, p, items);
        }
      }
    }

    // 4. Upsert HyperStat
    const hyper = val(hyperData);
    if (hyper) {
      const presetNo = parseInt(hyper.use_preset_no) || 1;
      await upsertHyperStatPreset(ocid, presetNo);
      for (let p = 1; p <= 3; p++) {
        const stats = hyper[`hyper_stat_preset_${p}`] || [];
        if (stats.length > 0) {
          await upsertHyperStats(ocid, p, stats);
        }
      }
    }

    // 5. Upsert Link Skills
    const link = val(linkData);
    if (link) {
      const presetNo = parseInt(link.use_preset_no) || 1;
      await upsertLinkSkillPreset(ocid, presetNo);
      for (let p = 1; p <= 3; p++) {
        const skills = link[`character_link_skill_preset_${p}`] || [];
        if (skills.length > 0) {
          await upsertLinkSkills(ocid, p, skills);
        }
      }
    }

    // 6. Upsert Hexa cores
    const hexa = val(hexaData);
    const hexaCores =
      hexa?.character_hexa_core_equipment || hexa?.character_hexa_core;
    if (hexaCores && hexaCores.length > 0) {
      await upsertHexaCores(ocid, hexaCores);
    }

    // 7. Upsert Hexa stats (3 cores: character_hexa_stat_core, _2, _3)
    const hexaStat = val(hexaStatData);
    if (hexaStat) {
      const allStatCores = [];
      for (let i = 1; i <= 3; i++) {
        const key =
          i === 1
            ? 'character_hexa_stat_core'
            : `character_hexa_stat_core_${i}`;
        const cores = hexaStat[key] || [];
        for (const core of cores) {
          allStatCores.push({
            ...core,
            slot_id: `${i}_${core.slot_id}`,
          });
        }
      }
      if (allStatCores.length > 0) {
        await upsertHexaStats(ocid, allStatCores);
      }
    }

    // 8. Upsert Symbols
    const symbols = val(symbolData);
    if (symbols && symbols.symbol) {
      await upsertSymbols(ocid, symbols.symbol);
    }

    // 9. Upsert Set Effects
    const sets = val(setData);
    if (sets && sets.set_effect && sets.set_effect.length > 0) {
      await upsertSetEffects(
        ocid,
        sets.set_effect.map(e => ({
          set_name: e.set_name,
          set_level: e.total_set_count || 0,
          set_effect_level: e.set_effect_info?.length || 0,
          set_effect_info: e.set_effect_info || [],
        }))
      );
    }

    // 10. Upsert Union
    const unionBasic = val(unionBasicData);
    if (unionBasic) {
      await upsertUnion(ocid, unionBasic);
    }

    // 10b. Upsert Union Raider Stats
    const raider = val(_unionRaiderData);
    if (raider && raider.union_raider_stat) {
      await upsertUnionRaiderStats(ocid, raider.union_raider_stat);
    }

    // 11. Upsert Union Artifacts
    const artifact = val(artifactData);
    if (artifact && artifact.union_artifact_crystal) {
      await upsertUnionArtifacts(ocid, artifact.union_artifact_crystal);
    }

    // 11b. Upsert Union Artifact Effects
    if (artifact && artifact.union_artifact_effect) {
      await upsertUnionArtifactEffects(ocid, artifact.union_artifact_effect);
    }

    // 12. Upsert Union Champion (with character images)
    const champion = val(unionChampionData);
    if (champion && champion.union_champion) {
      const limiter = getGlobalRateLimiter();
      const championsWithImages = await Promise.all(
        champion.union_champion.map(async c => {
          if (!c.champion_name) return c;
          try {
            // Try local DB first to avoid extra API calls
            const champOcid = await limiter.execute(() =>
              getCharacterOcid(c.champion_name)
            );
            if (!champOcid)
              return { ...c, champion_ocid: null, champion_image: null };
            const cached = await getCharacterByOcid(champOcid);
            if (cached?.characterImage) {
              return {
                ...c,
                champion_ocid: champOcid,
                champion_image: cached.characterImage,
              };
            }
            const basicInfo = await limiter.execute(() =>
              getCharacterBasicInfo(champOcid)
            );
            return {
              ...c,
              champion_ocid: champOcid,
              champion_image: basicInfo.character_image || null,
            };
          } catch {
            return { ...c, champion_ocid: null, champion_image: null };
          }
        })
      );
      await upsertUnionChampion(
        ocid,
        championsWithImages,
        champion.champion_badge_total_info
      );
    }

    // 13. Upsert Cash Equipment
    const cash = val(cashData);
    if (cash && cash.cash_item_equipment_base) {
      await upsertCashEquipment(ocid, cash.cash_item_equipment_base);
    }

    // 14. Upsert Pet Equipment
    const pet = val(petData);
    if (pet) {
      const pets = [];
      for (let i = 1; i <= 3; i++) {
        const name = pet[`pet_${i}_name`];
        if (name) {
          pets.push({
            pet_name: name,
            pet_icon: pet[`pet_${i}_icon`] || null,
            pet_equipment_slot: `pet_${i}`,
            pet_total_option: pet[`pet_${i}_equipment`] || null,
          });
        }
      }
      if (pets.length > 0) {
        await upsertPetEquipment(ocid, pets);
      }
    }

    return { success: true, ocid };
  } catch (error) {
    const rootCause = error.cause?.message || error.message;
    console.error(
      `Failed to sync ${ocid}:`,
      rootCause,
      error.cause?.code ? `(${error.cause.code})` : ''
    );
    return { success: false, ocid, status: 'error', error: rootCause };
  }
}

export async function syncAllCharacters(
  ocids,
  { concurrency = CONCURRENCY } = {}
) {
  const stats = { success: 0, failed: 0, notFound: 0, total: ocids.length };
  const startTime = Date.now();

  for (let i = 0; i < ocids.length; i += concurrency) {
    const batch = ocids.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(ocid => syncCharacter(ocid)));

    for (const r of results) {
      if (r.success) stats.success++;
      else if (r.status === 'not_found') stats.notFound++;
      else stats.failed++;
    }

    console.log(
      `Sync progress: ${i + batch.length}/${ocids.length} ` +
        `(success: ${stats.success}, failed: ${stats.failed}, notFound: ${stats.notFound})`
    );
  }

  stats.executionTimeMs = Date.now() - startTime;
  return stats;
}
