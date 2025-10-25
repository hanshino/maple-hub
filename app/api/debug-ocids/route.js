import { NextResponse } from 'next/server';
import { ocidLogger } from '../../../lib/sharedLogger.js';

export async function GET() {
  return NextResponse.json({
    collectedOcids: ocidLogger.getAllOcids(),
    count: ocidLogger.getAllOcids().length,
  });
}
