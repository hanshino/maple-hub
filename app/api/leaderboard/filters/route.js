import { NextResponse } from 'next/server';
import GoogleSheetsClient from '../../../../lib/googleSheets';

/**
 * GET /api/leaderboard/filters
 * Returns available filter options (worlds and classes) for the leaderboard
 */
export async function GET() {
  try {
    const sheetsClient = new GoogleSheetsClient();
    const filters = await sheetsClient.getFilterOptions();

    return NextResponse.json(filters);
  } catch (error) {
    console.error('❌ Leaderboard filters API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
