import axios from 'axios';
import GoogleSheetsClient from './googleSheets';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.API_KEY;
const API_DELAY_MS = 300; // Nexon API rate limit delay

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    accept: 'application/json',
    'x-nxopen-api-key': API_KEY,
  },
});

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch character basic info from Nexon API
 * @param {string} ocid - Character OCID
 * @returns {Promise<{character_name: string, character_level: number, character_image: string, world_name: string, character_class: string} | null>}
 */
export async function fetchCharacterInfo(ocid) {
  try {
    const response = await apiClient.get(`/character/basic?ocid=${ocid}`);
    const data = response.data;

    return {
      character_name: data.character_name || '',
      character_level: data.character_level || 0,
      character_image: data.character_image || '',
      world_name: data.world_name || '',
      character_class: data.character_class || '',
    };
  } catch (error) {
    console.error(`Failed to fetch character info for ${ocid}:`, error.message);
    return null;
  }
}

/**
 * Update all character info cache from Nexon API
 * Fetches character details for all OCIDs and updates CharacterInfo sheet
 * @returns {Promise<{success: boolean, updated: number, failed: number, duration: number}>}
 */
export async function updateAllCharacterInfoCache() {
  const startTime = Date.now();
  const sheetsClient = new GoogleSheetsClient();

  let updatedCount = 0;
  let failedCount = 0;

  try {
    console.log('🔄 Starting character info cache update...');

    // Get all OCIDs from the main sheet
    const { ocids } = await sheetsClient.getAllOcids(0, 10000); // Get all OCIDs

    if (ocids.length === 0) {
      console.log('⚠️ No OCIDs found to update');
      return {
        success: true,
        updated: 0,
        failed: 0,
        duration: (Date.now() - startTime) / 1000,
      };
    }

    console.log(`📋 Found ${ocids.length} OCIDs to update`);

    const recordsToUpsert = [];

    // Fetch character info for each OCID with rate limiting
    for (const ocid of ocids) {
      try {
        const characterInfo = await fetchCharacterInfo(ocid);

        if (characterInfo) {
          recordsToUpsert.push({
            ocid,
            character_name: characterInfo.character_name,
            character_level: characterInfo.character_level,
            character_image: characterInfo.character_image,
            world_name: characterInfo.world_name,
            character_class: characterInfo.character_class,
            cached_at: new Date().toISOString(),
          });
          updatedCount++;
          console.log(
            `✅ Fetched: ${characterInfo.character_name} (${ocid.substring(0, 8)}...)`
          );
        } else {
          failedCount++;
          console.log(`❌ Failed: ${ocid.substring(0, 8)}...`);
        }

        // Rate limiting: wait between API calls
        await sleep(API_DELAY_MS);
      } catch (error) {
        failedCount++;
        console.error(`Error processing ${ocid}:`, error.message);
      }
    }

    // Batch upsert all records
    if (recordsToUpsert.length > 0) {
      await sheetsClient.upsertCharacterInfoCache(recordsToUpsert);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(
      `✅ Character info cache update completed: ${updatedCount} updated, ${failedCount} failed, ${duration.toFixed(1)}s`
    );

    return {
      success: true,
      updated: updatedCount,
      failed: failedCount,
      duration,
    };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.error('❌ Character info cache update failed:', error);

    return {
      success: false,
      updated: updatedCount,
      failed: failedCount,
      duration,
    };
  }
}
