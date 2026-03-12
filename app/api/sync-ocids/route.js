import { NextResponse } from 'next/server';
import { flushOcidBuffer } from '../../../lib/redis.js';
import { upsertCharacters } from '../../../lib/db/queries.js';

export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ocids = await flushOcidBuffer();

    if (ocids.length === 0) {
      return NextResponse.json({ message: 'No new OCIDs to sync', count: 0 });
    }

    await upsertCharacters(
      ocids.map(ocid => ({
        ocid,
        status: 'success',
        notFoundCount: 0,
      }))
    );

    return NextResponse.json({
      message: `Synced ${ocids.length} OCIDs`,
      count: ocids.length,
    });
  } catch (error) {
    console.error('Sync OCIDs error:', error);
    return NextResponse.json(
      { error: 'Failed to sync OCIDs' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return GET(request);
}
