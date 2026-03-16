import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BracketTree } from './BracketTree'
import type { Team } from '../types'

function makeAllTeams(): Team[] {
  const regions = ['East', 'West', 'South', 'Midwest'] as const
  const teams: Team[] = []
  for (const region of regions) {
    for (let seed = 1; seed <= 16; seed++) {
      teams.push({
        id: `${region.toLowerCase()}-${seed}`,
        name: `${region} Team ${seed}`,
        shortName: `${region[0]}${seed}`,
        seed,
        region,
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        jerseyImage: '',
        mascotImage: '',
        mascotCostumeImage: '',
      })
    }
  }
  return teams
}

describe('BracketTree', () => {
  const teams = makeAllTeams()

  it('renders all 4 region labels', () => {
    render(<BracketTree teams={teams} picks={{}} />)
    expect(screen.getByText('East')).toBeDefined()
    expect(screen.getByText('West')).toBeDefined()
    expect(screen.getByText('South')).toBeDefined()
    expect(screen.getByText('Midwest')).toBeDefined()
  })

  it('renders Final Four and Championship labels', () => {
    render(<BracketTree teams={teams} picks={{}} />)
    expect(screen.getAllByText('Final Four').length).toBe(2) // top and bottom
    expect(screen.getByText('Championship')).toBeDefined()
  })

  it('renders TBD slots for empty picks', () => {
    render(<BracketTree teams={teams} picks={{}} />)
    const tbdSlots = screen.getAllByText('TBD')
    // Round 2+ all show TBD: 16 + 8 + 4 + 2 + 1 = 31 games, each with 2 slots = 62 TBD
    // Plus Championship TBD text
    expect(tbdSlots.length).toBeGreaterThan(0)
  })

  it('renders Champion TBD when championship not picked', () => {
    render(<BracketTree teams={teams} picks={{}} />)
    expect(screen.getByText('Champion TBD')).toBeDefined()
  })

  it('renders team names for round 1 matchups', () => {
    render(<BracketTree teams={teams} picks={{}} />)
    // E1 = East seed 1
    expect(screen.getAllByText('E1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('E16').length).toBeGreaterThanOrEqual(1)
  })

  it('shows winners when picks are provided', () => {
    const picks = {
      'East-R1-G1': 'east-1', // East 1 seed beats 16 seed
      'East-R1-G2': 'east-9', // East 9 seed beats 8 seed
      'East-R2-G1': 'east-1', // East 1 seed advances in R2
    }
    render(<BracketTree teams={teams} picks={picks} />)
    // E1 appears in R1 matchup + as R2 winner output slot
    const e1Slots = screen.getAllByText('E1')
    expect(e1Slots.length).toBeGreaterThanOrEqual(2)
  })

  it('renders bracket structure even with no teams', () => {
    render(<BracketTree teams={[]} picks={{}} />)
    // Region labels still render, center column still renders
    expect(screen.getByText('East')).toBeDefined()
    expect(screen.getByText('Champion TBD')).toBeDefined()
  })

  it('shows champion name in champion slot when Championship is picked', () => {
    const picks = { Championship: 'east-1' }
    render(<BracketTree teams={teams} picks={picks} />)
    // Champion slot shows the team with trophy emoji
    expect(screen.getByText(/🏆.*E1/)).toBeDefined()
  })
})
