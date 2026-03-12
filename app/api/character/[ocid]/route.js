import { NextResponse } from 'next/server';
import { getFullCharacterData } from '../../../../lib/db/queries.js';
import { syncCharacter } from '../../../../lib/characterSyncService.js';

const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const OCID_PATTERN = /^[a-f0-9]{32,64}$/i;

export async function GET(request, { params }) {
  const { ocid } = await params;

  if (!OCID_PATTERN.test(ocid)) {
    return NextResponse.json(
      { error: 'Invalid OCID format' },
      { status: 400 }
    );
  }

  try {
    // Check DB for existing data
    let data = await getFullCharacterData(ocid);

    const isStale =
      !data ||
      !data.syncedAt ||
      Date.now() - new Date(data.syncedAt).getTime() > STALE_THRESHOLD_MS;

    if (isStale) {
      // Sync from Nexon API then re-read
      const result = await syncCharacter(ocid);
      if (!result.success && result.status === 'not_found') {
        return NextResponse.json(
          { error: 'Character not found' },
          { status: 404 }
        );
      }
      data = await getFullCharacterData(ocid);
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching character ${ocid}:`, error.message);
    return NextResponse.json(
      { error: 'Failed to fetch character data' },
      { status: 500 }
    );
  }
}
