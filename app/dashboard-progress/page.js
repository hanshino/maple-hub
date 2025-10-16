'use client'

import { useState, useEffect } from 'react'
import { Container, Grid, Typography, TextField, Button, Box, Paper, Card, CardContent } from '@mui/material'
import CharacterCard from '../../components/CharacterCard'
import ProgressChart from '../../components/ProgressChart'
import ErrorMessage from '../../components/ErrorMessage'
import { generateDateRange } from '../../lib/progressUtils'
import { apiCall, sequentialApiCalls } from '../../lib/apiUtils'

export default function DashboardProgress() {
  const [character, setCharacter] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [characterName, setCharacterName] = useState('')

  const searchCharacter = async (name) => {
    setLoading(true)
    setError(null)
    try {
      // First get ocid
      const searchResponse = await apiCall(`/api/character/search?name=${encodeURIComponent(name)}`)
      if (!searchResponse.ok) throw new Error('Search failed')
      const searchData = await searchResponse.json()
      
      // Get data for the last 5 days (but only available dates after 2025-10-15)
      const dateConfigs = generateDateRange(7)
      const apiUrls = dateConfigs.map(config => 
        `/api/characters/${searchData.ocid}${config.needsDateParam ? `?date=${config.date}` : ''}`
      )
      
      // Execute API calls sequentially to respect rate limits
      const characterResponses = await sequentialApiCalls(apiUrls)
      
      // Process responses
      const characterResults = await Promise.all(
        characterResponses.map(async (response) => {
          if (response && response.ok) {
            try {
              return await response.json()
            } catch {
              return null
            }
          }
          return null
        })
      )
      
      // Filter out failed requests and get the most recent successful data
      const validCharacters = characterResults.filter(char => char !== null)
      const latestCharacter = validCharacters[validCharacters.length - 1]
      
      if (!latestCharacter) {
        throw new Error('No character data available')
      }
      
      setCharacter(latestCharacter)
      
      // Prepare chart data from all valid characters
      const chartData = characterResults
        .map((char, index) => char ? {
          date: dateConfigs[index].date,
          progress: parseFloat(char.character_exp_rate || 0)
        } : null)
        .filter(item => item !== null)
      
      // Always ensure we have at least current data for the chart
      if (chartData.length === 0 && latestCharacter) {
        const currentProgress = parseFloat(latestCharacter.character_exp_rate || 0)
        const singleDataPoint = [{
          date: new Date().toISOString().split('T')[0],
          progress: currentProgress
        }]
        setChartData(singleDataPoint)
      } else {
        setChartData(chartData)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (characterName.trim()) {
      searchCharacter(characterName.trim())
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        進度追蹤儀表板
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            fullWidth
            label="角色名稱"
            variant="outlined"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="輸入角色名稱"
            sx={{ flex: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            size="large"
            sx={{ minWidth: 120, height: 56 }}
          >
            {loading ? '搜尋中...' : '搜尋'}
          </Button>
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            正在載入角色資料...
          </Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ mb: 4 }}>
          <ErrorMessage
            message={error}
            onRetry={() => searchCharacter(characterName.trim())}
          />
        </Box>
      )}

      {character && (
        <Grid container spacing={4}>
          <Grid xs={12} md={6} lg={4}>
            <Card elevation={3}>
              <CardContent sx={{ p: 0 }}>
                <CharacterCard character={character} historicalData={chartData} />
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} md={6} lg={8}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  進度視覺化
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <ProgressChart progressData={chartData} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  )
}