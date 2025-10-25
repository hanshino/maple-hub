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
}

export default GoogleSheetsClient;
