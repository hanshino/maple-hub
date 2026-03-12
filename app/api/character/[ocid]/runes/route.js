import { getCharacterSymbolEquipment } from '../../../../../lib/nexonApi';

export async function GET(request, { params }) {
  const { ocid } = await params;
  try {
    const data = await getCharacterSymbolEquipment(ocid);
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching rune data:', error.message);
    return Response.json(
      { error: 'Failed to fetch rune data' },
      { status: 500 }
    );
  }
}
