import { getCharacterHexaMatrixStat } from '../../../lib/nexonApi';

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
    const data = await getCharacterHexaMatrixStat(ocid);

    // Combine all hexa stat core arrays
    const combinedCores = [];
    Object.keys(data).forEach(key => {
      if (
        key.includes('hexa_stat_core') &&
        !key.startsWith('preset_') &&
        Array.isArray(data[key])
      ) {
        combinedCores.push(...data[key]);
      }
    });

    return Response.json({
      ...data,
      character_hexa_stat_core: combinedCores,
    });
  } catch (error) {
    console.error('Error fetching Hexa Matrix Stat data:', error.message);
    return Response.json(
      { error: 'Failed to fetch Hexa Matrix Stat data' },
      { status: 500 }
    );
  }
}
