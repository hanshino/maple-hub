import { render, screen } from '@testing-library/react'
import ProgressBar from '../../components/ProgressBar'

describe('ProgressBar', () => {
  it('renders progress bar with percentage', () => {
    render(<ProgressBar progress={0.75} />)
    
    expect(screen.getByText('75.0%')).toBeInTheDocument()
  })

  it('renders progress bar with 0% for invalid progress', () => {
    render(<ProgressBar progress={-0.1} />)
    
    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })

  it('renders progress bar with 100% for progress over 1', () => {
    render(<ProgressBar progress={1.5} />)
    
    expect(screen.getByText('100.0%')).toBeInTheDocument()
  })

  it('shows estimated time to level up', () => {
    render(<ProgressBar progress={0.5} expRate={10} />)
    
    expect(screen.getByText('預計時間: 5.0 小時')).toBeInTheDocument()
  })
})