import { getCharacterHexaMatrix } from '../../../lib/nexonApi';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ocid = searchParams.get('ocid');

  if (!ocid) {
    return Response.json(
      { error: 'Character OCID is required' },
      { status: 400 }
    );
  }

  try {
    const data = await getCharacterHexaMatrix(ocid);
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching Hexa Matrix data:', error.message);
    return Response.json(
      { error: 'Failed to fetch Hexa Matrix data' },
      { status: 500 }
    );
  }
}
