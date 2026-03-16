import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BracketCard } from './BracketCard'
import type { Bracket } from '../types'

const makeBracket = (overrides?: Partial<Bracket>): Bracket => ({
  bracketId: 'test-id',
  name: "Emma's Bracket",
  createdAt: '2026-03-15T10:00:00Z',
  updatedAt: '2026-03-15T11:00:00Z',
  picks: {},
  ...overrides,
})

describe('BracketCard', () => {
  const defaultProps = {
    onContinue: vi.fn(),
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('renders bracket name', () => {
    render(<BracketCard bracket={makeBracket()} {...defaultProps} />)
    expect(screen.getByText("Emma's Bracket")).toBeDefined()
  })

  it('renders created date', () => {
    render(<BracketCard bracket={makeBracket()} {...defaultProps} />)
    expect(screen.getByText(/Mar 15, 2026/)).toBeDefined()
  })

  it('renders progress as 0 of 63 for empty bracket', () => {
    render(<BracketCard bracket={makeBracket()} {...defaultProps} />)
    expect(screen.getByText('0 of 63 picks')).toBeDefined()
  })

  it('renders progress with pick count', () => {
    const picks = { 'East-R1-G1': 'duke', 'East-R1-G2': 'unc' }
    render(<BracketCard bracket={makeBracket({ picks })} {...defaultProps} />)
    expect(screen.getByText('2 of 63 picks')).toBeDefined()
  })

  it('shows Continue button for incomplete brackets', () => {
    render(<BracketCard bracket={makeBracket()} {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined()
  })

  it('shows View button for complete brackets', () => {
    // Create 63 picks
    const picks: Record<string, string> = {}
    for (let i = 0; i < 63; i++) picks[`game-${i}`] = 'team'
    render(<BracketCard bracket={makeBracket({ picks })} {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'View' })).toBeDefined()
  })

  it('shows Complete badge for complete brackets', () => {
    const picks: Record<string, string> = {}
    for (let i = 0; i < 63; i++) picks[`game-${i}`] = 'team'
    render(<BracketCard bracket={makeBracket({ picks })} {...defaultProps} />)
    expect(screen.getByText('Complete')).toBeDefined()
  })

  it('calls onContinue when Continue is clicked', () => {
    const onContinue = vi.fn()
    render(<BracketCard bracket={makeBracket()} {...defaultProps} onContinue={onContinue} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onContinue).toHaveBeenCalledWith('test-id')
  })

  it('shows delete confirmation on Delete click', () => {
    render(<BracketCard bracket={makeBracket()} {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }))
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDefined()
  })

  it('calls onDelete after confirming delete', () => {
    const onDelete = vi.fn()
    render(<BracketCard bracket={makeBracket()} {...defaultProps} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(onDelete).toHaveBeenCalledWith('test-id')
  })

  it('cancels delete when Cancel is clicked', () => {
    const onDelete = vi.fn()
    render(<BracketCard bracket={makeBracket()} {...defaultProps} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onDelete).not.toHaveBeenCalled()
    // Should be back to showing Delete button
    expect(screen.getByRole('button', { name: /Delete/ })).toBeDefined()
  })

  it('shows Edit button for complete brackets', () => {
    const picks: Record<string, string> = {}
    for (let i = 0; i < 63; i++) picks[`game-${i}`] = 'team'
    render(<BracketCard bracket={makeBracket({ picks })} {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDefined()
  })
})
