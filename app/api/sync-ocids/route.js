import { NextResponse } from 'next/server';
import GoogleSheetsClient from '../../../lib/googleSheets';
import { ocidLogger } from '../../../lib/sharedLogger.js';

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
