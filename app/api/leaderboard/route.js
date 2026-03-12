import { NextResponse } from 'next/server';
import { getLeaderboard } from '../../../lib/db/queries.js';
import { getCached, setCache } from '../../../lib/redis.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    let offset = parseInt(searchParams.get('offset') || '0', 10);
    let limit = parseInt(searchParams.get('limit') || '20', 10);

    if (isNaN(offset) || offset < 0) offset = 0;
    if (isNaN(limit) || limit < 1) limit = 20;
    else if (limit > 100) limit = 100;

    const search = searchParams.get('search') || null;
    const worldName = searchParams.get('worldName') || null;
    const characterClass = searchParams.get('characterClass') || null;
    const hasFilters = !!(search || worldName || characterClass);

    // Try Redis cache for non-filtered first page
    if (!hasFilters && offset === 0 && limit === 20) {
      const cached = await getCached('leaderboard:latest');
      if (cached) return NextResponse.json(cached);
    }

    const result = await getLeaderboard({
      offset,
      limit,
      search,
      worldName,
      characterClass,
    });

    const response = {
      entries: result.entries,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
      offset,
      limit,
    };

    // Cache default first page
    if (!hasFilters && offset === 0 && limit === 20) {
      setCache('leaderboard:latest', response, 600).catch(() => {});
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
