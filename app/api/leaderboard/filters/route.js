import { NextResponse } from 'next/server';
import { getFilterOptions } from '../../../../lib/db/queries.js';
import { getCached, setCache } from '../../../../lib/redis.js';

export async function GET() {
  try {
    const cached = await getCached('leaderboard:filters');
    if (cached) return NextResponse.json(cached);

    const filters = await getFilterOptions();

    setCache('leaderboard:filters', filters, 1800).catch(() => {});

    return NextResponse.json(filters);
  } catch (error) {
    console.error('Leaderboard filters API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
