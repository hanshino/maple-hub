import { NextResponse } from 'next/server';
import { getGuildWithMembers } from '@/lib/db/guildQueries.js';
import { getSyncStatus, DEFAULT_SYNC_STATUS } from '@/lib/guildSyncService.js';

export async function GET(request, { params }) {
  const { oguildId } = await params;

  try {
    const guild = await getGuildWithMembers(oguildId);
    if (!guild) {
      return NextResponse.json({ error: '工會不存在' }, { status: 404 });
    }

    const syncStatus = await getSyncStatus(oguildId);

    return NextResponse.json({
      ...guild,
      syncStatus: syncStatus || DEFAULT_SYNC_STATUS,
    });
  } catch (error) {
    console.error('Guild detail error:', error);
    return NextResponse.json(
      { error: '取得工會資料時發生錯誤' },
      { status: 500 }
    );
  }
}
