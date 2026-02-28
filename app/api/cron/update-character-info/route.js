import { NextResponse } from 'next/server';
import { updateAllCharacterInfoCache } from '../../../../lib/characterInfoService';

/**
 * @deprecated Use /api/cron/refresh-all instead.
 *
 * CRON API endpoint for updating character info cache
 * Triggered by external CRON service (e.g., cron-job.org) every 6 hours
 *
 * Security: Requires Authorization header with Bearer token matching CRON_SECRET
 *
 * POST /api/cron/update-character-info
 */
export async function POST(request) {
  const startTime = Date.now();

  try {
    // Validate CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      console.error('❌ CRON_SECRET environment variable not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ CRON request missing Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - Missing Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (token !== expectedToken) {
      console.warn('⚠️ CRON request with invalid token');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    console.log('🔄 CRON: Starting character info cache update...');

    // Execute the cache update
    const result = await updateAllCharacterInfoCache();

    const response = {
      success: result.success,
      updated: result.updated,
      failed: result.failed,
      duration: result.duration,
    };

    if (result.success) {
      console.log(
        `✅ CRON: Completed successfully - ${result.updated} updated, ${result.failed} failed`
      );
      return NextResponse.json(response, { status: 200 });
    } else {
      console.error('❌ CRON: Update completed with errors');
      return NextResponse.json(response, { status: 200 }); // Still return 200 as partial success
    }
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.error('❌ CRON: Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update character info cache',
        success: false,
        updated: 0,
        failed: 0,
        duration,
      },
      { status: 500 }
    );
  }
}

// Reject other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
