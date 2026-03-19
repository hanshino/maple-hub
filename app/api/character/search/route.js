import { getCharacterOcid } from '@/lib/nexonApi';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const characterName = searchParams.get('name');

  if (!characterName) {
    return Response.json(
      { error: 'Character name is required' },
      { status: 400 }
    );
  }

  try {
    const ocid = await getCharacterOcid(characterName);
    return Response.json({ ocid });
  } catch (error) {
    console.error('Error searching character:', error.message);
    return Response.json(
      { error: 'Failed to search character' },
      { status: 500 }
    );
  }
}
