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
    const response = await axios.get(`${API_BASE_URL}/character/hexamatrix`, {
      params: { ocid },
      headers: {
        accept: 'application/json',
        'x-nxopen-api-key': API_KEY,
      },
      timeout: 10000,
    });
    return Response.json(response.data);
  } catch (error) {
    console.error(
      'Error fetching Hexa Matrix data:',
      error.response?.data || error.message
    );
    return Response.json(
      { error: 'Failed to fetch Hexa Matrix data' },
      { status: 500 }
    );
  }
}
