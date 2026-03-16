import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BracketSlot } from './BracketSlot'
import type { Team } from '../types'

const makeTeam = (overrides?: Partial<Team>): Team => ({
  id: 'duke',
  name: 'Duke Blue Devils',
  shortName: 'Duke',
  seed: 1,
  region: 'East',
  primaryColor: '#003087',
  secondaryColor: '#FFFFFF',
  jerseyImage: '',
  mascotImage: '/assets/mascots/duke.png',
  mascotCostumeImage: '',
  ...overrides,
})

describe('BracketSlot', () => {
  it('renders team short name', () => {
    render(<BracketSlot team={makeTeam()} />)
    expect(screen.getByText('Duke')).toBeDefined()
  })

  it('renders seed number', () => {
    render(<BracketSlot team={makeTeam()} />)
    expect(screen.getByText('1')).toBeDefined()
  })

  it('renders TBD for empty slot', () => {
    render(<BracketSlot team={null} />)
    expect(screen.getByText('TBD')).toBeDefined()
  })

  it('highlights winner with team primary color', () => {
    const { container } = render(<BracketSlot team={makeTeam()} isWinner />)
    const slot = container.firstChild as HTMLElement
    expect(slot.style.backgroundColor).toBe('rgb(0, 48, 135)')
    expect(slot.style.opacity).toBe('1')
  })

  it('dims non-winner slots', () => {
    const { container } = render(<BracketSlot team={makeTeam()} isWinner={false} />)
    const slot = container.firstChild as HTMLElement
    expect(slot.style.opacity).toBe('0.7')
  })

  it('shows team name in title attribute', () => {
    render(<BracketSlot team={makeTeam()} />)
    expect(screen.getByTitle('Duke Blue Devils')).toBeDefined()
  })

  it('hides mascot image in compact mode', () => {
    render(<BracketSlot team={makeTeam()} compact />)
    const imgs = screen.queryAllByRole('img')
    expect(imgs.length).toBe(0)
  })
})
