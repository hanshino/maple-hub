import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.game.com/v1'

export async function GET() {
  try {
    const response = await axios.get(`${API_BASE_URL}/characters`)
    return Response.json(response.data)
  } catch (error) {
    console.error('Error fetching characters:', error)
    return Response.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
}