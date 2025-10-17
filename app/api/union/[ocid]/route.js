import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.API_KEY;

export async function GET(request, { params }) {
  try {
    const { ocid } = await params;

    const response = await axios.get(`${API_BASE_URL}/user/union`, {
      params: { ocid },
      headers: {
        accept: 'application/json',
        'x-nxopen-api-key': API_KEY,
      },
    });

    return Response.json(response.data);
  } catch (error) {
    console.error(
      'Error fetching union data:',
      error.response?.data || error.message
    );
    return Response.json(
      { error: 'Failed to fetch union data' },
      { status: 500 }
    );
  }
}
