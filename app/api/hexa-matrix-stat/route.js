import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.API_KEY;

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
    const response = await axios.get(
      `${API_BASE_URL}/character/hexamatrix-stat`,
      {
        params: { ocid },
        headers: {
          accept: 'application/json',
          'x-nxopen-api-key': API_KEY,
        },
        timeout: 10000,
      }
    );

    // Combine all hexa stat core arrays
    const combinedCores = [];

    // Check for all fields that contain 'hexa_stat_core' but exclude preset fields
    Object.keys(response.data).forEach(key => {
      if (
        key.includes('hexa_stat_core') &&
        !key.startsWith('preset_') &&
        Array.isArray(response.data[key])
      ) {
        combinedCores.push(...response.data[key]);
      }
    });

    const combinedData = {
      ...response.data,
      character_hexa_stat_core: combinedCores,
    };

    return Response.json(combinedData);
  } catch (error) {
    console.error(
      'Error fetching Hexa Matrix Stat data:',
      error.response?.data || error.message
    );
    return Response.json(
      { error: 'Failed to fetch Hexa Matrix Stat data' },
      { status: 500 }
    );
  }
}
