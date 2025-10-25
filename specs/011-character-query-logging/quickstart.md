# Quick Start: Character Query Logging

## Overview

Implement OCID logging middleware for Next.js application to capture character queries and sync to Google Sheets.

## Prerequisites

- Next.js 14 application
- Google Cloud Project with Sheets API enabled
- Service account key for Google Sheets API
- Environment variables configured

## Implementation Steps

### 1. Install Dependencies

```bash
npm install googleapis
```

### 2. Create Google Sheets Integration (`lib/google-sheets.js`)

```javascript
const { google } = require('googleapis');

class GoogleSheetsClient {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.SPREADSHEET_ID;
  }

  async ocidExists(ocid) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:A', // Check column A for OCIDs
      });
      const values = response.data.values || [];
      return values.some(row => row[0] === ocid);
    } catch (error) {
      console.error('Error checking OCID existence:', error);
      return false; // Assume not exists on error
    }
  }

  async appendOcids(ocids) {
    if (ocids.length === 0) return;

    const values = ocids.map(ocid => [ocid]);

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'A:A',
      valueInputOption: 'RAW',
      resource: { values },
    });
  }
}

module.exports = GoogleSheetsClient;
```

### 3. Create OCID Logger (`lib/ocid-logger.js`)

```javascript
class OcidLogger {
  constructor() {
    this.ocids = new Set(); // Simple set of OCIDs to sync
  }

  async logOcid(ocid, googleSheetsClient) {
    // Check if OCID already exists in Google Sheets
    const exists = await googleSheetsClient.ocidExists(ocid);
    if (!exists && !this.ocids.has(ocid)) {
      this.ocids.add(ocid);
    }
  }

  getAllOcids() {
    return Array.from(this.ocids);
  }

  clear() {
    this.ocids.clear();
  }
}

module.exports = OcidLogger;
```

### 4. Create Middleware (`app/middleware.js`)

```javascript
import { NextResponse } from 'next/server';
import OcidLogger from '../lib/ocid-logger';
import GoogleSheetsClient from '../lib/google-sheets';

const ocidLogger = new OcidLogger();
const googleSheetsClient = new GoogleSheetsClient();

export async function middleware(request) {
  const url = new URL(request.url);
  const ocid =
    url.searchParams.get('ocid') || request.nextUrl.searchParams.get('ocid');

  if (ocid && isValidOcid(ocid)) {
    await ocidLogger.logOcid(ocid, googleSheetsClient);
  }

  return NextResponse.next();
}

function isValidOcid(ocid) {
  return typeof ocid === 'string' && ocid.length >= 10 && ocid.length <= 20;
}

export { ocidLogger };
```

### 5. Create Sync API (`app/api/sync-ocids/route.js`)

```javascript
import { NextResponse } from 'next/server';
import GoogleSheetsClient from '../../../lib/google-sheets';
import { ocidLogger } from '../../middleware';

export async function POST() {
  try {
    const client = new GoogleSheetsClient();
    const ocids = ocidLogger.getAllOcids();

    await client.appendOcids(ocids);
    ocidLogger.clear();

    return NextResponse.json({
      success: true,
      syncedCount: ocids.length,
      errors: [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        syncedCount: 0,
      },
      { status: 500 }
    );
  }
}
```

### 6. Environment Variables

Add to `.env.local`:

```
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
SPREADSHEET_ID=your_spreadsheet_id
```

### 7. Testing

```bash
npm test -- __tests__/middleware.test.js
npm test -- __tests__/ocidLogger.test.js
npm test -- __tests__/googleSheets.test.js
```

## Usage

1. Make API calls with `?ocid=1234567890` parameter
2. OCIDs are automatically logged in memory
3. Call `POST /api/sync-ocids` to sync to Google Sheets
4. View data in your Google Sheet for leaderboard preparation

## Troubleshooting

- Check Google Sheets API permissions
- Verify spreadsheet sharing with service account
- Monitor server logs for middleware errors
- Test with small batches first
