import { NextResponse } from 'next/server';
import { getUnionRaider } from '../../../../lib/nexonApi';
import { handleApiError } from '../../../../lib/apiErrorHandler';

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

    const data = await getUnionRaider(ocid);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status || 500 }
    );
  }
}
