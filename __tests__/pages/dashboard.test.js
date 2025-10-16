import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../../app/dashboard/page'

// Mock fetch
global.fetch = jest.fn()

describe('Dashboard', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('shows search form initially', () => {
    render(<Dashboard />)
    expect(screen.getByText('角色儀表板')).toBeInTheDocument()
    expect(screen.getByLabelText('角色名稱')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '搜尋' })).toBeInTheDocument()
  })

  it('shows loading state during search', async () => {
    fetch.mockImplementationOnce(() => new Promise(() => {})) // Never resolves
    
    render(<Dashboard />)
    
    const input = screen.getByLabelText('角色名稱')
    const button = screen.getByRole('button', { name: '搜尋' })
    
    // Simulate user input and submit
    await userEvent.type(input, 'Test Character')
    await userEvent.click(button)
    
    expect(screen.getByRole('button', { name: '搜尋中...' })).toBeInTheDocument()
  })

  it('displays character after successful search', async () => {
    const mockCharacter = {
      character_name: 'Test Character',
      character_level: 50,
      character_class: 'Warrior',
      character_exp_rate: 0.75,
      character_image: 'https://example.com/avatar.jpg',
      character_gender: 'Male',
      date: '2023-10-01T00:00:00Z'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ocid: 'test-ocid' })
    })
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCharacter
    })
    
    render(<Dashboard />)
    
    const input = screen.getByLabelText('角色名稱')
    const button = screen.getByRole('button', { name: '搜尋' })
    
    await userEvent.type(input, 'Test Character')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Test Character')).toBeInTheDocument()
    })
  })

  it('shows error message on search failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(<Dashboard />)
    
    const input = screen.getByLabelText('角色名稱')
    const button = screen.getByRole('button', { name: '搜尋' })
    
    await userEvent.type(input, 'Test Character')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})