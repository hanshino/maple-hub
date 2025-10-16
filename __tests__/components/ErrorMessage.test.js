import { render, screen } from '@testing-library/react'
import ErrorMessage from '../../components/ErrorMessage'

describe('ErrorMessage', () => {
  it('renders error message correctly', () => {
    const errorMessage = 'Something went wrong'
    render(<ErrorMessage message={errorMessage} />)

    expect(screen.getByText('錯誤')).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('renders with custom title', () => {
    const errorMessage = 'Network error'
    const title = 'Connection Failed'
    render(<ErrorMessage message={errorMessage} title={title} />)

    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const errorMessage = 'Temporary error'
    const mockOnRetry = jest.fn()
    render(<ErrorMessage message={errorMessage} onRetry={mockOnRetry} />)

    const retryButton = screen.getByRole('button', { name: /重試/i })
    expect(retryButton).toBeInTheDocument()

    retryButton.click()
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('does not render retry button when onRetry is not provided', () => {
    const errorMessage = 'Permanent error'
    render(<ErrorMessage message={errorMessage} />)

    const retryButton = screen.queryByRole('button', { name: /retry/i })
    expect(retryButton).not.toBeInTheDocument()
  })

  it('applies correct MUI classes', () => {
    const errorMessage = 'Test error'
    render(<ErrorMessage message={errorMessage} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('MuiAlert-root', 'MuiAlert-colorError')
  })
})