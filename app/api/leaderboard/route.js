import { NextResponse } from 'next/server';
import GoogleSheetsClient from '../../../lib/googleSheets';
import { fetchCharacterInfo } from '../../../lib/characterInfoService';

const API_DELAY_MS = 300; // Nexon API rate limit delay
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * GET /api/leaderboard
 * Retrieves combat power leaderboard data from Google Sheet
 * Returns sorted list of characters by combat power (descending)
 *
 * Query Parameters:
 * - offset: Starting position (0-based), default 0
 * - limit: Maximum entries to return (1-100), default 20
 * - search: Filter by character name (partial match)
 * - worldName: Filter by world name (exact match)
 * - characterClass: Filter by character class (partial match)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate pagination parameters
    let offset = parseInt(searchParams.get('offset') || '0', 10);
    let limit = parseInt(searchParams.get('limit') || '20', 10);

    if (isNaN(offset) || offset < 0) offset = 0;
    if (isNaN(limit) || limit < 1) limit = 20;
    else if (limit > 100) limit = 100;

    // Parse filter parameters
    const search = searchParams.get('search') || null;
    const worldName = searchParams.get('worldName') || null;
    const characterClass = searchParams.get('characterClass') || null;
    const hasFilters = !!(search || worldName || characterClass);

    console.log(
      `📊 Leaderboard API: offset=${offset}, limit=${limit}, search=${search}, worldName=${worldName}, characterClass=${characterClass}`
    );

    const sheetsClient = new GoogleSheetsClient();

    let characterInfoMap = new Map();

    if (hasFilters) {
      // When filtering, we need character info for ALL entries
      // so getLeaderboardData can filter by name/world/class
      const existingRecords =
        await sheetsClient.getExistingCombatPowerRecords();
      const allOcids = [...existingRecords.keys()];
      characterInfoMap = await sheetsClient.getCharacterInfoCache(allOcids);
    }

    // Get leaderboard data from CombatPower sheet
    const {
      entries: combatPowerEntries,
      totalCount,
      hasMore,
    } = await sheetsClient.getLeaderboardData(offset, limit, {
      search,
      worldName,
      characterClass,
      characterInfoMap: hasFilters ? characterInfoMap : undefined,
    });

    if (combatPowerEntries.length === 0) {
      return NextResponse.json({
        entries: [],
        totalCount,
        hasMore: false,
        offset,
        limit,
      });
    }

    // For non-filtered requests, fetch character info for this page only
    if (!hasFilters) {
      const ocids = combatPowerEntries.map(entry => entry.ocid);
      characterInfoMap = await sheetsClient.getCharacterInfoCache(ocids);

      // Find OCIDs that are missing from cache
      const missingOcids = ocids.filter(ocid => !characterInfoMap.has(ocid));

      // Fetch missing character info from Nexon API (with rate limiting)
      if (missingOcids.length > 0) {
        console.log(
          `🔄 Fetching ${missingOcids.length} missing character info from Nexon API...`
        );

        const newRecords = [];

        for (const ocid of missingOcids) {
          try {
            const characterInfo = await fetchCharacterInfo(ocid);

            if (characterInfo) {
              characterInfoMap.set(ocid, {
                character_name: characterInfo.character_name,
                character_level: characterInfo.character_level,
                character_image: characterInfo.character_image,
                world_name: characterInfo.world_name,
                character_class: characterInfo.character_class,
                cached_at: new Date().toISOString(),
              });

              newRecords.push({
                ocid,
                character_name: characterInfo.character_name,
                character_level: characterInfo.character_level,
                character_image: characterInfo.character_image,
                world_name: characterInfo.world_name,
                character_class: characterInfo.character_class,
                cached_at: new Date().toISOString(),
              });

              console.log(`✅ Fetched: ${characterInfo.character_name}`);
            }

            // Rate limiting
            await sleep(API_DELAY_MS);
          } catch (error) {
            console.error(`❌ Failed to fetch ${ocid}:`, error.message);
          }
        }

        // Save to cache (async, don't wait)
        if (newRecords.length > 0) {
          sheetsClient.upsertCharacterInfoCache(newRecords).catch(err => {
            console.error('Failed to cache character info:', err.message);
          });
        }
      }
    }

    // Merge combat power data with character info
    const entries = combatPowerEntries.map((entry, index) => {
      const characterInfo = characterInfoMap.get(entry.ocid);

      return {
        rank: offset + index + 1, // 1-based rank
        ocid: entry.ocid,
        combat_power: entry.combat_power,
        updated_at: entry.updated_at,
        // Character info from cache (may be undefined)
        character_name: characterInfo?.character_name || null,
        character_level: characterInfo?.character_level || null,
        character_image: characterInfo?.character_image || null,
        world_name: characterInfo?.world_name || null,
        character_class: characterInfo?.character_class || null,
      };
    });

    console.log(
      `✅ Leaderboard API: Returning ${entries.length} entries (total: ${totalCount})`
    );

    return NextResponse.json({
      entries,
      totalCount,
      hasMore,
      offset,
      limit,
    });
  } catch (error) {
    console.error('❌ Leaderboard API error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
