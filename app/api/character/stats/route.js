import { NextResponse } from 'next/server';
import { getCharacterStats } from '../../../../lib/nexonApi';
import { getCachedData, setCachedData } from '../../../../lib/cache';
import { handleApiError } from '../../../../lib/apiErrorHandler';
import { ocidLogger } from '../../../../lib/sharedLogger.js';
import GoogleSheetsClient from '../../../../lib/googleSheets.js';

async function recordOcidAsync(ocid) {
  try {
    console.log('🔄 開始記錄 OCID:', ocid);
    const googleSheetsClient = new GoogleSheetsClient();
    await ocidLogger.logOcid(ocid, googleSheetsClient);
    console.log('✅ OCID 記錄成功:', ocid);
  } catch (error) {
    // 記錄錯誤但不影響 API 響應
    console.error('❌ OCID 記錄失敗:', error);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ocid = searchParams.get('ocid');

    if (!ocid) {
      return NextResponse.json(
        { error: 'OCID parameter is required' },
        { status: 400 }
      );
    }

    // 異步記錄 OCID（不會阻塞響應）
    recordOcidAsync(ocid);

    const cacheKey = `stats_${ocid}`;
    let data = getCachedData(cacheKey);

    if (!data) {
      data = await getCharacterStats(ocid);
      setCachedData(cacheKey, data);
    }

    return NextResponse.json(data);
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status || 500 }
    );
  }
}
