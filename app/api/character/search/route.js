import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.API_KEY;

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
    const response = await axios.get(`${API_BASE_URL}/id`, {
      params: { character_name: characterName },
      headers: {
        accept: 'application/json',
        'x-nxopen-api-key': API_KEY,
      },
    });
    return Response.json(response.data);
  } catch (error) {
    console.error(
      'Error searching character:',
      error.response?.data || error.message
    );
    return Response.json(
      { error: 'Failed to search character' },
      { status: 500 }
    );
  }
}
