/**
 * Migration script: Google Sheets → MySQL SQL file
 *
 * Usage: node scripts/migrate-from-sheets.js > migration.sql
 *
 * Requires Google Sheets env vars in .env.local
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_SHEETS_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      client_x509_cert_url: process.env.GOOGLE_SHEETS_CLIENT_X509_CERT_URL,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return auth;
}

function escapeSQL(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

async function main() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // Read OCID sheet (Sheet1)
  const ocidRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A:A',
  });
  const ocids = (ocidRes.data.values || [])
    .flat()
    .filter(v => v && v !== 'ocid');

  // Read CharacterInfo sheet
  const charRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CharacterInfo!A:G',
  });
  const charRows = (charRes.data.values || []).slice(1);
  const charMap = new Map();
  for (const row of charRows) {
    charMap.set(row[0], {
      character_name: row[1] || null,
      character_level: parseInt(row[2]) || null,
      character_image: row[3] || null,
      world_name: row[4] || null,
      character_class: row[5] || null,
      cached_at: row[6] || null,
    });
  }

  // Read CombatPower sheet
  const cpRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CombatPower!A:E',
  });
  const cpRows = (cpRes.data.values || []).slice(1);
  const cpMap = new Map();
  for (const row of cpRows) {
    cpMap.set(row[0], {
      combat_power: parseInt(row[1]) || null,
      updated_at: row[2] || null,
      status: row[3] || 'success',
      not_found_count: parseInt(row[4]) || 0,
    });
  }

  // Output SQL
  console.log('-- Maple Hub Migration from Google Sheets');
  console.log(`-- Generated: ${new Date().toISOString()}`);
  console.log(`-- Total OCIDs: ${ocids.length}`);
  console.log('');

  const uniqueOcids = [...new Set(ocids)];

  console.log('START TRANSACTION;');
  console.log('');

  for (const ocid of uniqueOcids) {
    const char = charMap.get(ocid) || {};
    const cp = cpMap.get(ocid) || {};

    console.log(
      `INSERT INTO characters (ocid, character_name, character_level, character_class, world_name, character_image, combat_power, status, not_found_count, created_at, updated_at) VALUES (` +
        `${escapeSQL(ocid)}, ` +
        `${escapeSQL(char.character_name)}, ` +
        `${char.character_level || 'NULL'}, ` +
        `${escapeSQL(char.character_class)}, ` +
        `${escapeSQL(char.world_name)}, ` +
        `${escapeSQL(char.character_image)}, ` +
        `${cp.combat_power || 'NULL'}, ` +
        `${escapeSQL(cp.status || 'success')}, ` +
        `${cp.not_found_count || 0}, ` +
        `NOW(), NOW()` +
        `) ON DUPLICATE KEY UPDATE ` +
        `character_name = VALUES(character_name), ` +
        `character_level = VALUES(character_level), ` +
        `combat_power = VALUES(combat_power);`
    );
  }

  console.log('');
  console.log('COMMIT;');
  console.log(`-- Migration complete: ${uniqueOcids.length} characters`);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
