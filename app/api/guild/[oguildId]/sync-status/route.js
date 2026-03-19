import { NextResponse } from 'next/server';
import { getSyncStatus, DEFAULT_SYNC_STATUS } from '@/lib/guildSyncService.js';

export async function GET(request, { params }) {
  const { oguildId } = await params;

  try {
    const status = await getSyncStatus(oguildId);
    return NextResponse.json(status || DEFAULT_SYNC_STATUS);
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: '取得同步狀態時發生錯誤' },
      { status: 500 }
    );
  }
}
