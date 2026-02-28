import { google } from 'googleapis';

class GoogleSheetsClient {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_SHEETS_PROJECT_ID,
        private_key_id: process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(
          /\\n/g,
          '\n'
        ),
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url:
          'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_SHEETS_CLIENT_X509_CERT_URL,
        universe_domain: 'googleapis.com',
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.SPREADSHEET_ID;

    // Performance optimizations
    this.ocidCache = new Map(); // Cache OCID existence checks
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache expiry
    this.lastFullSync = 0;
    this.fullSyncInterval = 10 * 60 * 1000; // 10 minutes between full cache refreshes
  }

  /**
   * Check if OCID exists with caching for performance
   * @param {string} ocid - The OCID to check
   * @returns {boolean} - True if OCID exists
   */
  async ocidExists(ocid) {
    // Check cache first
    const cached = this.ocidCache.get(ocid);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.exists;
    }

    // Check if we need a full cache refresh
    if (Date.now() - this.lastFullSync > this.fullSyncInterval) {
      await this.refreshCache();
      const cachedAfterRefresh = this.ocidCache.get(ocid);
      if (cachedAfterRefresh) {
        return cachedAfterRefresh.exists;
      }
    }

    // Individual check with caching
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:A', // Check column A for OCIDs
      });
      const values = response.data.values || [];
      const exists = values.some(row => row[0] === ocid);

      // Cache the result
      this.ocidCache.set(ocid, {
        exists,
        timestamp: Date.now(),
      });

      return exists;
    } catch (error) {
      console.error('Error checking OCID existence:', error);
      return false; // Assume not exists on error to avoid blocking
    }
  }

  /**
   * Refresh the entire OCID cache from Google Sheets
   */
  async refreshCache() {
    try {
      console.log('🔄 Refreshing OCID cache from Google Sheets...');
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:A',
      });
      const values = response.data.values || [];

      // Clear old cache and rebuild
      this.ocidCache.clear();
      values.forEach(row => {
        if (row[0]) {
          this.ocidCache.set(row[0], {
            exists: true,
            timestamp: Date.now(),
          });
        }
      });

      this.lastFullSync = Date.now();
      console.log(
        `✅ OCID cache refreshed with ${this.ocidCache.size} entries`
      );
    } catch (error) {
      console.error('Error refreshing OCID cache:', error);
      // Don't clear cache on error - keep stale data better than no data
    }
  }

  /**
   * Append multiple OCIDs to Google Sheets in batch
   * @param {string[]} ocids - Array of OCIDs to append
   */
  async appendOcids(ocids) {
    if (ocids.length === 0) return;

    console.log(`📤 Appending ${ocids.length} OCIDs to Google Sheets...`);

    const values = ocids.map(ocid => [ocid]);

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'A:A',
        valueInputOption: 'RAW',
        resource: { values },
      });

      // Update cache for newly added OCIDs
      const now = Date.now();
      ocids.forEach(ocid => {
        this.ocidCache.set(ocid, {
          exists: true,
          timestamp: now,
        });
      });

      console.log(
        `✅ Successfully appended ${ocids.length} OCIDs to Google Sheets`
      );
    } catch (error) {
      console.error('Error appending OCIDs to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Clear expired cache entries to prevent memory leaks
   */
  clearExpiredCache() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, value] of this.ocidCache) {
      if (now - value.timestamp > this.cacheExpiry) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.ocidCache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(
        `🧹 Cleared ${expiredKeys.length} expired OCID cache entries`
      );
    }
  }

  // ============================================
  // Combat Power Tracking Methods (T003-T005)
  // ============================================

  /**
   * Get all OCIDs from the OCID sheet with pagination support
   * @param {number} offset - Starting position (0-based)
   * @param {number} limit - Maximum number of OCIDs to return
   * @returns {Promise<{ocids: string[], totalCount: number, hasMore: boolean}>}
   */
  async getAllOcids(offset = 0, limit = 15) {
    try {
      console.log(
        `📥 Fetching OCIDs from Google Sheets (offset=${offset}, limit=${limit})...`
      );

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:A',
      });

      const values = response.data.values || [];
      // Filter out empty rows and header (case-insensitive)
      const allOcids = values
        .map(row => row[0])
        .filter(
          ocid => ocid && ocid.trim() !== '' && ocid.toLowerCase() !== 'ocid'
        );

      const totalCount = allOcids.length;
      const paginatedOcids = allOcids.slice(offset, offset + limit);
      const hasMore = offset + limit < totalCount;

      console.log(
        `✅ Fetched ${paginatedOcids.length} OCIDs (total: ${totalCount}, hasMore: ${hasMore})`
      );

      return {
        ocids: paginatedOcids,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('Error fetching OCIDs from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Get or create the CombatPower sheet
   * @returns {Promise<{sheetId: number, sheetName: string}>}
   */
  async getCombatPowerSheet() {
    const sheetName = 'CombatPower';

    try {
      // Get spreadsheet metadata to check if sheet exists
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheet = spreadsheet.data.sheets?.find(
        sheet => sheet.properties?.title === sheetName
      );

      if (existingSheet) {
        console.log(`✅ Found existing ${sheetName} sheet`);
        return {
          sheetId: existingSheet.properties.sheetId,
          sheetName,
        };
      }

      // Create new sheet with headers
      console.log(`📝 Creating new ${sheetName} sheet...`);
      const addSheetResponse = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });

      const newSheetId =
        addSheetResponse.data.replies[0].addSheet.properties.sheetId;

      // Add headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:E1`,
        valueInputOption: 'RAW',
        resource: {
          values: [
            ['ocid', 'combat_power', 'updated_at', 'status', 'not_found_count'],
          ],
        },
      });

      console.log(`✅ Created ${sheetName} sheet with headers`);

      return {
        sheetId: newSheetId,
        sheetName,
      };
    } catch (error) {
      console.error(`Error getting/creating ${sheetName} sheet:`, error);
      throw error;
    }
  }

  /**
   * Get existing combat power records as a Map
   * @returns {Promise<Map<string, {combat_power: string, updated_at: string, status: string, not_found_count: number}>>}
   */
  async getExistingCombatPowerRecords() {
    const sheetName = 'CombatPower';
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:E`,
      });

      const values = response.data.values || [];
      const recordsMap = new Map();

      // Skip header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const [ocid, combat_power, updated_at, status, not_found_count] =
          values[i];
        if (ocid && ocid.trim() !== '') {
          recordsMap.set(ocid, {
            combat_power,
            updated_at,
            status,
            not_found_count: parseInt(not_found_count, 10) || 0,
          });
        }
      }

      console.log(`📋 Loaded ${recordsMap.size} existing combat power records`);
      return recordsMap;
    } catch (_error) {
      // Sheet might not exist yet
      console.log('⚠️ CombatPower sheet not found, returning empty map');
      return new Map();
    }
  }

  /**
   * Upsert combat power records (update existing or insert new)
   * @param {Array<{ocid: string, combat_power: string, updated_at: string, status: string, not_found_count: number}>} records
   * @returns {Promise<{updated: number, inserted: number}>}
   */
  async upsertCombatPowerRecords(records, existingData = null) {
    if (records.length === 0) {
      console.log('⚠️ No records to upsert');
      return { updated: 0, inserted: 0 };
    }

    const sheetName = 'CombatPower';

    try {
      console.log(`📤 Upserting ${records.length} combat power records...`);

      // Use provided existingData or read from sheet
      if (existingData === null) {
        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A:E`,
          });
          existingData = response.data.values || [];
        } catch (_error) {
          // Sheet might not exist yet, getCombatPowerSheet will create it
          await this.getCombatPowerSheet();
          existingData = [
            ['ocid', 'combat_power', 'updated_at', 'status', 'not_found_count'],
          ];
        }
      }

      // Build OCID to row index map (skip header)
      const ocidToRowIndex = new Map();
      for (let i = 1; i < existingData.length; i++) {
        const ocid = existingData[i][0];
        if (ocid) {
          ocidToRowIndex.set(ocid, i + 1); // +1 for 1-based row index
        }
      }

      let updatedCount = 0;
      let insertedCount = 0;
      const toInsert = [];
      const updateRequests = [];

      for (const record of records) {
        const rowIndex = ocidToRowIndex.get(record.ocid);
        const notFoundCount = record.not_found_count || 0;

        if (rowIndex) {
          // Update existing row
          updateRequests.push({
            range: `${sheetName}!A${rowIndex}:E${rowIndex}`,
            values: [
              [
                record.ocid,
                record.combat_power,
                record.updated_at,
                record.status,
                String(notFoundCount),
              ],
            ],
          });
          updatedCount++;
        } else {
          // Insert new row
          toInsert.push([
            record.ocid,
            record.combat_power,
            record.updated_at,
            record.status,
            String(notFoundCount),
          ]);
          insertedCount++;
        }
      }

      // Batch update existing records
      if (updateRequests.length > 0) {
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            valueInputOption: 'RAW',
            data: updateRequests,
          },
        });
      }

      // Append new records
      if (toInsert.length > 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:E`,
          valueInputOption: 'RAW',
          resource: { values: toInsert },
        });
      }

      console.log(
        `✅ Upserted ${records.length} records (${updatedCount} updated, ${insertedCount} inserted)`
      );

      return { updated: updatedCount, inserted: insertedCount };
    } catch (error) {
      console.error('Error upserting combat power records:', error);
      throw error;
    }
  }

  // ============================================
  // CharacterInfo Cache Methods (T001-T004)
  // ============================================

  /**
   * Get or create the CharacterInfo sheet for caching character details
   * @returns {Promise<{sheetId: number, sheetName: string}>}
   */
  async getOrCreateCharacterInfoSheet() {
    const sheetName = 'CharacterInfo';

    try {
      // Get spreadsheet metadata to check if sheet exists
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheet = spreadsheet.data.sheets?.find(
        sheet => sheet.properties?.title === sheetName
      );

      if (existingSheet) {
        console.log(`✅ Found existing ${sheetName} sheet`);
        return {
          sheetId: existingSheet.properties.sheetId,
          sheetName,
        };
      }

      // Create new sheet with headers
      console.log(`📝 Creating new ${sheetName} sheet...`);
      const addSheetResponse = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });

      const newSheetId =
        addSheetResponse.data.replies[0].addSheet.properties.sheetId;

      // Add headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:G1`,
        valueInputOption: 'RAW',
        resource: {
          values: [
            [
              'ocid',
              'character_name',
              'character_level',
              'character_image',
              'world_name',
              'character_class',
              'cached_at',
            ],
          ],
        },
      });

      console.log(`✅ Created ${sheetName} sheet with headers`);

      return {
        sheetId: newSheetId,
        sheetName,
      };
    } catch (error) {
      console.error(`Error getting/creating ${sheetName} sheet:`, error);
      throw error;
    }
  }

  /**
   * Get character info cache by OCIDs
   * @param {string[]} ocids - Array of OCIDs to fetch
   * @returns {Promise<Map<string, {character_name: string, character_level: number, character_image: string, world_name: string, character_class: string, cached_at: string}>>}
   */
  async getCharacterInfoCache(ocids) {
    const sheetName = 'CharacterInfo';
    const resultMap = new Map();

    if (!ocids || ocids.length === 0) {
      return resultMap;
    }

    try {
      // Ensure sheet exists
      await this.getOrCreateCharacterInfoSheet();

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:G`,
      });

      const values = response.data.values || [];
      const ocidSet = new Set(ocids);

      // Skip header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const [
          ocid,
          character_name,
          character_level,
          character_image,
          world_name,
          character_class,
          cached_at,
        ] = values[i];

        if (ocid && ocidSet.has(ocid)) {
          resultMap.set(ocid, {
            character_name: character_name || '',
            character_level: character_level
              ? parseInt(character_level, 10)
              : null,
            character_image: character_image || '',
            world_name: world_name || '',
            character_class: character_class || '',
            cached_at: cached_at || '',
          });
        }
      }

      console.log(
        `📋 Fetched ${resultMap.size} character info records from cache`
      );
      return resultMap;
    } catch (error) {
      console.error('Error fetching character info cache:', error);
      return resultMap; // Return empty map on error
    }
  }

  /**
   * Get all CharacterInfo data as raw rows (including header)
   * Used to pass as existingData to upsertCharacterInfoCache to avoid re-reading
   * @returns {Promise<Array<Array<string>>>}
   */
  async getAllCharacterInfoData() {
    const sheetName = 'CharacterInfo';

    try {
      await this.getOrCreateCharacterInfoSheet();

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:G`,
      });

      return response.data.values || [];
    } catch (_error) {
      console.log('⚠️ CharacterInfo sheet not found, returning empty array');
      return [];
    }
  }

  /**
   * Upsert character info cache records
   * @param {Array<{ocid: string, character_name: string, character_level: number, character_image: string, world_name: string, character_class: string, cached_at: string}>} records
   * @returns {Promise<{updated: number, inserted: number}>}
   */
  async upsertCharacterInfoCache(records, existingData = null) {
    if (!records || records.length === 0) {
      console.log('⚠️ No character info records to upsert');
      return { updated: 0, inserted: 0 };
    }

    const sheetName = 'CharacterInfo';

    try {
      console.log(`📤 Upserting ${records.length} character info records...`);

      // Ensure sheet exists
      await this.getOrCreateCharacterInfoSheet();

      // Use provided existingData or read from sheet
      if (existingData === null) {
        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A:G`,
          });
          existingData = response.data.values || [];
        } catch (_error) {
          existingData = [
            [
              'ocid',
              'character_name',
              'character_level',
              'character_image',
              'world_name',
              'character_class',
              'cached_at',
            ],
          ];
        }
      }

      // Build OCID to row index map (skip header)
      const ocidToRowIndex = new Map();
      for (let i = 1; i < existingData.length; i++) {
        const ocid = existingData[i][0];
        if (ocid) {
          ocidToRowIndex.set(ocid, i + 1); // +1 for 1-based row index
        }
      }

      let updatedCount = 0;
      let insertedCount = 0;
      const toInsert = [];
      const updateRequests = [];

      for (const record of records) {
        const rowIndex = ocidToRowIndex.get(record.ocid);
        const rowData = [
          record.ocid,
          record.character_name || '',
          record.character_level?.toString() || '',
          record.character_image || '',
          record.world_name || '',
          record.character_class || '',
          record.cached_at || new Date().toISOString(),
        ];

        if (rowIndex) {
          // Update existing row
          updateRequests.push({
            range: `${sheetName}!A${rowIndex}:G${rowIndex}`,
            values: [rowData],
          });
          updatedCount++;
        } else {
          // Insert new row
          toInsert.push(rowData);
          insertedCount++;
        }
      }

      // Batch update existing records
      if (updateRequests.length > 0) {
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            valueInputOption: 'RAW',
            data: updateRequests,
          },
        });
      }

      // Append new records
      if (toInsert.length > 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:G`,
          valueInputOption: 'RAW',
          resource: { values: toInsert },
        });
      }

      console.log(
        `✅ Upserted ${records.length} character info records (${updatedCount} updated, ${insertedCount} inserted)`
      );

      return { updated: updatedCount, inserted: insertedCount };
    } catch (error) {
      console.error('Error upserting character info cache:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard data from CombatPower sheet, sorted by combat power descending
   * @param {number} offset - Starting position (0-based)
   * @param {number} limit - Maximum number of entries to return
   * @returns {Promise<{entries: Array<{ocid: string, combat_power: number, updated_at: string}>, totalCount: number, hasMore: boolean}>}
   */
  async getLeaderboardData(offset = 0, limit = 20, filters = {}) {
    const sheetName = 'CombatPower';

    try {
      console.log(
        `📥 Fetching leaderboard data (offset=${offset}, limit=${limit})...`
      );

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:E`,
      });

      const values = response.data.values || [];

      // Skip header row and filter valid entries with successful status
      const entries = [];
      for (let i = 1; i < values.length; i++) {
        const [ocid, combat_power, updated_at, status] = values[i];
        if (ocid && combat_power && status === 'success') {
          entries.push({
            ocid,
            combat_power: parseInt(combat_power, 10) || 0,
            updated_at: updated_at || '',
          });
        }
      }

      // Sort by combat_power descending, then by ocid ascending for stable sort
      entries.sort((a, b) => {
        if (b.combat_power !== a.combat_power) {
          return b.combat_power - a.combat_power;
        }
        return a.ocid.localeCompare(b.ocid);
      });

      // Apply filters if characterInfoMap is provided
      const {
        characterInfoMap,
        search,
        worldName,
        characterClass,
      } = filters;
      const hasFilters = !!(search || worldName || characterClass);
      let filtered = entries;

      if (characterInfoMap && hasFilters) {
        filtered = entries.filter((entry) => {
          const info = characterInfoMap.get(entry.ocid);
          if (!info) return false;

          if (
            search &&
            !info.character_name
              .toLowerCase()
              .includes(search.toLowerCase())
          ) {
            return false;
          }
          if (worldName && info.world_name !== worldName) {
            return false;
          }
          if (
            characterClass &&
            !info.character_class
              .toLowerCase()
              .includes(characterClass.toLowerCase())
          ) {
            return false;
          }
          return true;
        });
      }

      const totalCount = filtered.length;
      const paginatedEntries = filtered.slice(offset, offset + limit);
      const hasMore = offset + limit < totalCount;

      console.log(
        `✅ Fetched ${paginatedEntries.length} leaderboard entries (total: ${totalCount}, hasMore: ${hasMore})`
      );

      return {
        entries: paginatedEntries,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      throw error;
    }
  }

  // ============================================
  // OCID Deduplication Methods (015-fix-duplicate-ocid)
  // ============================================

  /**
   * Find and optionally remove duplicate OCIDs from OCID sheet (Sheet1)
   * Keeps the first occurrence of each OCID
   * @param {boolean} dryRun - If true, only report duplicates without removing
   * @returns {Promise<{totalRecords: number, duplicatesFound: number, removed: number, duplicateDetails?: Array}>}
   */
  async deduplicateOcidSheet(dryRun = false) {
    try {
      console.log(
        `🔍 Scanning OCID sheet for duplicates (dryRun=${dryRun})...`
      );

      // Read all OCIDs from Sheet1 column A
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:A',
      });

      const values = response.data.values || [];

      // Handle empty sheet
      if (values.length === 0) {
        console.log('⚠️ OCID sheet is empty');
        return { totalRecords: 0, duplicatesFound: 0, removed: 0 };
      }

      const ocidMap = new Map(); // ocid -> [rowIndices (0-based)]

      // Skip header if exists (check if first cell is 'ocid' case-insensitive)
      const startRow = values[0]?.[0]?.toLowerCase() === 'ocid' ? 1 : 0;

      for (let i = startRow; i < values.length; i++) {
        const ocid = values[i]?.[0];
        // Skip empty or invalid OCID values
        if (ocid && typeof ocid === 'string' && ocid.trim() !== '') {
          const trimmedOcid = ocid.trim();
          if (!ocidMap.has(trimmedOcid)) {
            ocidMap.set(trimmedOcid, []);
          }
          ocidMap.get(trimmedOcid).push(i); // 0-based row index
        }
      }

      // Find duplicates
      const duplicateDetails = [];
      const rowsToDelete = [];

      for (const [ocid, rowIndices] of ocidMap) {
        if (rowIndices.length > 1) {
          duplicateDetails.push({ ocid, count: rowIndices.length });
          // Keep first occurrence (smallest index), delete rest
          for (let i = 1; i < rowIndices.length; i++) {
            rowsToDelete.push(rowIndices[i]);
          }
        }
      }

      const result = {
        totalRecords: values.length - startRow,
        duplicatesFound: duplicateDetails.length,
        removed: 0,
        duplicateDetails: dryRun ? duplicateDetails : undefined,
      };

      if (!dryRun && rowsToDelete.length > 0) {
        // Get sheet ID for Sheet1
        const spreadsheet = await this.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
        });
        const sheetId = spreadsheet.data.sheets[0].properties.sheetId;

        // Sort descending to avoid index shift issues when deleting
        rowsToDelete.sort((a, b) => b - a);

        // Delete rows in batch
        const requests = rowsToDelete.map(rowIndex => ({
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }));

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: { requests },
        });

        result.removed = rowsToDelete.length;
        console.log(`✅ Removed ${result.removed} duplicate OCID rows`);
      } else if (rowsToDelete.length === 0) {
        console.log('✅ No duplicate OCIDs found in OCID sheet');
      }

      return result;
    } catch (error) {
      console.error('Error deduplicating OCID sheet:', error);
      throw error;
    }
  }

  /**
   * Find and optionally remove duplicate OCIDs from CombatPower sheet
   * Keeps the record with the latest updated_at timestamp
   * @param {boolean} dryRun - If true, only report duplicates without removing
   * @returns {Promise<{totalRecords: number, duplicatesFound: number, removed: number, duplicateDetails?: Array}>}
   */
  async deduplicateCombatPowerSheet(dryRun = false) {
    const sheetName = 'CombatPower';

    try {
      console.log(
        `🔍 Scanning ${sheetName} sheet for duplicates (dryRun=${dryRun})...`
      );

      // Get sheet metadata
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheet = spreadsheet.data.sheets?.find(
        s => s.properties?.title === sheetName
      );

      // Handle non-existent sheet gracefully
      if (!sheet) {
        console.log(`⚠️ ${sheetName} sheet not found, skipping...`);
        return { totalRecords: 0, duplicatesFound: 0, removed: 0 };
      }

      const sheetId = sheet.properties.sheetId;

      // Read all records
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:E`,
      });

      const values = response.data.values || [];

      // Handle empty sheet (only header or completely empty)
      if (values.length <= 1) {
        console.log(`⚠️ ${sheetName} sheet is empty or has only header`);
        return { totalRecords: 0, duplicatesFound: 0, removed: 0 };
      }

      const ocidMap = new Map(); // ocid -> [{rowIndex, updated_at, combat_power}]

      // Skip header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const [ocid, combat_power, updated_at, status] = values[i] || [];
        // Skip empty or invalid OCID values
        if (ocid && typeof ocid === 'string' && ocid.trim() !== '') {
          const trimmedOcid = ocid.trim();
          if (!ocidMap.has(trimmedOcid)) {
            ocidMap.set(trimmedOcid, []);
          }
          ocidMap.get(trimmedOcid).push({
            rowIndex: i, // 0-based row index (header is row 0)
            updated_at: updated_at || '',
            combat_power: combat_power || '',
            status: status || '',
          });
        }
      }

      // Find duplicates and determine which to keep
      const duplicateDetails = [];
      const rowsToDelete = [];

      for (const [ocid, records] of ocidMap) {
        if (records.length > 1) {
          // Sort by updated_at descending (keep newest)
          records.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
          const kept = records[0];

          duplicateDetails.push({
            ocid,
            count: records.length,
            kept: {
              updated_at: kept.updated_at,
              combat_power: kept.combat_power,
            },
          });

          // Mark all except the first (newest) for deletion
          for (let i = 1; i < records.length; i++) {
            rowsToDelete.push(records[i].rowIndex);
          }
        }
      }

      const result = {
        totalRecords: values.length - 1, // Exclude header
        duplicatesFound: duplicateDetails.length,
        removed: 0,
        duplicateDetails: dryRun ? duplicateDetails : undefined,
      };

      if (!dryRun && rowsToDelete.length > 0) {
        // Sort descending to avoid index shift issues when deleting
        rowsToDelete.sort((a, b) => b - a);

        const requests = rowsToDelete.map(rowIndex => ({
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }));

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: { requests },
        });

        result.removed = rowsToDelete.length;
        console.log(`✅ Removed ${result.removed} duplicate ${sheetName} rows`);
      } else if (rowsToDelete.length === 0) {
        console.log(`✅ No duplicate OCIDs found in ${sheetName} sheet`);
      }

      return result;
    } catch (error) {
      console.error(`Error deduplicating ${sheetName} sheet:`, error);
      throw error;
    }
  }

  /**
   * Find and optionally remove duplicate OCIDs from CharacterInfo sheet
   * Keeps the record with the latest cached_at timestamp
   * @param {boolean} dryRun - If true, only report duplicates without removing
   * @returns {Promise<{totalRecords: number, duplicatesFound: number, removed: number, duplicateDetails?: Array}>}
   */
  async deduplicateCharacterInfoSheet(dryRun = false) {
    const sheetName = 'CharacterInfo';

    try {
      console.log(
        `🔍 Scanning ${sheetName} sheet for duplicates (dryRun=${dryRun})...`
      );

      // Get sheet metadata
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheet = spreadsheet.data.sheets?.find(
        (s) => s.properties?.title === sheetName
      );

      if (!sheet) {
        console.log(`⚠️ ${sheetName} sheet not found, skipping...`);
        return { totalRecords: 0, duplicatesFound: 0, removed: 0 };
      }

      const sheetId = sheet.properties.sheetId;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:G`,
      });

      const values = response.data.values || [];

      if (values.length <= 1) {
        console.log(`⚠️ ${sheetName} sheet is empty or has only header`);
        return { totalRecords: 0, duplicatesFound: 0, removed: 0 };
      }

      // ocid -> [{rowIndex, cached_at, character_name}]
      const ocidMap = new Map();

      for (let i = 1; i < values.length; i++) {
        const [ocid, character_name, , , , , cached_at] = values[i] || [];
        if (ocid && typeof ocid === 'string' && ocid.trim() !== '') {
          const trimmedOcid = ocid.trim();
          if (!ocidMap.has(trimmedOcid)) {
            ocidMap.set(trimmedOcid, []);
          }
          ocidMap.get(trimmedOcid).push({
            rowIndex: i,
            cached_at: cached_at || '',
            character_name: character_name || '',
          });
        }
      }

      const duplicateDetails = [];
      const rowsToDelete = [];

      for (const [ocid, records] of ocidMap) {
        if (records.length > 1) {
          // Sort by cached_at descending (keep newest)
          records.sort((a, b) => b.cached_at.localeCompare(a.cached_at));
          const kept = records[0];

          duplicateDetails.push({
            ocid,
            count: records.length,
            kept: {
              cached_at: kept.cached_at,
              character_name: kept.character_name,
            },
          });

          for (let i = 1; i < records.length; i++) {
            rowsToDelete.push(records[i].rowIndex);
          }
        }
      }

      const result = {
        totalRecords: values.length - 1,
        duplicatesFound: duplicateDetails.length,
        removed: 0,
        duplicateDetails: dryRun ? duplicateDetails : undefined,
      };

      if (!dryRun && rowsToDelete.length > 0) {
        rowsToDelete.sort((a, b) => b - a);

        const requests = rowsToDelete.map((rowIndex) => ({
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }));

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: { requests },
        });

        result.removed = rowsToDelete.length;
        console.log(
          `✅ Removed ${result.removed} duplicate ${sheetName} rows`
        );
      } else if (rowsToDelete.length === 0) {
        console.log(`✅ No duplicate OCIDs found in ${sheetName} sheet`);
      }

      return result;
    } catch (error) {
      console.error(`Error deduplicating ${sheetName} sheet:`, error);
      throw error;
    }
  }

  /**
   * Remove OCIDs from Sheet1, CombatPower, and CharacterInfo sheets
   * @param {string[]} ocids - Array of OCIDs to remove
   * @returns {Promise<{sheet1: number, combatPower: number, characterInfo: number}>}
   */
  async removeOcids(ocids) {
    if (!ocids || ocids.length === 0) {
      return { sheet1: 0, combatPower: 0, characterInfo: 0 };
    }

    const ocidSet = new Set(ocids);
    const result = { sheet1: 0, combatPower: 0, characterInfo: 0 };

    try {
      console.log(
        `🗑️ Removing ${ocids.length} OCIDs from all sheets...`
      );

      // Get spreadsheet metadata for sheet IDs
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheetConfigs = [
        { name: 'Sheet1', range: 'A:A', key: 'sheet1' },
        { name: 'CombatPower', range: 'CombatPower!A:A', key: 'combatPower' },
        {
          name: 'CharacterInfo',
          range: 'CharacterInfo!A:A',
          key: 'characterInfo',
        },
      ];

      for (const config of sheetConfigs) {
        const sheet = spreadsheet.data.sheets?.find(
          s =>
            s.properties?.title === config.name ||
            (config.name === 'Sheet1' && s.properties?.sheetId === 0)
        );

        if (!sheet) continue;

        const sheetId = sheet.properties.sheetId;

        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: config.range,
          });

          const values = response.data.values || [];
          const rowsToDelete = [];

          for (let i = 0; i < values.length; i++) {
            if (values[i]?.[0] && ocidSet.has(values[i][0])) {
              rowsToDelete.push(i);
            }
          }

          if (rowsToDelete.length > 0) {
            // Sort descending to avoid index shift
            rowsToDelete.sort((a, b) => b - a);

            const requests = rowsToDelete.map(rowIndex => ({
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            }));

            await this.sheets.spreadsheets.batchUpdate({
              spreadsheetId: this.spreadsheetId,
              resource: { requests },
            });

            result[config.key] = rowsToDelete.length;
          }
        } catch (_error) {
          console.warn(
            `⚠️ Could not process ${config.name} sheet for removal`
          );
        }
      }

      console.log(
        `✅ Removed OCIDs - Sheet1: ${result.sheet1}, CombatPower: ${result.combatPower}, CharacterInfo: ${result.characterInfo}`
      );

      // Invalidate OCID cache for removed entries
      for (const ocid of ocids) {
        this.ocidCache.delete(ocid);
      }

      return result;
    } catch (error) {
      console.error('Error removing OCIDs:', error);
      throw error;
    }
  }

  /**
   * Get available filter options from CharacterInfo sheet
   * @returns {Promise<{worlds: string[], classes: string[]}>}
   */
  async getFilterOptions() {
    const sheetName = 'CharacterInfo';

    try {
      await this.getOrCreateCharacterInfoSheet();

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:G`,
      });

      const values = response.data.values || [];
      const worldsSet = new Set();
      const classesSet = new Set();

      for (let i = 1; i < values.length; i++) {
        const worldName = values[i]?.[4];
        const characterClass = values[i]?.[5];
        if (worldName && worldName.trim())
          worldsSet.add(worldName.trim());
        if (characterClass && characterClass.trim())
          classesSet.add(characterClass.trim());
      }

      return {
        worlds: [...worldsSet].sort(),
        classes: [...classesSet].sort(),
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return { worlds: [], classes: [] };
    }
  }
}

export default GoogleSheetsClient;
