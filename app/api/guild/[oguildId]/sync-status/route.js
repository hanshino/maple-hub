import { NextResponse } from 'next/server';
import { getSyncStatus } from '../../../../../lib/guildSyncService.js';

export async function GET(request, { params }) {
  const { oguildId } = await params;

  try {
    const status = await getSyncStatus(oguildId);
    return NextResponse.json(
      status || { total: 0, synced: 0, failed: 0, inProgress: false }
    );
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: '取得同步狀態時發生錯誤' },
      { status: 500 }
    );
  }
}
