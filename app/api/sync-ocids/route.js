import { NextResponse } from 'next/server';
import GoogleSheetsClient from '../../../lib/googleSheets';
import { ocidLogger } from '../../../lib/sharedLogger.js';

export async function GET(request) {
  try {
    // 檢查是否為授權的 cron job 請求 - 根據 Vercel 官方文檔
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = new GoogleSheetsClient();
    const ocids = ocidLogger.getAllOcids();

    if (ocids.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No OCIDs to sync',
        syncedCount: 0,
      });
    }

    await client.appendOcids(ocids);
    ocidLogger.clear();

    console.log(`✅ Cron job synced ${ocids.length} OCIDs to Google Sheets`);

    return NextResponse.json({
      success: true,
      syncedCount: ocids.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 保持 POST 方法以向後相容
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
