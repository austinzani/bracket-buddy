import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingState } from './LoadingState'

describe('LoadingState', () => {
  it('renders default loading message', () => {
    render(<LoadingState />)
    expect(screen.getByText('Loading...')).toBeDefined()
  })

  it('renders custom message', () => {
    render(<LoadingState message="Loading teams..." />)
    expect(screen.getByText('Loading teams...')).toBeDefined()
  })

  it('has role="status" for screen readers', () => {
    render(<LoadingState />)
    expect(screen.getByRole('status')).toBeDefined()
  })

  it('renders bouncing basketball with aria-hidden', () => {
    render(<LoadingState />)
    const basketball = screen.getByText('🏀')
    expect(basketball.getAttribute('aria-hidden')).toBe('true')
  })
})
