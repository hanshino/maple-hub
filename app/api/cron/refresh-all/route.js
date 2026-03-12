import { NextResponse } from 'next/server';
import { getAllOcids, deleteStaleCharacters } from '../../../../lib/db/queries.js';
import { syncAllCharacters } from '../../../../lib/characterSyncService.js';

const validateAuth = request => {
  const authHeader = request.headers.get('Authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
};

export async function GET(request) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const ocids = await getAllOcids();

    if (ocids.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No characters to refresh',
        processed: 0,
      });
    }

    const stats = await syncAllCharacters(ocids);

    // Cleanup stale characters
    const deleted = await deleteStaleCharacters(3);

    return NextResponse.json({
      success: true,
      processed: ocids.length,
      stats,
      deletedStale: deleted,
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Refresh-all error:', error);
    return NextResponse.json(
      { error: 'Refresh failed', message: error.message },
      { status: 500 }
    );
  }
}
