import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const API_KEY = process.env.API_KEY

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    // Validate date parameter
    if (dateParam) {
      const requestedDate = new Date(dateParam)
      const minDate = new Date('2025-10-14')
      
      if (requestedDate < minDate) {
        return Response.json({ 
          error: 'Date cannot be earlier than 2025-10-14 (API data availability)' 
        }, { status: 400 })
      }
    }
    
    const apiParams = { ocid: id }
    
    if (dateParam) {
      // Explicit date parameter provided
      apiParams.date = dateParam
    } else {
      // No date parameter - determine which date to request based on current time
      const now = new Date()
      const currentHour = now.getHours()
      
      // Between 00:00 and 01:00, request yesterday's data
      // After 01:00, request today's data
      if (currentHour >= 0 && currentHour < 1) {
        // Request yesterday's data
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        const yesterdayString = yesterday.getFullYear() + '-' + 
          String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
          String(yesterday.getDate()).padStart(2, '0')
        apiParams.date = yesterdayString
      }
      // After 01:00, no date parameter means today's data (handled by API default)
    }
    
    const response = await axios.get(`${API_BASE_URL}/character/basic`, {
      params: apiParams,
      headers: {
        'accept': 'application/json',
        'x-nxopen-api-key': API_KEY
      }
    })
    return Response.json(response.data)
  } catch (error) {
    console.error('Error fetching character:', error.response?.data || error.message)
    return Response.json({ error: 'Failed to fetch character' }, { status: 500 })
  }
}