#!/usr/bin/env node

/**
 * One-time setup script for OCID logging Google Sheet
 * Configures an existing Google Sheet for storing character OCIDs
 *
 * Usage: node setup-ocid-sheet.js
 *
 * Prerequisites:
 * - GOOGLE_SHEETS_PRIVATE_KEY environment variable set
 * - Other Google Sheets credentials environment variables set
 * - googleapis package installed
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';

async function setupOcidSheet() {
  console.log('🚀 Setting up OCID logging Google Sheet...\n');

  // Load environment variables
  dotenv.config({ path: '.env.local' });

  // Check environment variables
  const requiredEnvVars = [
    'GOOGLE_SHEETS_PRIVATE_KEY',
    'GOOGLE_SHEETS_CLIENT_EMAIL',
    'GOOGLE_SHEETS_PROJECT_ID',
    'GOOGLE_SHEETS_PRIVATE_KEY_ID',
    'GOOGLE_SHEETS_CLIENT_ID',
    'GOOGLE_SHEETS_CLIENT_X509_CERT_URL',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log(
      '\nPlease ensure .env.local file contains all Google Sheets credentials'
    );
    process.exit(1);
  }

  console.log('✅ Found all required Google Sheets credentials');

  // Use existing spreadsheet ID
  const spreadsheetId = '1-PqSoUKM0zlv_0GwMUzhi3rPSes2SmiwHse88rNoVio';
  console.log(`📋 Using existing spreadsheet: ${spreadsheetId}`);

  // Initialize auth
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_SHEETS_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_SHEETS_CLIENT_X509_CERT_URL,
      universe_domain: 'googleapis.com',
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  console.log('✅ Auth initialized');

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('✅ Sheets API initialized');

  try {
    // Step 1: Verify spreadsheet access and get sheet info
    console.log('🔍 Verifying spreadsheet access...');
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    console.log(
      `✅ Successfully accessed spreadsheet: "${spreadsheetInfo.data.properties.title}"`
    );

    // Get the first sheet name and ID
    const firstSheet = spreadsheetInfo.data.sheets[0];
    const originalSheetName = firstSheet.properties.title;
    const originalSheetId = firstSheet.properties.sheetId;
    console.log(
      `📄 First sheet name: "${originalSheetName}" (ID: ${originalSheetId})`
    );

    // Step 2: Clear existing data and set up structure
    console.log('🧹 Clearing existing data and setting up structure...');

    // Clear the entire sheet first using the actual sheet name
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${originalSheetName}!A:Z`, // Clear all columns
    });
    console.log('✅ Existing data cleared');

    // Rename the sheet to "OCIDs"
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: originalSheetId,
                title: 'OCIDs',
              },
              fields: 'title',
            },
          },
        ],
      },
    });
    console.log('✅ Sheet renamed to "OCIDs"');

    // Step 3: Set up headers and formatting
    console.log('🎨 Setting up headers and formatting...');

    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'OCIDs!A1:B1',
      valueInputOption: 'RAW',
      resource: {
        values: [['OCID', 'Added Date']],
      },
    });

    console.log('✅ Headers added');

    // Format headers (bold, background color) - use the original sheet ID
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: originalSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 2,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Auto-resize columns
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: originalSheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 2,
              },
            },
          },
        ],
      },
    });

    console.log('✅ Formatting applied\n');

    // Step 4: Add sample data
    console.log('📝 Adding sample data...');
    const sampleOcids = [
      ['12345678901234567890', new Date().toISOString()],
      ['09876543210987654321', new Date().toISOString()],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'OCIDs!A2:B',
      valueInputOption: 'RAW',
      resource: { values: sampleOcids },
    });

    console.log('✅ Sample data added\n');

    // Step 5: Set data validation for OCID column
    console.log('🔒 Setting up data validation...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            setDataValidation: {
              range: {
                sheetId: originalSheetId,
                startRowIndex: 1, // Skip header
                endRowIndex: 1000,
                startColumnIndex: 0,
                endColumnIndex: 1,
              },
              rule: {
                condition: {
                  type: 'CUSTOM_FORMULA',
                  values: [{ userEnteredValue: '=LEN(A:A)=20' }],
                },
                inputMessage: 'OCID must be exactly 20 characters',
                strict: true,
                showCustomUi: true,
              },
            },
          },
        ],
      },
    });

    console.log('✅ Data validation set up\n');

    // Step 6: Create summary sheet (if it doesn't exist)
    console.log('📊 Creating summary sheet...');

    const existingSheets = spreadsheetInfo.data.sheets;
    const summarySheetExists = existingSheets.some(
      sheet => sheet.properties.title === 'Summary'
    );

    if (!summarySheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Summary',
                  sheetId: 1,
                  gridProperties: {
                    rowCount: 10,
                    columnCount: 2,
                  },
                },
              },
            },
          ],
        },
      });
      console.log('✅ Summary sheet created');
    } else {
      console.log('✅ Summary sheet already exists, skipping creation');
    }

    // Add/update summary formulas
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Summary!A1:B5',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          ['Total OCIDs', '=COUNTA(OCIDs!A2:A)'],
          ['Last Updated', '=MAX(OCIDs!B2:B)'],
          ['Unique OCIDs', '=COUNTA(UNIQUE(OCIDs!A2:A))'],
          [
            'Duplicates Found',
            '=COUNTA(OCIDs!A2:A)-COUNTA(UNIQUE(OCIDs!A2:A))',
          ],
        ],
      },
    });

    console.log('✅ Summary formulas updated\n');

    console.log('\n🎉 Setup complete!');
    console.log('='.repeat(50));
    console.log('📋 SPREADSHEET_ID:', spreadsheetId);
    console.log(
      '🔗 Sheet URL: https://docs.google.com/spreadsheets/d/' +
        spreadsheetId +
        '/edit'
    );
    console.log('='.repeat(50));
    console.log('\n📝 Next steps:');
    console.log(
      '1. The SPREADSHEET_ID is already configured in your .env.local'
    );
    console.log('2. Remove the sample data from row 2-3 if desired');
    console.log('3. Share the sheet with your service account if needed');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Check Google Sheets environment variables');
    console.error(
      '2. Verify credentials have spreadsheets and drive permissions'
    );
    console.error('3. Ensure googleapis package is installed');
    console.error(
      '4. Make sure the spreadsheet is shared with the service account'
    );
    process.exit(1);
  }
}

// Run the setup
if (import.meta.url.endsWith('setup-ocid-sheet.js')) {
  setupOcidSheet().catch(console.error);
}

export { setupOcidSheet };
