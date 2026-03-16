import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('renders default title and message', () => {
    render(<ErrorState message="Something went wrong" />)
    expect(screen.getByText('Oops!')).toBeDefined()
    expect(screen.getByText('Something went wrong')).toBeDefined()
  })

  it('renders custom title', () => {
    render(<ErrorState title="Not Found" message="Bracket not found" />)
    expect(screen.getByText('Not Found')).toBeDefined()
  })

  it('has role="alert" for screen readers', () => {
    render(<ErrorState message="Error" />)
    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Error" onRetry={onRetry} />)
    const button = screen.getByText('Try Again')
    expect(button).toBeDefined()
    fireEvent.click(button)
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders custom retry label', () => {
    render(<ErrorState message="Error" onRetry={() => {}} retryLabel="Go Home" />)
    expect(screen.getByText('Go Home')).toBeDefined()
  })

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState message="Error" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
