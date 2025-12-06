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
        range: `${sheetName}!A1:D1`,
        valueInputOption: 'RAW',
        resource: {
          values: [['ocid', 'combat_power', 'updated_at', 'status']],
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
   * @returns {Promise<Map<string, {combat_power: string, updated_at: string, status: string}>>}
   */
  async getExistingCombatPowerRecords() {
    const sheetName = 'CombatPower';
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:D`,
      });

      const values = response.data.values || [];
      const recordsMap = new Map();

      // Skip header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const [ocid, combat_power, updated_at, status] = values[i];
        if (ocid && ocid.trim() !== '') {
          recordsMap.set(ocid, { combat_power, updated_at, status });
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
   * @param {Array<{ocid: string, combat_power: string, updated_at: string, status: string}>} records
   * @returns {Promise<{updated: number, inserted: number}>}
   */
  async upsertCombatPowerRecords(records) {
    if (records.length === 0) {
      console.log('⚠️ No records to upsert');
      return { updated: 0, inserted: 0 };
    }

    const sheetName = 'CombatPower';

    try {
      console.log(`📤 Upserting ${records.length} combat power records...`);

      // Get existing data
      let existingData = [];
      try {
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:D`,
        });
        existingData = response.data.values || [];
      } catch (_error) {
        // Sheet might not exist yet, getCombatPowerSheet will create it
        await this.getCombatPowerSheet();
        existingData = [['ocid', 'combat_power', 'updated_at', 'status']];
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

        if (rowIndex) {
          // Update existing row
          updateRequests.push({
            range: `${sheetName}!A${rowIndex}:D${rowIndex}`,
            values: [
              [
                record.ocid,
                record.combat_power,
                record.updated_at,
                record.status,
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
          range: `${sheetName}!A:D`,
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
}

export default GoogleSheetsClient;
