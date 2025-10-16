import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import DashboardProgress from '../../app/dashboard-progress/page'

// Mock fetch
global.fetch = jest.fn()

describe('Dashboard Progress', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    fetch.mockClear()
  })

  it('displays progress statistics', async () => {
    const mockCharacter = {
      character_name: 'Test Character',
      character_level: 50,
      character_exp_rate: '75.5',
      date: '2023-10-01T00:00:00Z'
    }
    
    // Mock search API
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ocid: '123'})
    })
    
    // Mock multiple character API calls (generateDateRange(7) returns 7 dates)
    for (let i = 0; i < 7; i++) {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockCharacter, character_exp_rate: `${74.0 + i * 0.5}` })
      })
    }
    
    render(<DashboardProgress />)
    
    const input = screen.getByPlaceholderText('輸入角色名稱')
    fireEvent.change(input, { target: { value: 'Test Character' } })
    
    const button = screen.getByRole('button', { name: '搜尋' })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Test Character')).toBeInTheDocument()
      expect(screen.getByText('進度視覺化')).toBeInTheDocument()
    })
  })

  it('shows error on fetch failure', async () => {
    // Override fetch to always reject for this test
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))
    
    render(<DashboardProgress />)
    
    const input = screen.getByPlaceholderText('輸入角色名稱')
    fireEvent.change(input, { target: { value: 'Test Character' } })
    
    const button = screen.getByRole('button', { name: '搜尋' })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /重試/i })).toBeInTheDocument()
    })
  })
})