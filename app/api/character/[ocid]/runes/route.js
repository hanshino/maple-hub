import axios from 'axios';

export async function GET(request, { params }) {
  const { ocid } = await params;
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const response = await axios.get(
      `https://open.api.nexon.com/maplestorytw/v1/character/symbol-equipment?ocid=${ocid}`,
      { headers: { 'x-nxopen-api-key': apiKey } }
    );
    return Response.json(response.data);
  } catch (error) {
    console.error(
      'Error fetching rune data:',
      error.response?.data || error.message
    );
    return Response.json(
      { error: 'Failed to fetch rune data' },
      { status: error.response?.status || 500 }
    );
  }
}
